import { PublicKey } from "@solana/web3.js";
import type { EnhancedTransaction } from "helius-sdk/enhanced/types";
import { getCached, setCached } from "../cache.js";
import {
  getGoldRushClient,
  getHeliusClient,
  SOLANA_CHAIN_NAME,
} from "../clients.js";
import type {
  CounterpartyTrustInput,
  CounterpartyTrustOutput,
  CounterpartyTrustReason,
} from "./types.js";

const CACHE_PREFIX = "counterparty-trust:v1:";
const CACHE_TTL_MS = 10 * 60 * 1000;
const TX_LIMIT = 200;
const HELIUS_TX_GAP_MS = 150;

const STABLE_TICKERS = new Set(
  ["USDC", "USDT", "USDS", "PYUSD", "DAI"].map((s) => s.toUpperCase())
);

const WEIGHTS = {
  directHistory: 30,
  sharedNetwork: 25,
  behavioralMatch: 15,
  counterpartyStability: 20,
  activityOverlap: 10,
} as const;

type BalanceRow = {
  contract_ticker_symbol: string | null;
  contract_address: string | null;
  quote: number | null;
  is_spam: boolean | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
}

function validateWallet(label: string, wallet: string): string {
  const trimmed = wallet.trim();
  try {
    return new PublicKey(trimmed).toBase58();
  } catch {
    throw new Error(`Invalid Solana ${label} address: "${wallet}"`);
  }
}

function clampLookbackDays(raw?: number): number {
  const d = raw === undefined || Number.isNaN(raw) ? 90 : Math.floor(raw);
  return Math.min(365, Math.max(1, d));
}

function txTimestampSec(tx: EnhancedTransaction): number | null {
  const t = tx.timestamp;
  if (t === undefined || !Number.isFinite(t)) return null;
  return t > 1_000_000_000_000 ? Math.floor(t / 1000) : Math.floor(t);
}

async function fetchBalances(wallet: string): Promise<{
  items: BalanceRow[] | null;
  error?: string;
}> {
  try {
    const gr = getGoldRushClient();
    const resp = await gr.BalanceService.getTokenBalancesForWalletAddress(
      SOLANA_CHAIN_NAME,
      wallet
    );
    if (resp.error) {
      const msg = resp.error_message ?? "GoldRush balances error";
      console.error("[score-counterparty-trust] GoldRush balances API error", {
        wallet,
        msg,
      });
      return { items: null, error: msg };
    }
    const rawItems = resp.data?.items ?? [];
    const items: BalanceRow[] = rawItems.map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        contract_ticker_symbol:
          (r.contract_ticker_symbol as string | null | undefined) ?? null,
        contract_address:
          (r.contract_address as string | null | undefined) ?? null,
        quote:
          typeof r.quote === "number"
            ? r.quote
            : r.quote === null || r.quote === undefined
              ? null
              : Number(r.quote),
        is_spam:
          typeof r.is_spam === "boolean"
            ? r.is_spam
            : r.is_spam === null || r.is_spam === undefined
              ? null
              : Boolean(r.is_spam),
      };
    });
    return { items };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[score-counterparty-trust] GoldRush balances threw", {
      wallet,
      err,
    });
    return { items: null, error: msg };
  }
}

function visitAccountDataStrings(
  node: unknown,
  onString: (s: string) => void
): void {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    onString(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) visitAccountDataStrings(x, onString);
    return;
  }
  if (typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>))
      visitAccountDataStrings(v, onString);
  }
}

/** Collect addresses from accountData that parse as Solana pubkeys. */
function collectAccountDataPubkeys(tx: EnhancedTransaction): Set<string> {
  const out = new Set<string>();
  visitAccountDataStrings(tx.accountData, (s) => {
    const t = s.trim();
    if (t.length < 32 || t.length > 44) return;
    try {
      out.add(new PublicKey(t).toBase58());
    } catch {
      /* ignore */
    }
  });
  return out;
}

