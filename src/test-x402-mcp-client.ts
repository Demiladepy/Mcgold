import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createX402Client } from "x402-solana/client";

const TARGET_URL = "http://localhost:3000/mcp";
const RPC_URL = "https://api.devnet.solana.com";
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MCP_ACCEPT_HEADER = "application/json, text/event-stream";
const EXPECTED_PAYMENT_ATOMIC = BigInt(10_000);
const FACILITATOR_URL = "https://facilitator.payai.network";

type JsonRpcResponse<T = unknown> = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

type McpPaymentRequiredEnvelope = {
  error?: string;
  data?: {
    paymentRequired?: unknown;
    paymentRequiredHeader?: string;
  };
};

function log(stage: string, data?: unknown): void {
  const ts = new Date().toISOString();
  if (data === undefined) {
    console.log(`[${ts}] [test-x402-mcp-client] ${stage}`);
  } else {
    console.log(`[${ts}] [test-x402-mcp-client] ${stage}`, data);
  }
}

type PaymentPayloadV2 = {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepted: Record<string, unknown>;
  payload: { transaction?: string; signature?: string };
};

function decodePaymentHeader(paymentHeader: string): PaymentPayloadV2 {
  return JSON.parse(
    Buffer.from(paymentHeader, "base64").toString("utf8")
  ) as PaymentPayloadV2;
}

function encodePaymentHeader(payload: PaymentPayloadV2): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function isAllZeroSignature(sig: Uint8Array): boolean {
  return sig.every((b) => b === 0);
}

function extractAnyNonZeroSignatureBase58(rawTx: Uint8Array): string | null {
  try {
    const v0 = VersionedTransaction.deserialize(rawTx);
    const sig = v0.signatures.find((candidate) => !isAllZeroSignature(candidate));
    return sig ? bs58.encode(sig) : null;
  } catch {
    const legacy = Transaction.from(Buffer.from(rawTx));
    const sig = legacy.signatures
      .map((entry) => entry.signature)
      .find((candidate): candidate is Buffer => Boolean(candidate));
    return sig ? bs58.encode(sig) : null;
  }
}

async function getUsdcBalanceAtomic(
  connection: Connection,
  owner: PublicKey
): Promise<bigint> {
  const mint = new PublicKey(USDC_DEVNET_MINT);
  const ata = await getAssociatedTokenAddress(mint, owner, false);
  try {
    const balance = await connection.getTokenAccountBalance(ata, "confirmed");
    return BigInt(balance.value.amount);
  } catch {
    return BigInt(0);
  }
}

