import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
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
import { listGoldRushX402Endpoints } from "./goldrush-x402.js";

const DEFAULT_MCP_SERVER_URL = "https://mcgold.onrender.com/mcp";
const RPC_URL =
  process.env.VENUM_RPC_URL?.trim() || "https://api.devnet.solana.com";
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const FACILITATOR_URL = "https://facilitator.payai.network";
const MCP_ACCEPT_HEADER = "application/json, text/event-stream";
const MAX_TOOL_CALLS = 5;

const PRICE_BY_TOOL_USDC: Record<string, number> = {
  assess_wallet_risk: 0.02,
  trace_whale_activity: 0.01,
  score_counterparty_trust: 0.03,
};

const COLOR = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

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

type PaymentPayloadV2 = {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepted: Record<string, unknown>;
  payload: { transaction?: string; signature?: string };
};

type PaymentRequirement = {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset: string;
  extra?: Record<string, unknown>;
};

type ToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function println(message = ""): void {
  console.log(message);
}

function colorize(color: string, message: string): string {
  return `${color}${message}${COLOR.reset}`;
}

function logAgent(message: string): void {
  println(colorize(COLOR.cyan, `[AGENT] ${message}`));
}

function logClaude(message: string): void {
  println(colorize(COLOR.blue, `[CLAUDE] ${message}`));
}

function logPay(message: string): void {
  println(colorize(COLOR.yellow, `[PAY] ${message}`));
}

function logTool(message: string): void {
  println(colorize(COLOR.green, `[TOOL] ${message}`));
}

function logError(message: string): void {
  println(colorize(COLOR.red, `[ERROR] ${message}`));
}

function formatUsd(amount: number): string {
  return amount.toFixed(2);
}

function truncate(text: string, max = 800): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function parseJsonSafely<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

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

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() ?? fallback ?? "";
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function extractTextFromToolResult(result: unknown): string {
  const parsed = result as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const textPart = parsed?.content?.find((c) => c.type === "text" && c.text)?.text;
  if (textPart) return textPart;
  return JSON.stringify(result, null, 2);
}