function txTouchesAddress(
  tx: EnhancedTransaction,
  addr: string,
  addrLower: string
): boolean {
  for (const tt of tx.tokenTransfers ?? []) {
    const f = tt.fromUserAccount?.trim();
    const t = tt.toUserAccount?.trim();
    if (f && f.toLowerCase() === addrLower) return true;
    if (t && t.toLowerCase() === addrLower) return true;
  }
  for (const nt of tx.nativeTransfers ?? []) {
    const f = nt.fromUserAccount?.trim();
    const t = nt.toUserAccount?.trim();
    if (f && f.toLowerCase() === addrLower) return true;
    if (t && t.toLowerCase() === addrLower) return true;
  }
  for (const pk of collectAccountDataPubkeys(tx)) {
    if (pk.toLowerCase() === addrLower) return true;
  }
  return false;
}

/** Counterparties in one tx (token + native only), excluding self; at most one count per peer per tx. */
function bumpCounterpartiesForTx(
  tx: EnhancedTransaction,
  self: string,
  selfLower: string,
  counts: Map<string, number>
): void {
  const seen = new Set<string>();
  const bump = (raw: string | undefined) => {
    const w = raw?.trim();
    if (!w || w.toLowerCase() === selfLower) return;
    const k = new PublicKey(w).toBase58();
    if (seen.has(k)) return;
    seen.add(k);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  };
  try {
    for (const tt of tx.tokenTransfers ?? []) {
      bump(tt.fromUserAccount);
      bump(tt.toUserAccount);
    }
    for (const nt of tx.nativeTransfers ?? []) {
      bump(nt.fromUserAccount);
      bump(nt.toUserAccount);
    }
  } catch {
    /* malformed address in payload — skip */
  }
}

function buildCounterpartyCounts(
  txs: EnhancedTransaction[],
  self: string
): Map<string, number> {
  const selfLower = self.toLowerCase();
  const counts = new Map<string, number>();
  for (const tx of txs) bumpCounterpartiesForTx(tx, self, selfLower, counts);
  return counts;
}

function walletBConcentratedNonStable(balances: BalanceRow[] | null): boolean {
  if (!balances?.length) return false;
  const usable = balances.filter(
    (b) => b.is_spam !== true && b.quote !== null && Number.isFinite(b.quote)
  );
  let nonStableSum = 0;
  let maxNonStable = 0;
  for (const b of usable) {
    const sym = (b.contract_ticker_symbol ?? "").toUpperCase();
    if (STABLE_TICKERS.has(sym)) continue;
    const q = b.quote as number;
    if (q <= 0) continue;
    nonStableSum += q;
    if (q > maxNonStable) maxNonStable = q;
  }
  if (nonStableSum < 1e-9) return false;
  return maxNonStable / nonStableSum > 0.9;
}

function tierFromTrustScore(score: number): CounterpartyTrustOutput["tier"] {
  if (score <= 20) return "untrusted";
  if (score <= 40) return "caution";
  if (score <= 60) return "neutral";
  if (score <= 80) return "trusted";
  return "highly_trusted";
}

function jaccardTypeSimilarity(
  txsA: EnhancedTransaction[],
  txsB: EnhancedTransaction[]
): { score: number; shared: string[] } {
  const typesA = new Set<string>();
  const typesB = new Set<string>();
  for (const tx of txsA) {
    const t = (tx.type ?? "UNKNOWN").toUpperCase();
    typesA.add(t);
  }
  for (const tx of txsB) {
    const t = (tx.type ?? "UNKNOWN").toUpperCase();
    typesB.add(t);
  }
  let inter = 0;
  const shared: string[] = [];
  for (const x of typesA) {
    if (typesB.has(x)) {
      inter++;
      shared.push(x);
    }
  }
  const union = typesA.size + typesB.size - inter;
  const score =
    union <= 0 ? 0 : Math.round((inter / union) * 100);
  shared.sort();
  return { score, shared };
}

