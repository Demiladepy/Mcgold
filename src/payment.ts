import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, Response } from "express";
import bs58 from "bs58";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { X402PaymentHandler } from "x402-solana/server";

const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const NETWORK = "solana-devnet";
const FACILITATOR_URL = "https://facilitator.payai.network";
const RPC_URL =
  process.env.VENUM_RPC_URL?.trim() || "https://api.devnet.solana.com";

type HttpContext = {
  req: Request;
  res: Response;
};

const httpContextStorage = new AsyncLocalStorage<HttpContext>();
const settlementStorage = new AsyncLocalStorage<Map<string, SettlementContext>>();

type SettlementContext = {
  paymentHeader: string;
  requirements: Awaited<ReturnType<X402PaymentHandler["createPaymentRequirements"]>>;
  onChainSignature: string;
};

const treasuryAddress = process.env.MCPAY_RECIPIENT_WALLET?.trim();
if (!treasuryAddress) {
  throw new Error("Missing MCPAY_RECIPIENT_WALLET in environment");
}

const x402 = new X402PaymentHandler({
  network: NETWORK,
  treasuryAddress,
  facilitatorUrl: FACILITATOR_URL,
  rpcUrl: RPC_URL,
});
const rpcConnection = new Connection(RPC_URL, "confirmed");

export class PaymentRequiredError extends Error {
  readonly code = "payment_required";
  readonly status = 402;

  constructor(
    readonly toolName: string,
    readonly data: {
      paymentRequired: Awaited<
        ReturnType<X402PaymentHandler["create402Response"]>
      >["body"];
      paymentRequiredHeader: string;
    }
  ) {
    super(`Payment required for ${toolName}`);
  }
}

function logPayment(message: string): void {
  console.log(`[payment] ${message}`);
}

function jsonForLog(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getHttpContext(): HttpContext {
  const context = httpContextStorage.getStore();
  if (!context) {
    throw new Error("Payment context unavailable: no active HTTP request");
  }
  return context;
}

function getSettlementMap(): Map<string, SettlementContext> {
  const map = settlementStorage.getStore();
  if (!map) {
    throw new Error("Payment context unavailable: no active settlement map");
  }
  return map;
}

function decodePaymentPayload(paymentHeader: string): {
  payload?: { transaction?: string; signature?: string };
} {
  const decoded = Buffer.from(paymentHeader, "base64").toString("utf8");
  return JSON.parse(decoded) as {
    payload?: { transaction?: string; signature?: string };
  };
}

function isAllZeroSignature(sig: Uint8Array): boolean {
  return sig.every((b) => b === 0);
}

function extractTransactionSignature(paymentHeader: string): string {
  const payload = decodePaymentPayload(paymentHeader);
  if (payload.payload?.signature) {
    return payload.payload.signature;
  }
  const txBase64 = payload.payload?.transaction;
  if (!txBase64) {
    throw new Error("Payment payload missing transaction");
  }
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
  const sig = tx.signatures.find((candidate) => !isAllZeroSignature(candidate));
  if (!sig) {
    throw new Error("Payment transaction contains no non-zero signatures");
  }
  return bs58.encode(sig);
}

function sumTokenAmountForOwner(
  balances:
    | Array<{
        owner?: string;
        mint?: string;
        uiTokenAmount?: { amount?: string };
      }>
    | null
    | undefined,
  owner: string,
  mint: string
): bigint {
  if (!balances) return BigInt(0);
  return balances.reduce((sum, entry) => {
    if (entry.owner !== owner || entry.mint !== mint) {
      return sum;
    }
    const raw = entry.uiTokenAmount?.amount ?? "0";
    return sum + BigInt(raw);
  }, BigInt(0));
}

async function verifyPaymentOnChain(
  paymentHeader: string,
  paymentRequirements: Awaited<
    ReturnType<X402PaymentHandler["createPaymentRequirements"]>
  >
): Promise<string> {
  const signature = extractTransactionSignature(paymentHeader);
  logPayment(`onchain-check tx=${signature} querying getTransaction`);
  const tx = await rpcConnection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    throw new Error(`Payment transaction not found on-chain: ${signature}`);
  }
  if (tx.meta?.err) {
    throw new Error(`Payment transaction failed on-chain: ${JSON.stringify(tx.meta.err)}`);
  }

  const expectedAmount = BigInt(
    paymentRequirements.amount ?? "0"
  );
  const recipientDelta =
    sumTokenAmountForOwner(
      tx.meta?.postTokenBalances,
      paymentRequirements.payTo,
      paymentRequirements.asset
    ) -
    sumTokenAmountForOwner(
      tx.meta?.preTokenBalances,
      paymentRequirements.payTo,
      paymentRequirements.asset
    );
  if (recipientDelta < expectedAmount) {
    throw new Error(
      `Recipient token delta too small. expected=${expectedAmount.toString()} actual=${recipientDelta.toString()}`
    );
  }

  logPayment(
    `onchain-check tx=${signature} passed recipient=${paymentRequirements.payTo} mint=${paymentRequirements.asset} expected=${expectedAmount.toString()} actualDelta=${recipientDelta.toString()}`
  );

  return signature;
}

async function createRequirements(
  toolName: string,
  priceAtomic: string
): Promise<Awaited<ReturnType<X402PaymentHandler["createPaymentRequirements"]>>> {
  const { req } = getHttpContext();
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return x402.createPaymentRequirements(
    {
      amount: priceAtomic,
      asset: {
        address: USDC_DEVNET_MINT,
        decimals: 6,
      },
      description: `Paid MCP tool call: ${toolName}`,
    },
    resourceUrl
  );
}