async function loadKeypair(path: string): Promise<Keypair> {
  const raw = await readFile(path, "utf8");
  const arr = JSON.parse(raw) as number[];
  if (!Array.isArray(arr) || (arr.length !== 64 && arr.length !== 32)) {
    throw new Error(
      `Invalid keypair JSON at ${path}: expected 32 or 64 numeric entries`
    );
  }
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function truncate(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function extractMcpPaymentRequired(
  responseText: string
): McpPaymentRequiredEnvelope | null {
  try {
    const parsed = JSON.parse(responseText) as {
      result?: {
        content?: Array<{ type?: string; text?: string }>;
      };
    };
    const textBlock = parsed.result?.content?.find(
      (entry) => entry.type === "text" && typeof entry.text === "string"
    )?.text;
    if (!textBlock) return null;
    const envelope = JSON.parse(textBlock) as McpPaymentRequiredEnvelope;
    if (envelope.error !== "payment_required") return null;
    if (!envelope.data?.paymentRequiredHeader || !envelope.data.paymentRequired) {
      return null;
    }
    return envelope;
  } catch {
    return null;
  }
}

type PaymentRequirement = {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset: string;
  extra?: Record<string, unknown>;
};

async function main(): Promise<void> {
  const startedMs = Date.now();
  let lastStage = "init";
  let paymentTxSignature: string | null = null;
  let rpcId = 1;

  try {
    const keypairPath = process.env.MCPAY_KEYPAIR_PATH?.trim();
    if (!keypairPath) {
      throw new Error("Missing MCPAY_KEYPAIR_PATH in environment");
    }

    lastStage = "load_keypair";
    const keypair = await loadKeypair(keypairPath);
    log("keypair loaded", {
      keypairPath,
      address: keypair.publicKey.toBase58(),
    });

    const connection = new Connection(RPC_URL, "confirmed");
    const preBalanceAtomic = await getUsdcBalanceAtomic(connection, keypair.publicKey);
    log("pre-test agent wallet USDC balance", {
      address: keypair.publicKey.toBase58(),
      mint: USDC_DEVNET_MINT,
      atomic: preBalanceAtomic.toString(),
      usdc: Number(preBalanceAtomic) / 1_000_000,
    });

    const adapter = {
      address: keypair.publicKey.toBase58(),
      publicKey: keypair.publicKey as PublicKey,
      signTransaction: async (
        tx: VersionedTransaction
      ): Promise<VersionedTransaction> => {
        log("payment transaction signed");
        tx.sign([keypair]);
        return tx;
      },
    };
    log("adapter ready", { address: adapter.address });
    const broadcastedTransactions = new Map<string, string>();
    let latestPaymentRequirement: PaymentRequirement | null = null;

    const customFetch: typeof fetch = async (input, init) => {
      const headers = new Headers(init?.headers);
      if (!headers.get("Accept")) {
        headers.set("Accept", MCP_ACCEPT_HEADER);
      }
      if (!headers.get("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const paymentSignatureHeader = headers.get("PAYMENT-SIGNATURE");
      if (paymentSignatureHeader) {
        lastStage = "settle_payment_before_retry";
        const decodedPayload = decodePaymentHeader(paymentSignatureHeader);
        const txBase64 = decodedPayload.payload.transaction;
        if (!txBase64) {
          throw new Error("PAYMENT-SIGNATURE payload missing transaction");
        }
        const rawTx = Buffer.from(txBase64, "base64");
        const localSig = extractAnyNonZeroSignatureBase58(rawTx);
        if (!localSig) {
          throw new Error("Signed payment transaction missing non-zero signatures");
        }
        log("payment signature found in signed tx", { localSig });
        if (!latestPaymentRequirement) {
          throw new Error("Missing payment requirements for settlement orchestration");
        }

        const txFingerprint = Buffer.from(rawTx).toString("base64");
        let broadcastSignature = broadcastedTransactions.get(txFingerprint);
        if (!broadcastSignature) {
          const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentPayload: decodedPayload,
              paymentRequirements: latestPaymentRequirement,
            }),
          });
          const settleText = await settleResponse.text();
          if (!settleResponse.ok) {
            throw new Error(
              `Facilitator settle failed (${settleResponse.status}): ${settleText}`
            );
          }
          const settleParsed = JSON.parse(settleText) as {
            success?: boolean;
            transaction?: string;
            errorReason?: string;
          };
          if (!settleParsed.success || !settleParsed.transaction) {
            throw new Error(
              `Facilitator settle did not return success transaction: ${settleText}`
            );
          }
          broadcastSignature = settleParsed.transaction;
          await connection.confirmTransaction(broadcastSignature, "confirmed");
          broadcastedTransactions.set(txFingerprint, broadcastSignature);
          log("payment submitted on devnet", {
            signature: broadcastSignature,
            explorerUrl: `https://explorer.solana.com/tx/${broadcastSignature}?cluster=devnet`,
          });
        }

        decodedPayload.payload.signature = broadcastSignature;
        const updatedHeader = encodePaymentHeader(decodedPayload);
        headers.set("PAYMENT-SIGNATURE", updatedHeader);
        paymentTxSignature = broadcastSignature;
        log("retry with PAYMENT-SIGNATURE", {
          headerLength: updatedHeader.length,
          paymentTxSignature,
        });
      }

      const response = await fetch(input, {
        ...init,
        headers,
      });
      if (response.status === 402) {
        log("payment required response received", {
          hasPaymentRequiredHeader: Boolean(
            response.headers.get("PAYMENT-REQUIRED")
          ),
        });
        return response;
      }

      // MCP wraps tool errors in JSON-RPC 200 responses.
      // Bridge MCP payment_required envelope into HTTP 402 so x402-solana can auto-pay.
      if (!paymentSignatureHeader && response.status === 200) {
        const responseText = await response.clone().text();
        const envelope = extractMcpPaymentRequired(responseText);
        if (envelope?.data?.paymentRequiredHeader && envelope.data.paymentRequired) {
          const paymentRequired = envelope.data.paymentRequired as {
            accepts?: PaymentRequirement[];
          };
          latestPaymentRequirement = paymentRequired.accepts?.[0] ?? null;
          log("payment required response received", {
            source: "mcp_jsonrpc_envelope",
            hasPaymentRequiredHeader: true,
          });
          return new Response(JSON.stringify(envelope.data.paymentRequired), {
            status: 402,
            headers: {
              "Content-Type": "application/json",
              "PAYMENT-REQUIRED": envelope.data.paymentRequiredHeader,
            },
          });
        }
      }
      return response;
    };

    const x402Client = createX402Client({
      wallet: adapter,
      network: "solana-devnet",
      rpcUrl: RPC_URL,
      amount: BigInt(200_000), // safety cap = 0.2 USDC
      verbose: true,
      customFetch,
    });

    async function rpcCall<T = unknown>(
      method: string,
      params?: Record<string, unknown>,
      paid = false
    ): Promise<JsonRpcResponse<T>> {
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id: rpcId++,
        method,
        params,
      });
      const requestInit: RequestInit = {
        method: "POST",
        headers: {
          Accept: MCP_ACCEPT_HEADER,
          "Content-Type": "application/json",
        },
        body,
      };
      const response = paid
        ? await x402Client.fetch(TARGET_URL, requestInit)
        : await fetch(TARGET_URL, requestInit);
      const text = await response.text();
      return JSON.parse(text) as JsonRpcResponse<T>;
    }

    lastStage = "tools_list";
    log("MCP tools/list request");
    const listRes = await rpcCall<{
      tools?: Array<{ name?: string; description?: string }>;
    }>("tools/list");
    if (listRes.error) {
      throw new Error(
        `tools/list failed (${listRes.error.code}): ${listRes.error.message}`
      );
    }

    const tools = listRes.result?.tools ?? [];
    const paidTools = tools
      .filter((tool) =>
        ["trace_whale_activity", "assess_wallet_risk", "score_counterparty_trust"].includes(
          tool.name ?? ""
        )
      )
      .map((tool) => ({
        name: tool.name ?? "unknown",
        description: tool.description ?? "",
      }));
    log("tools/list response (tool names + pricing)", paidTools);

    lastStage = "unpaid_trace_whale_activity";
    log("trace_whale_activity unpaid call attempt");
    const unpaidCall = await rpcCall("tools/call", {
      name: "trace_whale_activity",
      arguments: {
        mint: USDC_MAINNET_MINT,
        windowHours: 24,
      },
    });
    if (unpaidCall.error) {
      throw new Error(
        `Unpaid tools/call RPC error (${unpaidCall.error.code}): ${unpaidCall.error.message}`
      );
    }
    const unpaidText = JSON.stringify(unpaidCall.result);
    const sawPaymentRequired =
      unpaidText.includes("payment_required") ||
      unpaidText.includes("Payment required");
    log("payment required response received", { sawPaymentRequired });

    lastStage = "paid_trace_whale_activity";
    log("trace_whale_activity paid retry via x402 client");
    const paidCall = await rpcCall<unknown>(
      "tools/call",
      {
        name: "trace_whale_activity",
        arguments: {
          mint: USDC_MAINNET_MINT,
          windowHours: 24,
        },
      },
      true
    );
    if (paidCall.error) {
      throw new Error(
        `Paid tools/call RPC error (${paidCall.error.code}): ${paidCall.error.message}`
      );
    }

    const paidResultText = JSON.stringify(paidCall.result);
    log("final tool result received", {
      preview: truncate(paidResultText, 500),
    });

    log("payment submitted on devnet", {
      paymentTxSignature: paymentTxSignature ?? "unavailable",
    });

    const postBalanceAtomic = await getUsdcBalanceAtomic(connection, keypair.publicKey);
    log("post-test agent wallet USDC balance", {
      address: keypair.publicKey.toBase58(),
      mint: USDC_DEVNET_MINT,
      atomic: postBalanceAtomic.toString(),
      usdc: Number(postBalanceAtomic) / 1_000_000,
    });
    const spentAtomic = preBalanceAtomic - postBalanceAtomic;
    if (spentAtomic < EXPECTED_PAYMENT_ATOMIC) {
      log("LOUD FAILURE: on-chain balance did not decrease as expected", {
        expectedAtomic: EXPECTED_PAYMENT_ATOMIC.toString(),
        observedAtomic: spentAtomic.toString(),
      });
      throw new Error(
        `On-chain payment failed: expected at least ${EXPECTED_PAYMENT_ATOMIC.toString()} atomic spent, observed ${spentAtomic.toString()}`
      );
    }

    const elapsedMs = Date.now() - startedMs;
    log("total elapsed time", { elapsedMs });

    console.log("==========================================");
    console.log("SUCCESS");
    console.log(
      `Payment transaction signature: ${paymentTxSignature ?? "unavailable"}`
    );
    console.log(`Whale activity preview: ${truncate(paidResultText, 500)}`);
    console.log("==========================================");
  } catch (err) {
    const elapsedMs = Date.now() - startedMs;
    log("stage failed", {
      stage: lastStage,
      elapsedMs,
      error: err instanceof Error ? err.stack ?? err.message : String(err),
    });
    process.exit(1);
  }
}

void main();