function activityOverlapPercent(
  txsA: EnhancedTransaction[],
  txsB: EnhancedTransaction[],
  lookbackDays: number,
  nowSec: number,
  windowStartSec: number
): number {
  const bucketCount = Math.max(1, Math.ceil(lookbackDays / 7));
  const span = Math.max(1, nowSec - windowStartSec);
  const bucketSecs = Math.ceil(span / bucketCount);
  const activeA = new Set<number>();
  const activeB = new Set<number>();
  for (const tx of txsA) {
    const ts = txTimestampSec(tx);
    if (ts === null || ts < windowStartSec) continue;
    const bucketIdx = Math.min(
      bucketCount - 1,
      Math.floor((ts - windowStartSec) / bucketSecs)
    );
    activeA.add(bucketIdx);
  }
  for (const tx of txsB) {
    const ts = txTimestampSec(tx);
    if (ts === null || ts < windowStartSec) continue;
    const bucketIdx = Math.min(
      bucketCount - 1,
      Math.floor((ts - windowStartSec) / bucketSecs)
    );
    activeB.add(bucketIdx);
  }
  let both = 0;
  for (let i = 0; i < bucketCount; i++) {
    if (activeA.has(i) && activeB.has(i)) both++;
  }
  return Math.round((both / bucketCount) * 100);
}