export function runWithHttpContext<T>(
  req: Request,
  res: Response,
  callback: () => Promise<T>
): Promise<T> {
  return httpContextStorage.run({ req, res }, () =>
    settlementStorage.run(new Map<string, SettlementContext>(), callback)
  );
}

export async function requirePayment(
  toolName: string,
  priceAtomic: string
): Promise<{ paid: true }> {
  const { req, res } = getHttpContext();
  const paymentHeader = x402.extractPayment(req.headers);
  logPayment(
    `tool=${toolName} header detected=${paymentHeader ? "yes" : "no"} path=${req.originalUrl}`
  );
  const paymentRequirements = await createRequirements(toolName, priceAtomic);
  const paymentRequired = x402.create402Response(
    paymentRequirements,
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  const paymentRequiredHeader = Buffer.from(
    JSON.stringify(paymentRequired.body)
  ).toString("base64");

  if (!paymentHeader) {
    logPayment(`tool=${toolName} received: no header -> returning 402`);
    logPayment(
      `tool=${toolName} payment_required_body=${jsonForLog(paymentRequired.body)}`
    );
    res.setHeader("PAYMENT-REQUIRED", paymentRequiredHeader);
    throw new PaymentRequiredError(toolName, {
      paymentRequired: paymentRequired.body,
      paymentRequiredHeader,
    });
  }

  let extractedTxId: string | null = null;
  try {
    extractedTxId = extractTransactionSignature(paymentHeader);
    logPayment(`tool=${toolName} extracted txid=${extractedTxId}`);
  } catch (err) {
    logPayment(
      `tool=${toolName} could not extract txid from header: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
  logPayment(`tool=${toolName} facilitator verify result=${jsonForLog(verified)}`);
  let onChainSignature: string | null = null;
  if (!verified.isValid) {
    const invalidReason = verified.invalidReason ?? "verification_failed";
    const invalidMessage =
      typeof (verified as { invalidMessage?: unknown }).invalidMessage === "string"
        ? ((verified as { invalidMessage?: string }).invalidMessage ?? "")
        : "";
    const alreadyProcessed =
      invalidReason.toLowerCase().includes("simulation_failed") &&
      invalidMessage.toLowerCase().includes("alreadyprocessed");
    if (alreadyProcessed) {
      logPayment(
        `tool=${toolName} facilitator reported AlreadyProcessed; attempting strict on-chain verification fallback`
      );
      try {
        onChainSignature = await verifyPaymentOnChain(
          paymentHeader,
          paymentRequirements
        );
      } catch (err) {
        logPayment(
          `tool=${toolName} on-chain fallback failed after AlreadyProcessed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    if (!onChainSignature) {
      logPayment(
        `tool=${toolName} received: invalid payment -> returning 402 (${invalidReason})`
      );
      logPayment(
        `tool=${toolName} payment_required_body=${jsonForLog({
          ...paymentRequired.body,
          error: `Invalid payment: ${invalidReason}`,
        })}`
      );
      res.setHeader("PAYMENT-REQUIRED", paymentRequiredHeader);
      throw new PaymentRequiredError(toolName, {
        paymentRequired: {
          ...paymentRequired.body,
          error: `Invalid payment: ${invalidReason}`,
        },
        paymentRequiredHeader,
      });
    }
  }

  if (!onChainSignature) {
    onChainSignature = await verifyPaymentOnChain(
      paymentHeader,
      paymentRequirements
    );
  }

  getSettlementMap().set(toolName, {
    paymentHeader,
    requirements: paymentRequirements,
    onChainSignature,
  });
  logPayment(`tool=${toolName} verified on-chain, settling tx=${onChainSignature}`);
  return { paid: true };
}

export async function settleAfterExecution(
  toolName: string,
  _priceAtomic: string
): Promise<void> {
  const context = getSettlementMap().get(toolName);
  if (!context) {
    return;
  }

  const settlement = await x402.settlePayment(
    context.paymentHeader,
    context.requirements
  );
  logPayment(`tool=${toolName} facilitator settle result=${jsonForLog(settlement)}`);
  if (!settlement.success && settlement.errorReason === "duplicate_settlement") {
    logPayment(
      `tool=${toolName} settlement already completed upstream (duplicate_settlement), onChain=${context.onChainSignature}`
    );
    getSettlementMap().delete(toolName);
    return;
  }
  if (!settlement.success && settlement.errorReason === "unexpected_settle_error") {
    logPayment(
      `tool=${toolName} settlement returned unexpected_settle_error but on-chain payment already verified at tx=${context.onChainSignature}; continuing`
    );
    getSettlementMap().delete(toolName);
    return;
  }
  if (!settlement.success) {
    logPayment(
      `tool=${toolName} settlement failed: ${settlement.errorReason ?? "unknown_settlement_error"}`
    );
    throw new Error(
      `Settlement failed for ${toolName}: ${settlement.errorReason ?? "unknown_settlement_error"}`
    );
  }

  const signature = settlement.transaction;
  logPayment(
    `tool=${toolName} settled successfully, signature=${signature ?? "n/a"}, onChain=${context.onChainSignature}`
  );
  getSettlementMap().delete(toolName);
}
