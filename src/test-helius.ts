import "dotenv/config";
import { createHelius } from "helius-sdk";
import type { TokenAccounts } from "helius-sdk/types/das";
import type { Transfer } from "helius-sdk/wallet/types";

const apiKey = process.env.HELIUS_API_KEY;
if (!apiKey) {
  console.error("❌ HELIUS_API_KEY not found in .env");
  process.exit(1);
}

const helius = createHelius({ apiKey, network: "mainnet" });

const TEST_WALLET = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type TxLike = {
  type?: string;
  timestamp?: number;
  source?: string;
  tokenTransfers?: unknown[];
  [key: string]: unknown;
};

function listKeys(obj: unknown, max = 10): string[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj as Record<string, unknown>).slice(0, max);
}

function summarizeTx(tx: TxLike | undefined): Record<string, unknown> {
  if (!tx) return {};
  return {
    type: tx.type ?? null,
    timestamp: tx.timestamp ?? null,
    source: tx.source ?? null,
    tokenTransfersCount: Array.isArray(tx.tokenTransfers)
      ? tx.tokenTransfers.length
      : 0,
    topLevelFields: listKeys(tx, 12),
  };
}

async function test1ParsedTxHistory(): Promise<TxLike[]> {
  console.log("\n=== TEST 1: Parsed tx history for wallet ===");
  try {
    const txs = await helius.enhanced.getTransactionsByAddress({
      address: TEST_WALLET,
      limit: 5,
    });

    console.log(`✅ received ${txs.length} parsed transactions`);
    console.log("shape:", summarizeTx(txs[0] as TxLike | undefined));
    return txs as TxLike[];
  } catch (err) {
    console.error("❌", err instanceof Error ? err.message : err);
    return [];
  }
}

async function test2GroupByType(seedTxs?: TxLike[]): Promise<void> {
  console.log("\n=== TEST 2: Transaction type classification ===");
  try {
    const txs =
      seedTxs && seedTxs.length > 0
        ? seedTxs
        : ((await helius.enhanced.getTransactionsByAddress({
            address: TEST_WALLET,
            limit: 25,
          })) as TxLike[]);

    const counts = txs.reduce<Record<string, number>>((acc, tx) => {
      const type = tx.type ?? "UNKNOWN";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});

    console.log(`✅ grouped ${txs.length} transactions`);
    console.log("types:", counts);
  } catch (err) {
    console.error("❌", err instanceof Error ? err.message : err);
  }
}

async function test3TokenTransferAndHolderSignals(): Promise<void> {
  console.log("\n=== TEST 3: USDC transfer + holder lookup signal ===");
  try {
    const transfers = await helius.wallet.getTransfers({
      wallet: TEST_WALLET,
      limit: 100,
    });

    const usdcTransfers = transfers.data.filter(
      (t: Transfer) => t.mint === USDC_MINT
    );
    const sorted = [...usdcTransfers].sort((a, b) => b.amount - a.amount);
    const top3 = sorted.slice(0, 3).map((t) => ({
      signature: t.signature,
      amount: t.amount,
      direction: t.direction,
      counterparty: t.counterparty,
      timestamp: t.timestamp,
    }));

    console.log(
      `✅ wallet transfers: ${transfers.data.length} total, ${usdcTransfers.length} USDC`
    );
    console.log("USDC transfer fields:", listKeys(usdcTransfers[0]));
    console.log("largest USDC transfers (top 3):", top3);

    const tokenAccounts = await helius.getTokenAccounts({
      mint: USDC_MINT,
      page: 1,
      limit: 10,
    });
    const holdersSample = (tokenAccounts.token_accounts ?? [])
      .slice(0, 3)
      .map((a: TokenAccounts) => ({
        owner: a.owner,
        amount: a.amount,
        address: a.address,
      }));

    console.log(
      `✅ holder lookup via getTokenAccounts: ${tokenAccounts.token_accounts?.length ?? 0} rows`
    );
    console.log("holder sample shape:", holdersSample);
  } catch (err) {
    console.error("❌", err instanceof Error ? err.message : err);
  }
}

async function test4RateLimitProbe(): Promise<void> {
  console.log("\n=== TEST 4: Rate limit probe (10 rapid calls) ===");
  try {
    const starts = Array.from({ length: 10 }, () => Date.now());
    const calls = Array.from({ length: 10 }, async (_, i) => {
      const t0 = starts[i] ?? Date.now();
      const txs = await helius.enhanced.getTransactionsByAddress({
        address: TEST_WALLET,
        limit: 5,
      });
      return { ms: Date.now() - t0, count: txs.length };
    });

    const settled = await Promise.allSettled(calls);
    const ok = settled.filter((s) => s.status === "fulfilled");
    const failed = settled.filter((s) => s.status === "rejected");
    const times = ok.map((s) => (s as PromiseFulfilledResult<{ ms: number }>).value.ms);
    const counts = ok.map(
      (s) => (s as PromiseFulfilledResult<{ count: number }>).value.count
    );

    console.log(
      `✅ completed ${ok.length}/10 calls, failed ${failed.length}/10 calls`
    );
    if (times.length > 0) {
      const total = times.reduce((a, b) => a + b, 0);
      console.log("latency(ms):", {
        min: Math.min(...times),
        max: Math.max(...times),
        avg: Number((total / times.length).toFixed(1)),
      });
      console.log("response counts per successful call:", counts);
    }
    if (failed.length > 0) {
      const reasons = failed.map((f) =>
        f.status === "rejected"
          ? f.reason instanceof Error
            ? f.reason.message
            : String(f.reason)
          : ""
      );
      console.log("failure reasons:", reasons);
    }
  } catch (err) {
    console.error("❌", err instanceof Error ? err.message : err);
  }
}

async function main(): Promise<void> {
  console.log("Helius Solana diagnostics started");
  const txs = await test1ParsedTxHistory();
  await test2GroupByType(txs);
  await test3TokenTransferAndHolderSignals();
  await test4RateLimitProbe();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
