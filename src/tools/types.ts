import * as z from "zod/v4";

const riskTierSchema = z.enum(["low", "medium", "high", "critical"]);

/** Zod shape for MCP `registerTool` input (raw shape object). */
export const walletRiskToolInputShape = {
  wallet: z
    .string()
    .min(1, "wallet is required")
    .describe("Solana wallet address (base58)"),
};

export const walletRiskInputSchema = z.object(walletRiskToolInputShape);

export const walletRiskReasonSchema = z.object({
  factor: z.string(),
  weight: z.number(),
  detail: z.string(),
});

export const walletRiskOutputSchema = z.object({
  score: z.number().min(0).max(100),
  tier: riskTierSchema,
  reasons: z.array(walletRiskReasonSchema),
  wallet: z.string(),
  analyzedAt: z.string(),
});

export type WalletRiskInput = z.infer<typeof walletRiskInputSchema>;
export type WalletRiskOutput = z.infer<typeof walletRiskOutputSchema>;
export type WalletRiskReason = z.infer<typeof walletRiskReasonSchema>;

const whaleMovementTypeSchema = z.enum([
  "buy",
  "sell",
  "transfer_out",
  "transfer_in",
]);

/** Zod shape for MCP `registerTool` input (raw shape object). */
export const whaleActivityToolInputShape = {
  mint: z
    .string()
    .min(1, "mint is required")
    .describe("SPL token mint address (base58)"),
  windowHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(72)
    .optional()
    .describe("Lookback window in hours (default 24, max 72)"),
};

export const whaleActivityInputSchema = z.object(whaleActivityToolInputShape);

export const whaleActivityTopHolderSchema = z.object({
  wallet: z.string(),
  balance: z.string(),
  balanceUSD: z.number().nullable(),
  percentOfSupply: z.number().nullable(),
});

export const whaleActivityMovementSchema = z.object({
  wallet: z.string(),
  type: whaleMovementTypeSchema,
  amountTokens: z.string(),
  amountUSD: z.number().nullable(),
  timestamp: z.string(),
  txSignature: z.string(),
});

export const whaleActivityConcentrationSchema = z.object({
  top10HoldingPercent: z.number().nullable(),
  netFlowUSD: z.number().nullable(),
  distinctWhalesActive: z.number(),
});

export const whaleActivityOutputSchema = z.object({
  mint: z.string(),
  symbol: z.string().nullable(),
  tokenUSDPrice: z.number().nullable(),
  analyzedAt: z.string(),
  partial: z.boolean(),
  topHolders: z.array(whaleActivityTopHolderSchema),
  notableMovements: z.array(whaleActivityMovementSchema),
  concentration: whaleActivityConcentrationSchema,
  flags: z.array(z.string()),
});

export type WhaleActivityInput = z.infer<typeof whaleActivityInputSchema>;
export type WhaleActivityOutput = z.infer<typeof whaleActivityOutputSchema>;

const counterpartyTrustTierSchema = z.enum([
  "untrusted",
  "caution",
  "neutral",
  "trusted",
  "highly_trusted",
]);

/** Zod shape for MCP `registerTool` input (raw shape object). */
export const counterpartyTrustToolInputShape = {
  walletA: z
    .string()
    .min(1, "walletA is required")
    .describe('Wallet evaluating trust ("me")'),
  walletB: z
    .string()
    .min(1, "walletB is required")
    .describe("Counterparty wallet to score"),
  lookbackDays: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("Lookback window in days (default 90, max 365)"),
};

export const counterpartyTrustInputSchema = z.object(
  counterpartyTrustToolInputShape
);

export const counterpartyTrustSharedCounterpartySchema = z.object({
  wallet: z.string(),
  interactionCountA: z.number().int().min(0),
  interactionCountB: z.number().int().min(0),
});

export const counterpartyTrustReasonSchema = z.object({
  factor: z.string(),
  weight: z.number(),
  detail: z.string(),
});

export const counterpartyTrustOutputSchema = z.object({
  walletA: z.string(),
  walletB: z.string(),
  trustScore: z.number().min(0).max(100),
  tier: counterpartyTrustTierSchema,
  analyzedAt: z.string(),
  partial: z.boolean(),
  interactionHistory: z.object({
    directTransactionsCount: z.number().int().min(0),
    firstInteractionAt: z.string().nullable(),
    lastInteractionAt: z.string().nullable(),
    totalDirectValueUSD: z.number().nullable(),
  }),
  sharedCounterparties: z.array(counterpartyTrustSharedCounterpartySchema),
  behavioralSimilarity: z.object({
    score: z.number().min(0).max(100),
    sharedTxTypes: z.array(z.string()),
    activityOverlap: z.number(),
  }),
  redFlags: z.array(z.string()),
  positiveSignals: z.array(z.string()),
  reasons: z.array(counterpartyTrustReasonSchema),
});

export type CounterpartyTrustInput = z.infer<typeof counterpartyTrustInputSchema>;
export type CounterpartyTrustOutput = z.infer<typeof counterpartyTrustOutputSchema>;
export type CounterpartyTrustReason = z.infer<typeof counterpartyTrustReasonSchema>;