async function main(): Promise<void> {
  const started = Date.now();

  const walletA =
    process.argv[2]?.trim() ?? "4dHc2cag4hmVeMFuFHF2Gjc4BoUiKFFMCTGfiWmyMsvx";
  const walletB =
    process.argv[3]?.trim() ?? "9sHdrUkpXAr4wQeKMh4RGKepDHX11RK5uZQoCmR5Y5zR";
  const mcpUrl = process.env.MCP_SERVER_URL?.trim() || DEFAULT_MCP_SERVER_URL;
  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");
  const keypairPath = requireEnv("MCPAY_KEYPAIR_PATH");
  const recipientWallet = process.env.MCPAY_RECIPIENT_WALLET?.trim();
  const anthropicModel =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  const keypair = await loadKeypair(keypairPath);
  const connection = new Connection(RPC_URL, "confirmed");
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  let rpcId = 1;
  let activeToolName = "";
  let latestPaymentRequirement: PaymentRequirement | null = null;
  let latestPaymentTxSignature: string | null = null;
  const paymentSignatures: string[] = [];
  let totalSpent = 0;
  let toolCalls = 0;

  const preAgentAtomic = await getUsdcBalanceAtomic(connection, keypair.publicKey);
  const preRecipientAtomic =
    recipientWallet && PublicKey.isOnCurve(recipientWallet)
      ? await getUsdcBalanceAtomic(connection, new PublicKey(recipientWallet))
      : null;

  println();
  logAgent("Starting counterparty trust analysis");
  logAgent(`My wallet:    ${walletA}`);
  logAgent(`Alice wallet: ${walletB}`);
  logAgent(`MCP server:   ${mcpUrl}`);
  if (process.env.ENABLE_GOLDRUSH_X402_DISCOVERY?.trim() === "1") {
    try {
      const endpoints = await listGoldRushX402Endpoints();
      logAgent(`GoldRush x402 discovery endpoints found: ${endpoints.length}`);
    } catch (err) {
      logAgent(
        `GoldRush x402 discovery unavailable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  println();
  await sleep(1000);

  const adapter = {
    address: keypair.publicKey.toBase58(),
    publicKey: keypair.publicKey as PublicKey,
    signTransaction: async (
      tx: VersionedTransaction
    ): Promise<VersionedTransaction> => {
      tx.sign([keypair]);
      return tx;
    },
  };

  const broadcastedTransactions = new Map<string, string>();

  const customFetch: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (!headers.get("Accept")) headers.set("Accept", MCP_ACCEPT_HEADER);
    if (!headers.get("Content-Type")) headers.set("Content-Type", "application/json");

    const paymentSignatureHeader = headers.get("PAYMENT-SIGNATURE");
    if (paymentSignatureHeader) {
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
      }

      decodedPayload.payload.signature = broadcastSignature;
      headers.set("PAYMENT-SIGNATURE", encodePaymentHeader(decodedPayload));
      latestPaymentTxSignature = broadcastSignature;
      paymentSignatures.push(broadcastSignature);
      logPay(`Payment tx: ${broadcastSignature}`);
      logPay(
        `Explorer: https://explorer.solana.com/tx/${broadcastSignature}?cluster=devnet`
      );
      logPay("USDC transferred successfully");
      await sleep(1000);
    }

    const response = await fetch(input, { ...init, headers });
    if (response.status === 402) return response;

    if (!paymentSignatureHeader && response.status === 200) {
      const responseText = await response.clone().text();
      const envelope = extractMcpPaymentRequired(responseText);
      if (envelope?.data?.paymentRequiredHeader && envelope.data.paymentRequired) {
        const paymentRequired = envelope.data.paymentRequired as {
          accepts?: PaymentRequirement[];
        };
        latestPaymentRequirement = paymentRequired.accepts?.[0] ?? null;
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
    amount: BigInt(200_000),
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
      ? await x402Client.fetch(mcpUrl, requestInit)
      : await fetch(mcpUrl, requestInit);
    const text = await response.text();
    return JSON.parse(text) as JsonRpcResponse<T>;
  }

  type ToolsListResult = {
    tools?: Array<{
      name?: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
      input_schema?: Record<string, unknown>;
    }>;
  };

  const toolsList = await rpcCall<ToolsListResult>("tools/list");
  if (toolsList.error) {
    throw new Error(
      `tools/list failed (${toolsList.error.code}): ${toolsList.error.message}`
    );
  }

  const allowed = new Set([
    "assess_wallet_risk",
    "trace_whale_activity",
    "score_counterparty_trust",
  ]);
  const anthropicTools: ToolDef[] = (toolsList.result?.tools ?? [])
    .filter((tool) => tool.name && allowed.has(tool.name))
    .map((tool) => ({
      name: tool.name!,
      description: tool.description ?? "",
      input_schema: (tool.inputSchema ?? tool.input_schema ?? {
        type: "object",
        properties: {},
      }) as Record<string, unknown>,
    }));

  if (anthropicTools.length === 0) {
    throw new Error("No MCP tools discovered for Anthropic tool use");
  }

  const systemPrompt =
    "You are a Solana wallet security advisor. The user is about to receive funds from a counterparty and wants to know if it's safe. " +
    "You have access to three paid Solana intelligence tools: assess_wallet_risk, trace_whale_activity, and score_counterparty_trust.\n\n" +
    "Given the user's situation, decide which tools to call and in what order to build a clear picture. When calling tools, be thoughtful about cost — each tool call costs USDC. Start with the most informative tool for this specific question.\n\n" +
    "After gathering data, produce a clear recommendation: PROCEED, PROCEED_WITH_CAUTION, or DECLINE, with 2-3 sentences of reasoning that reference specific findings.";

  const userPrompt = `A contact named Alice (wallet: ${walletB}) wants to send a large transfer to my wallet (${walletA}). Should I accept?`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userPrompt,
    },
  ];

  let finalAnswer: string | null = null;

  for (let step = 0; step < MAX_TOOL_CALLS + 1; step++) {
    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model: anthropicModel,
        max_tokens: 1200,
        system: systemPrompt,
        tools: anthropicTools,
        messages,
      });
    } catch (err) {
      throw new Error(
        `Claude API call failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const textChunks = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text.trim())
      .filter(Boolean);
    if (textChunks.length > 0) {
      for (const chunk of textChunks) {
        logClaude(chunk);
        println();
      }
      await sleep(1000);
    }

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    messages.push({
      role: "assistant",
      content: response.content,
    });

    if (toolUses.length === 0) {
      finalAnswer = textChunks.join("\n\n").trim() || "(No final response text)";
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      if (toolCalls >= MAX_TOOL_CALLS) {
        logError(`Tool call limit reached (${MAX_TOOL_CALLS}).`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          is_error: true,
          content: `Tool cap reached (${MAX_TOOL_CALLS}); provide final recommendation.`,
        });
        continue;
      }

      activeToolName = toolUse.name;
      const toolPrice = PRICE_BY_TOOL_USDC[activeToolName] ?? 0;
      latestPaymentTxSignature = null;
      logPay(`Calling ${activeToolName} (price: $${formatUsd(toolPrice)} USDC)`);

      let toolResultPayload: unknown = null;
      let toolError: string | null = null;

      try {
        const mcpResult = await rpcCall<unknown>(
          "tools/call",
          { name: toolUse.name, arguments: toolUse.input },
          true
        );
        if (mcpResult.error) {
          throw new Error(
            `MCP tools/call failed (${mcpResult.error.code}): ${mcpResult.error.message}`
          );
        }
        toolResultPayload = mcpResult.result;
        toolCalls += 1;
        totalSpent += toolPrice;
      } catch (err) {
        toolError = err instanceof Error ? err.message : String(err);
      }

      if (toolError) {
        logError(`${activeToolName} failed: ${toolError}`);
        println();
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          is_error: true,
          content: `Tool ${activeToolName} failed: ${toolError}`,
        });
      } else {
        const toolText = extractTextFromToolResult(toolResultPayload);
        logTool(`${activeToolName} result:\n${truncate(toolText, 1200)}`);
        println();
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: toolText,
        });
      }

      await sleep(1000);
    }

    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  const postAgentAtomic = await getUsdcBalanceAtomic(connection, keypair.publicKey);
  const postRecipientAtomic =
    recipientWallet && PublicKey.isOnCurve(recipientWallet)
      ? await getUsdcBalanceAtomic(connection, new PublicKey(recipientWallet))
      : null;

  const spentAtomic = preAgentAtomic - postAgentAtomic;
  const elapsedSeconds = ((Date.now() - started) / 1000).toFixed(1);

  println();
  if (finalAnswer) {
    logClaude(`Final recommendation: ${finalAnswer}`);
  } else {
    logError("No final recommendation produced.");
  }
  println();
  logAgent("Analysis complete");
  logAgent(
    `Total: $${formatUsd(totalSpent)} USDC across ${toolCalls} tool call${toolCalls === 1 ? "" : "s"}`
  );
  logAgent(
    `Agent USDC balance before: ${(Number(preAgentAtomic) / 1_000_000).toFixed(6)}`
  );
  logAgent(
    `Agent USDC balance after:  ${(Number(postAgentAtomic) / 1_000_000).toFixed(6)}`
  );
  logAgent(
    `Observed spent on-chain:   ${(Number(spentAtomic) / 1_000_000).toFixed(6)} USDC`
  );
  if (preRecipientAtomic !== null && postRecipientAtomic !== null) {
    const recipientDelta = postRecipientAtomic - preRecipientAtomic;
    logAgent(
      `Recipient delta on-chain: ${(Number(recipientDelta) / 1_000_000).toFixed(6)} USDC`
    );
  } else {
    println(colorize(COLOR.gray, "[AGENT] Recipient balance check skipped"));
  }
  if (paymentSignatures.length > 0) {
    const sample = paymentSignatures[0];
    logAgent(
      `Sample payment tx: ${sample} (https://explorer.solana.com/tx/${sample}?cluster=devnet)`
    );
  }
  logAgent(`Elapsed time: ${elapsedSeconds}s`);
}

void main().catch((err) => {
  logError(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