export async function scoreCounterpartyTrust(
  input: CounterpartyTrustInput
): Promise<CounterpartyTrustOutput> {
  const tTotal0 = performance.now();
  const walletA = validateWallet("walletA", input.walletA);
  const walletB = validateWallet("walletB", input.walletB);
  if (walletA === walletB) {
    throw new Error("walletA and walletB must be different addresses");
  }
  const lookbackDays = clampLookbackDays(input.lookbackDays);
  const cacheKey = `${CACHE_PREFIX}${walletA}:${walletB}:${lookbackDays}`;
  const cached = getCached<CounterpartyTrustOutput>(cacheKey);
  if (cached) {
    console.log("[score-counterparty-trust] timings", {
      parallelFetch_ms: 0,
      interaction_ms: 0,
      shared_ms: 0,
      behavioral_ms: 0,
      total_ms: Math.round(performance.now() - tTotal0),
    });
    return cached;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const windowStartSec = nowSec - lookbackDays * 86400;

  let partial = false;
  const tParallel0 = performance.now();

  const [balAR, balBR, txPair] = await Promise.all([
    fetchBalances(walletA),
    fetchBalances(walletB),
    (async (): Promise<{
      txsA: EnhancedTransaction[];
      txsB: EnhancedTransaction[];
    }> => {
      const helius = getHeliusClient();
      let txsA: EnhancedTransaction[] = [];
      let txsB: EnhancedTransaction[] = [];
      try {
        txsA = (await helius.enhanced.getTransactionsByAddress({
          address: walletA,
          limit: TX_LIMIT,
          gteTime: windowStartSec,
          sortOrder: "desc",
        })) as EnhancedTransaction[];
      } catch (err) {
        partial = true;
        if (isRateLimitedError(err)) {
          console.error(
            "[score-counterparty-trust] Helius txs walletA rate limited",
            { walletA, err }
          );
        } else {
          console.error("[score-counterparty-trust] Helius txs walletA failed", {
            walletA,
            err,
          });
        }
      }
      await sleep(HELIUS_TX_GAP_MS);
      try {
        txsB = (await helius.enhanced.getTransactionsByAddress({
          address: walletB,
          limit: TX_LIMIT,
          gteTime: windowStartSec,
          sortOrder: "desc",
        })) as EnhancedTransaction[];
      } catch (err) {
        partial = true;
        if (isRateLimitedError(err)) {
          console.error(
            "[score-counterparty-trust] Helius txs walletB rate limited",
            { walletB, err }
          );
        } else {
          console.error("[score-counterparty-trust] Helius txs walletB failed", {
            walletB,
            err,
          });
        }
      }
      return { txsA, txsB };
    })(),
  ]);

  const parallelFetch_ms = performance.now() - tParallel0;
  if (balAR.error || balBR.error) partial = true;

  const txsA = txPair.txsA;
  const txsB = txPair.txsB;

  const tInteract0 = performance.now();
  const walletBLower = walletB.toLowerCase();
  const walletALower = walletA.toLowerCase();

  const directBySig = new Map<
    string,
    { ts: number; fromAView: boolean; fromBView: boolean }
  >();

  for (const tx of txsA) {
    const ts = txTimestampSec(tx);
    if (ts === null) continue;
    if (!txTouchesAddress(tx, walletB, walletBLower)) continue;
    const prev = directBySig.get(tx.signature);
    if (prev) {
      prev.fromAView = true;
      if (ts < prev.ts) prev.ts = ts;
    } else {
      directBySig.set(tx.signature, {
        ts,
        fromAView: true,
        fromBView: false,
      });
    }
  }
  for (const tx of txsB) {
    const ts = txTimestampSec(tx);
    if (ts === null) continue;
    if (!txTouchesAddress(tx, walletA, walletALower)) continue;
    const prev = directBySig.get(tx.signature);
    if (prev) {
      prev.fromBView = true;
      if (ts < prev.ts) prev.ts = ts;
    } else {
      directBySig.set(tx.signature, {
        ts,
        fromAView: false,
        fromBView: true,
      });
    }
  }

  const directTsList: number[] = [];
  for (const row of directBySig.values()) directTsList.push(row.ts);
  directTsList.sort((a, b) => a - b);

  const directTransactionsCount = directBySig.size;
  const firstInteractionAt =
    directTsList.length > 0
      ? new Date(directTsList[0]! * 1000).toISOString()
      : null;
  const lastInteractionAt =
    directTsList.length > 0
      ? new Date(directTsList[directTsList.length - 1]! * 1000).toISOString()
      : null;

  const interaction_ms = performance.now() - tInteract0;

  const tShared0 = performance.now();
  const countsA = buildCounterpartyCounts(txsA, walletA);
  const countsB = buildCounterpartyCounts(txsB, walletB);
  const sharedWallets: string[] = [];
  for (const k of countsA.keys()) {
    if (k === walletA || k === walletB) continue;
    if (countsB.has(k)) sharedWallets.push(k);
  }
  sharedWallets.sort(
    (x, y) =>
      (countsA.get(y)! + countsB.get(y)!) - (countsA.get(x)! + countsB.get(x)!)
  );
  const topShared = sharedWallets.slice(0, 5).map((w) => ({
    wallet: w,
    interactionCountA: countsA.get(w) ?? 0,
    interactionCountB: countsB.get(w) ?? 0,
  }));
  const shared_ms = performance.now() - tShared0;

  const tBehave0 = performance.now();
  const { score: behavioralScore, shared: sharedTxTypes } =
    jaccardTypeSimilarity(txsA, txsB);
  const activityOverlap = activityOverlapPercent(
    txsA,
    txsB,
    lookbackDays,
    nowSec,
    windowStartSec
  );
  const behavioral_ms = performance.now() - tBehave0;

  const bTimestamps = txsB.map((tx) => txTimestampSec(tx)).filter((x): x is number => x !== null);
  const oldestB = bTimestamps.length > 0 ? Math.min(...bTimestamps) : null;
  const walletBVeryNew =
    oldestB !== null && oldestB > nowSec - 7 * 86400;

  const concentratedB = walletBConcentratedNonStable(balBR.items);

  const activeA = txsA.length >= 5;
  const activeB = txsB.length >= 5;
  const asymmetricNetwork =
    topShared.length === 0 && activeA && activeB;

  const redFlags: string[] = [];
  if (walletBVeryNew) redFlags.push("walletB_very_new");
  if (directTransactionsCount === 0 && topShared.length === 0) {
    redFlags.push("no_prior_interaction");
  }
  if (concentratedB) redFlags.push("walletB_concentrated_risk");
  if (asymmetricNetwork) redFlags.push("asymmetric_network");

  const directSpanSec =
    directTsList.length >= 2
      ? directTsList[directTsList.length - 1]! - directTsList[0]!
      : 0;
  const establishedRelationship =
    directTransactionsCount >= 3 && directSpanSec > 30 * 86400;
  const burstDirect =
    directTransactionsCount >= 3 &&
    directSpanSec < 7 * 86400;

  const positiveSignals: string[] = [];
  if (establishedRelationship) positiveSignals.push("established_relationship");
  if (sharedWallets.length >= 3)
    positiveSignals.push("consistent_counterparty_network");
  if (activityOverlap > 50) positiveSignals.push("mutual_activity_overlap");

  /** directHistory sub-score 0–100 */
  let subDirect = 30;
  if (directTransactionsCount === 0) subDirect = 30;
  else if (directTransactionsCount <= 2) subDirect = 50;
  else if (burstDirect) subDirect = 25;
  else if (directSpanSec > 30 * 86400) subDirect = 80;
  else subDirect = 50;

  /** sharedNetwork */
  let subShared = 30;
  if (sharedWallets.length === 0) subShared = 30;
  else if (sharedWallets.length <= 2) subShared = 55;
  else subShared = 80;

  const subBehavioral = Math.max(0, Math.min(100, behavioralScore));

  /** counterpartyStability (wallet B) */
  let subStability = 55;
  if (concentratedB) subStability = 25;
  else if (oldestB !== null && oldestB <= nowSec - 90 * 86400) {
    const typeSet = new Set(
      txsB.map((tx) => (tx.type ?? "UNKNOWN").toUpperCase())
    );
    if (typeSet.size >= 4 && txsB.length >= 10) subStability = 80;
    else subStability = 55;
  } else if (oldestB !== null && oldestB > nowSec - 30 * 86400) {
    subStability = 30;
  }

  const subOverlap = Math.max(0, Math.min(100, activityOverlap));

  const weightSum =
    WEIGHTS.directHistory +
    WEIGHTS.sharedNetwork +
    WEIGHTS.behavioralMatch +
    WEIGHTS.counterpartyStability +
    WEIGHTS.activityOverlap;

  const trustScore = Math.round(
    (subDirect * WEIGHTS.directHistory +
      subShared * WEIGHTS.sharedNetwork +
      subBehavioral * WEIGHTS.behavioralMatch +
      subStability * WEIGHTS.counterpartyStability +
      subOverlap * WEIGHTS.activityOverlap) /
      weightSum
  );

  const tier = tierFromTrustScore(trustScore);

  const reasons: CounterpartyTrustReason[] = [
    {
      factor: "directHistory",
      weight: WEIGHTS.directHistory,
      detail: `Direct touches: ${directTransactionsCount} deduped signatures in ${lookbackDays}d window; span ${Math.round(directSpanSec / 86400)}d; sub-score ${subDirect}/100 (burst=${burstDirect}).`,
    },
    {
      factor: "sharedNetwork",
      weight: WEIGHTS.sharedNetwork,
      detail: `Shared counterparties (token/native): ${sharedWallets.length} addresses intersect; sub-score ${subShared}/100.`,
    },
    {
      factor: "behavioralMatch",
      weight: WEIGHTS.behavioralMatch,
      detail: `Jaccard tx-type similarity ${behavioralScore}/100; shared types: ${sharedTxTypes.slice(0, 8).join(", ") || "(none)"}.`,
    },
    {
      factor: "counterpartyStability",
      weight: WEIGHTS.counterpartyStability,
      detail: `Wallet B: oldest tx in window ${oldestB ? new Date(oldestB * 1000).toISOString() : "n/a"}; concentrated non-stable=${concentratedB}; sub-score ${subStability}/100.`,
    },
    {
      factor: "activityOverlap",
      weight: WEIGHTS.activityOverlap,
      detail: `7-day bucket overlap vs ${Math.ceil(lookbackDays / 7)} buckets: ${activityOverlap}% calendar overlap; sub-score ${subOverlap}/100.`,
    },
  ];

  const out: CounterpartyTrustOutput = {
    walletA,
    walletB,
    trustScore,
    tier,
    analyzedAt: new Date().toISOString(),
    partial,
    interactionHistory: {
      directTransactionsCount,
      firstInteractionAt,
      lastInteractionAt,
      totalDirectValueUSD: null,
    },
    sharedCounterparties: topShared,
    behavioralSimilarity: {
      score: behavioralScore,
      sharedTxTypes,
      activityOverlap,
    },
    redFlags,
    positiveSignals,
    reasons,
  };

  setCached(cacheKey, out, CACHE_TTL_MS);

  const total_ms = Math.round(performance.now() - tTotal0);
  console.log("[score-counterparty-trust] timings", {
    parallelFetch_ms: Math.round(parallelFetch_ms),
    interaction_ms: Math.round(interaction_ms),
    shared_ms: Math.round(shared_ms),
    behavioral_ms: Math.round(behavioral_ms),
    total_ms,
  });

  return out;
}
