import { address } from "@solana/addresses";
import { PublicKey } from "@solana/web3.js";
/** Parsed tx shape from Helius Enhanced API (minimal fields used). */
type ParsedTx = {
  type?: string;
  timestamp?: number;
};
import { getCached, setCached } from "../cache.js";
import {
  getGoldRushClient,
  getHeliusClient,
  SOLANA_CHAIN_NAME,
} from "../clients.js";
import type {
  WalletRiskInput,
  WalletRiskOutput,
  WalletRiskReason,
} from "./types.js";

const CACHE_PREFIX = "wallet-risk:v3:";
const CACHE_TTL_MS = 5 * 60 * 1000;

const STABLE_TICKERS = new Set(
  ["USDC", "USDT", "USDS", "PYUSD", "DAI"].map((s) => s.toUpperCase())
);

const MAJOR_TICKERS = new Set(
  [
    "SOL",
    "USDC",
    "USDT",
    "USDS",
    "PYUSD",
    "DAI",
    "JUP",
    "BONK",
    "WIF",
    "JTO",
    "PYTH",
    "RENDER",
    "MSOL",
    "JITOSOL",
  ].map((s) => s.toUpperCase())
);

const WEIGHTS = {
  walletAge: 20,
  concentration: 20,
  txDiversity: 15,
  longtailExposure: 25,
  activityRecency: 10,
  dustAnomaly: 10,
} as const;

type SigRow = { signature: string; blockTime: number | null };

type BalanceRow = {
  contract_ticker_symbol: string | null;
  contract_address: string | null;
  quote: number | null;
  is_spam: boolean | null;
};

/** Deepest signature scan for wallet age (separate from the 50-sig recent window). */
type WalletAgeScan = {
  oldestSec: number | null;
  pagesScanned: number;
  lastPageFull: boolean;
  rateLimitedStop: boolean;
  totalRows: number;
  error?: string;
};

type FetchBundle = {
  wallet: string;
  balances: BalanceRow[] | null;
  signatures: SigRow[] | null;
  parsedTxs: ParsedTx[] | null;
  walletAgeScan: WalletAgeScan | null;
  errors: {
    goldrush?: string;
    heliusSignatures?: string;
    heliusParse?: string;
    heliusWalletAge?: string;
  };
};

function validateSolanaWallet(wallet: string): string {
  const trimmed = wallet.trim();
  try {
    const pk = new PublicKey(trimmed);
    return pk.toBase58();
  } catch {
    throw new Error(`Invalid Solana wallet address: "${wallet}"`);
  }
}

function isRateLimitedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
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
      console.error("[assess-wallet-risk] GoldRush balances API error", {
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
    console.error("[assess-wallet-risk] GoldRush balances threw", {
      wallet,
      err,
    });
    return { items: null, error: msg };
  }
}

const WALLET_AGE_PAGE_LIMIT = 500;
/** Two pages of 500 signatures each (max 1000) for wallet-age depth. */
const WALLET_AGE_MAX_PAGES = 2;
const NINETY_DAYS_SEC = 90 * 86400;

type AssessWalletRiskLoadTimings = {
  balances_ms: number;
  recentSigs_ms: number;
  walletAgeScan_ms: number;
  parseTransactions_ms: number;
};

/**
 * Walks signature history with `before` pagination to find the oldest known
 * activity time (bounded Helius budget).
 */
async function fetchWalletAgeBounded(wallet: string): Promise<WalletAgeScan> {
  const nowSec = Math.floor(Date.now() / 1000);
  let oldest: number | null = null;
  let beforeCursor: string | undefined;
  let pagesScanned = 0;
  let lastPageFull = false;
  let totalRows = 0;

  try {
    const helius = getHeliusClient();
    const addr = address(wallet);

    for (let i = 0; i < WALLET_AGE_MAX_PAGES; i++) {
      const cfg =
        beforeCursor === undefined
          ? { limit: WALLET_AGE_PAGE_LIMIT }
          : {
              limit: WALLET_AGE_PAGE_LIMIT,
              before: beforeCursor,
            };

      let rows: ReadonlyArray<{ signature: string; blockTime: number | null }>;
      try {
        rows = await helius.getSignaturesForAddress(
          addr,
          cfg as Parameters<typeof helius.getSignaturesForAddress>[1]
        );
      } catch (err) {
        if (isRateLimitedError(err)) {
          console.error(
            "[assess-wallet-risk] Helius wallet-age pagination stopped (429)",
            { wallet, pageIndex: i, rowsScannedSoFar: totalRows, err }
          );
          return {
            oldestSec: oldest,
            pagesScanned,
            lastPageFull,
            rateLimitedStop: true,
            totalRows,
            error: err instanceof Error ? err.message : String(err),
          };
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[assess-wallet-risk] Helius wallet-age pagination failed", {
          wallet,
          pageIndex: i,
          err,
        });
        return {
          oldestSec: oldest,
          pagesScanned,
          lastPageFull,
          rateLimitedStop: false,
          totalRows,
          error: msg,
        };
      }

      const arr = [...rows] as ReadonlyArray<{
        signature: string;
        blockTime: number | null;
      }>;
      pagesScanned++;
      totalRows += arr.length;
      lastPageFull = arr.length === WALLET_AGE_PAGE_LIMIT;

      if (arr.length === 0) {
        break;
      }

      let pageHasNinetyDayOrOlder = false;
      for (const r of arr) {
        if (r.blockTime !== null && r.blockTime !== undefined) {
          const t = Number(r.blockTime);
          if (Number.isFinite(t)) {
            oldest = oldest === null ? t : Math.min(oldest, t);
            if (nowSec - t >= NINETY_DAYS_SEC) {
              pageHasNinetyDayOrOlder = true;
            }
          }
        }
      }

      if (pageHasNinetyDayOrOlder) {
        break;
      }

      if (arr.length < WALLET_AGE_PAGE_LIMIT) {
        break;
      }

      const lastSig = arr[arr.length - 1]?.signature;
      if (!lastSig) break;
      beforeCursor = String(lastSig);
    }

    return {
      oldestSec: oldest,
      pagesScanned,
      lastPageFull,
      rateLimitedStop: false,
      totalRows,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assess-wallet-risk] Helius wallet-age scan threw", {
      wallet,
      err,
    });
    return {
      oldestSec: oldest,
      pagesScanned,
      lastPageFull,
      rateLimitedStop: false,
      totalRows,
      error: msg,
    };
  }
}

async function fetchSignatures(
  wallet: string
): Promise<{ rows: SigRow[] | null; error?: string }> {
  try {
    const helius = getHeliusClient();
    const rows = await helius.getSignaturesForAddress(
      address(wallet),
      { limit: 50 }
    );
    const mapped: SigRow[] = (
      rows as ReadonlyArray<{ signature: string; blockTime: number | null }>
    ).map((r) => ({
      signature: String(r.signature),
      blockTime:
        r.blockTime === null || r.blockTime === undefined
          ? null
          : Number(r.blockTime),
    }));
    return { rows: mapped };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assess-wallet-risk] Helius getSignaturesForAddress failed", {
      wallet,
      err,
      rateLimited: isRateLimitedError(err),
    });
    return { rows: null, error: msg };
  }
}

async function fetchParsedTransactions(
  wallet: string,
  sigRows: SigRow[] | null
): Promise<{ txs: ParsedTx[] | null; error?: string }> {
  if (!sigRows || sigRows.length === 0) {
    return { txs: [] };
  }
  const signatures = sigRows.map((r) => r.signature).filter(Boolean);
  try {
    const helius = getHeliusClient();
    const txs = await helius.enhanced.getTransactions({
      transactions: signatures,
    });
    return { txs: [...txs] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assess-wallet-risk] Helius enhanced.getTransactions failed", {
      wallet,
      count: signatures.length,
      err,
      rateLimited: isRateLimitedError(err),
    });
    return { txs: null, error: msg };
  }
}

async function loadWalletData(
  wallet: string
): Promise<{ bundle: FetchBundle; timings: AssessWalletRiskLoadTimings }> {
  const zeroTimings: AssessWalletRiskLoadTimings = {
    balances_ms: 0,
    recentSigs_ms: 0,
    walletAgeScan_ms: 0,
    parseTransactions_ms: 0,
  };

  const cacheKey = `${CACHE_PREFIX}${wallet}`;
  const cached = getCached<FetchBundle>(cacheKey);
  if (cached) {
    return { bundle: cached, timings: zeroTimings };
  }

  const [balTimed, sigTimed, ageTimed] = await Promise.all([
    (async () => {
      const s = performance.now();
      const r = await fetchBalances(wallet);
      return { r, ms: performance.now() - s };
    })(),
    (async () => {
      const s = performance.now();
      const r = await fetchSignatures(wallet);
      return { r, ms: performance.now() - s };
    })(),
    (async () => {
      const s = performance.now();
      const r = await fetchWalletAgeBounded(wallet);
      return { r, ms: performance.now() - s };
    })(),
  ]);

  const parseStart = performance.now();
  const parseRes = await fetchParsedTransactions(
    wallet,
    sigTimed.r.rows
  );
  const parseTransactions_ms = performance.now() - parseStart;

  const bundle: FetchBundle = {
    wallet,
    balances: balTimed.r.items,
    signatures: sigTimed.r.rows,
    parsedTxs: parseRes.txs,
    walletAgeScan: ageTimed.r,
    errors: {},
  };
  if (balTimed.r.error) bundle.errors.goldrush = balTimed.r.error;
  if (sigTimed.r.error) bundle.errors.heliusSignatures = sigTimed.r.error;
  if (parseRes.error) bundle.errors.heliusParse = parseRes.error;
  if (ageTimed.r.error) bundle.errors.heliusWalletAge = ageTimed.r.error;

  setCached(cacheKey, bundle, CACHE_TTL_MS);
  return {
    bundle,
    timings: {
      balances_ms: balTimed.ms,
      recentSigs_ms: sigTimed.ms,
      walletAgeScan_ms: ageTimed.ms,
      parseTransactions_ms,
    },
  };
}

function tierFromScore(score: number): WalletRiskOutput["tier"] {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

function formatDate(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

/** Short base58 mint for display when ticker is missing (first 6 + last 4). */
function shortenMint(mint: string): string {
  const m = mint.trim();
  if (m.length === 0) return "?";
  if (m.length <= 10) return m;
  return `${m.slice(0, 6)}...${m.slice(-4)}`;
}

function tokenDisplayName(b: BalanceRow): string {
  const sym = (b.contract_ticker_symbol ?? "").trim();
  if (sym.length > 0) return sym.toUpperCase();
  const mint = (b.contract_address ?? "").trim();
  if (mint.length > 0) return shortenMint(mint);
  return "?";
}

function minBlockTimeFromSignatures(rows: SigRow[] | null): number | null {
  let m: number | null = null;
  for (const s of rows ?? []) {
    if (s.blockTime !== null && Number.isFinite(s.blockTime)) {
      const t = Number(s.blockTime);
      m = m === null ? t : Math.min(m, t);
    }
  }
  return m;
}

/** Helius enhanced `timestamp` may be seconds or ms; Solana RPC `blockTime` is seconds. */
function normalizeUnixSeconds(t: number): number {
  if (!Number.isFinite(t)) return t;
  if (t > 1_000_000_000_000) return Math.floor(t / 1000);
  return Math.floor(t);
}

function scoreWalletAge(
  data: FetchBundle,
  nowSec: number
): { score: number; detail: string } {
  const scan = data.walletAgeScan;
  const deepOldest = scan?.oldestSec ?? null;
  const oldestSec =
    deepOldest ?? minBlockTimeFromSignatures(data.signatures);
  const usedRecentFallback =
    oldestSec !== null &&
    deepOldest === null &&
    minBlockTimeFromSignatures(data.signatures) !== null;

  if (oldestSec === null) {
    const extra =
      data.errors.heliusSignatures ||
      data.errors.heliusParse ||
      data.errors.heliusWalletAge
        ? " Transaction history could not be loaded completely."
        : "";
    return {
      score: 50,
      detail: `No dated transactions were available to estimate wallet age; using a neutral score (50).${extra}`,
    };
  }

  const ageSec = Math.max(0, nowSec - oldestSec);
  const ageDays = ageSec / 86400;
  const dateStr = formatDate(oldestSec);

  const highActivityCap =
    scan != null &&
    ageDays < 7 &&
    scan.pagesScanned === WALLET_AGE_MAX_PAGES &&
    scan.lastPageFull &&
    !scan.rateLimitedStop;

  if (highActivityCap) {
    const spanHuman =
      ageDays >= 1
        ? `${ageDays.toFixed(2)} calendar days`
        : ageSec >= 3600
          ? `${(ageSec / 3600).toFixed(2)} hours`
          : ageSec >= 60
            ? `${(ageSec / 60).toFixed(0)} minutes`
            : "under a minute";
    const maxRows = WALLET_AGE_MAX_PAGES * WALLET_AGE_PAGE_LIMIT;
    return {
      score: 10,
      detail: `Signature history scan reached the configured depth (${scan.totalRows} rows across ${scan.pagesScanned} page(s), up to ${WALLET_AGE_PAGE_LIMIT} signatures per page, max ${maxRows}) and the oldest dated activity is still only about ${spanHuman} back (earliest dated sig ${dateStr}; ${ageDays.toFixed(4)} calendar days), so the address behaves like an extremely high-churn hot wallet—scored like an established active account (sub-score 10).`,
    };
  }

  if (ageDays >= 90) {
    return {
      score: 10,
      detail: `The oldest signed activity for this wallet is about ${ageDays.toFixed(0)} calendar days ago (${dateStr}), beyond 90 days (sub-score 10).${usedRecentFallback ? " Age uses the recent 50-signature window because the deep scan did not yield block times." : ""}`,
    };
  }
  if (ageDays >= 30) {
    return {
      score: 25,
      detail: `The oldest signed activity is about ${ageDays.toFixed(1)} calendar days ago (${dateStr}), in the 30–90 day band (sub-score 25).${usedRecentFallback ? " (Recent-signature fallback.)" : ""}`,
    };
  }
  if (ageDays >= 7) {
    return {
      score: 50,
      detail: `The oldest signed activity is about ${ageDays.toFixed(1)} calendar days ago (${dateStr}), in the 7–30 day band (sub-score 50).${usedRecentFallback ? " (Recent-signature fallback.)" : ""}`,
    };
  }

  return {
    score: 80,
    detail: `The oldest signed activity is only about ${ageDays.toFixed(1)} calendar days ago (${dateStr}), under 7 days, consistent with a genuinely new or low-history wallet (sub-score 80).${usedRecentFallback ? " Estimate uses the recent 50-signature window because deep pagination did not yield an older time." : ""}`,
  };
}

function scoreConcentration(
  data: FetchBundle
): { score: number; detail: string } {
  if (!data.balances) {
    return {
      score: 50,
      detail: `Portfolio breakdown was unavailable${data.errors.goldrush ? ` (${data.errors.goldrush})` : ""}; concentration scored neutrally at 50.`,
    };
  }
  const usable = data.balances.filter((b) => !b.is_spam);
  const total = usable.reduce((s, b) => s + (b.quote ?? 0), 0);
  if (total <= 0) {
    return {
      score: 50,
      detail:
        "Reported portfolio USD value is zero or missing; concentration cannot be computed meaningfully (neutral 50).",
    };
  }
  const nonStable = usable.filter(
    (b) => !STABLE_TICKERS.has((b.contract_ticker_symbol ?? "").toUpperCase())
  );
  const nonStableTotal = nonStable.reduce((s, b) => s + (b.quote ?? 0), 0);
  if (nonStableTotal <= 0) {
    return {
      score: 5,
      detail:
        "Holdings appear to be entirely stablecoins (or only stable-valued positions), so concentration in risky assets is minimal (sub-score 5).",
    };
  }
  let largest = 0;
  let largestSym = "";
  for (const b of nonStable) {
    const q = b.quote ?? 0;
    if (q > largest) {
      largest = q;
      largestSym = b.contract_ticker_symbol ?? "?";
    }
  }
  const pct = (largest / total) * 100;
  if (pct > 90) {
    return {
      score: 85,
      detail: `About ${pct.toFixed(1)}% of total portfolio USD ($${total.toFixed(2)}) sits in one non-stable token (${largestSym}), above the 90% threshold (sub-score 85).`,
    };
  }
  if (pct >= 70) {
    return {
      score: 60,
      detail: `Roughly ${pct.toFixed(1)}% of portfolio USD is concentrated in ${largestSym} (70–90% band, sub-score 60).`,
    };
  }
  if (pct >= 40) {
    return {
      score: 30,
      detail: `About ${pct.toFixed(1)}% of portfolio USD is in the largest non-stable holding (${largestSym}), in the 40–70% band (sub-score 30).`,
    };
  }
  return {
    score: 10,
    detail: `The largest non-stable position (${largestSym}) is only about ${pct.toFixed(1)}% of total USD ($${total.toFixed(2)}), below 40% (sub-score 10).`,
  };
}

function scoreTxDiversity(data: FetchBundle): { score: number; detail: string } {
  if (data.parsedTxs === null) {
    const nSig = data.signatures?.length ?? 0;
    return {
      score: 40,
      detail: `Could not classify transaction types for ${nSig} signatures${data.errors.heliusParse ? ` (${data.errors.heliusParse})` : ""}; diversity scored neutrally at 40.`,
    };
  }
  const txs = data.parsedTxs;
  if (txs.length === 0) {
    return {
      score: 40,
      detail:
        "No recent parsed transactions were available, so activity looks inactive or unreadable (neutral diversity score 40).",
    };
  }
  const types = new Set(
    txs.map((t) => (t.type && t.type.length > 0 ? t.type : "UNKNOWN"))
  );
  const list = [...types].sort().join(", ");
  if (types.size <= 1) {
    return {
      score: 75,
      detail: `Only one transaction type appears in recent history (${list}), which is unusually monotone (sub-score 75).`,
    };
  }
  if (types.size === 2) {
    return {
      score: 45,
      detail: `Two distinct types were observed (${list}), in the 2-type band (sub-score 45).`,
    };
  }
  return {
    score: 15,
    detail: `${types.size} distinct types were observed (${list}), indicating healthier variety (sub-score 15).`,
  };
}

function scoreLongtail(data: FetchBundle): { score: number; detail: string } {
  if (!data.balances) {
    return {
      score: 50,
      detail: `Portfolio data was missing${data.errors.goldrush ? ` (${data.errors.goldrush})` : ""}; long-tail exposure scored neutrally at 50.`,
    };
  }
  const usable = data.balances.filter((b) => !b.is_spam);
  const total = usable.reduce((s, b) => s + (b.quote ?? 0), 0);
  if (total <= 0) {
    return {
      score: 5,
      detail:
        "No priced portfolio USD was returned, so long-tail share is treated as zero (sub-score 5).",
    };
  }
  let longtail = 0;
  let topLong: { label: string; q: number } | null = null;
  for (const b of usable) {
    const sym = (b.contract_ticker_symbol ?? "").toUpperCase();
    const q = b.quote ?? 0;
    if (!MAJOR_TICKERS.has(sym)) {
      longtail += q;
      const label = tokenDisplayName(b);
      if (!topLong || q > topLong.q) topLong = { label, q };
    }
  }
  const ratio = longtail / total;
  const topDesc = topLong
    ? `largest long-tail slice ~$${topLong.q.toFixed(2)} in ${topLong.label}`
    : "no single long-tail name";
  if (ratio > 0.7) {
    return {
      score: 80,
      detail: `About ${(ratio * 100).toFixed(1)}% of portfolio USD ($${total.toFixed(2)}) sits outside the major-token basket, with ${topDesc} (sub-score 80).`,
    };
  }
  if (ratio >= 0.4) {
    return {
      score: 55,
      detail: `Long-tail tokens represent roughly ${(ratio * 100).toFixed(1)}% of USD value (${topDesc}), in the 40–70% band (sub-score 55).`,
    };
  }
  if (ratio >= 0.15) {
    return {
      score: 30,
      detail: `Long-tail share is about ${(ratio * 100).toFixed(1)}% of USD (${topDesc}), in the 15–40% band (sub-score 30).`,
    };
  }
  if (ratio > 0) {
    return {
      score: 10,
      detail: `Only about ${(ratio * 100).toFixed(1)}% of USD is outside major tokens (${topDesc}), below 15% (sub-score 10).`,
    };
  }
  return {
    score: 5,
    detail:
      "Essentially all priced value sits in major tokens, so long-tail exposure is minimal (sub-score 5).",
  };
}

function scoreActivityRecency(
  data: FetchBundle,
  nowSec: number
): { score: number; detail: string } {
  const times: number[] = [];
  for (const s of data.signatures ?? []) {
    if (s.blockTime !== null && Number.isFinite(s.blockTime)) {
      times.push(s.blockTime);
    }
  }
  for (const tx of data.parsedTxs ?? []) {
    if (tx.timestamp !== undefined && Number.isFinite(tx.timestamp)) {
      times.push(normalizeUnixSeconds(tx.timestamp));
    }
  }
  const nSig = data.signatures?.length ?? 0;
  if (times.length === 0) {
    return {
      score: 50,
      detail:
        "No recent transaction timestamps were available, so recency is treated as inactive/unknown (score 50).",
    };
  }
  const latest = Math.max(...times);
  const recencySec = Math.max(0, nowSec - latest);
  const hours = recencySec / 3600;
  const days = hours / 24;
  if (hours < 24) {
    const recencyHuman =
      hours < 1 ? "less than 1 hour" : `about ${hours.toFixed(1)} hours`;
    return {
      score: 20,
      detail: `Latest activity was ${recencyHuman} ago, within 24 hours (sub-score 20).`,
    };
  }
  if (days < 7) {
    return {
      score: 15,
      detail: `Latest activity was about ${days.toFixed(1)} days ago, in the 1–7 day band (sub-score 15).`,
    };
  }
  if (days < 30) {
    return {
      score: 40,
      detail: `Latest activity was about ${days.toFixed(1)} days ago, in the 7–30 day band (sub-score 40).`,
    };
  }
  if (nSig > 10) {
    return {
      score: 65,
      detail: `No activity for about ${days.toFixed(0)} days while ${nSig} recent signatures exist in the window, suggesting dormancy after prior activity (sub-score 65).`,
    };
  }
  return {
    score: 50,
    detail: `Latest activity was about ${days.toFixed(0)} days ago with limited recent signature depth (${nSig}), scored as dormant/low-signal (50).`,
  };
}

function scoreDust(
  data: FetchBundle
): { score: number; detail: string } {
  const txCount = data.signatures?.length ?? 0;
  let totalUsd = 0;
  if (data.balances) {
    totalUsd = data.balances
      .filter((b) => !b.is_spam)
      .reduce((s, b) => s + (b.quote ?? 0), 0);
  }
  const missingUsd = !data.balances || data.errors.goldrush;
  if (missingUsd) {
    return {
      score: txCount > 20 ? 45 : 40,
      detail: `Portfolio USD could not be determined${data.errors.goldrush ? ` (${data.errors.goldrush})` : ""} while ${txCount} recent signatures were seen; using a conservative dust heuristic (sub-score ${txCount > 20 ? 45 : 40}).`,
    };
  }
  if (totalUsd < 10 && txCount > 20) {
    return {
      score: 75,
      detail: `Portfolio is only about $${totalUsd.toFixed(2)} across priced tokens but ${txCount} recent signatures were observed, resembling a burner or relay pattern (sub-score 75).`,
    };
  }
  if (totalUsd < 10) {
    return {
      score: 40,
      detail: `Low portfolio USD (~$${totalUsd.toFixed(2)}) with ${txCount} recent signatures fits a light-activity or staging pattern (sub-score 40).`,
    };
  }
  return {
    score: 10,
    detail: `Portfolio USD is about $${totalUsd.toFixed(2)} with ${txCount} recent signatures, above the $10 dust threshold (sub-score 10).`,
  };
}

function buildDataQualityNote(data: FetchBundle): string | null {
  const parts: string[] = [];
  if (data.errors.goldrush) parts.push(`GoldRush: ${data.errors.goldrush}`);
  if (data.errors.heliusSignatures)
    parts.push(`Helius signatures: ${data.errors.heliusSignatures}`);
  if (data.errors.heliusParse)
    parts.push(`Helius parse: ${data.errors.heliusParse}`);
  if (data.errors.heliusWalletAge)
    parts.push(`Helius wallet-age scan: ${data.errors.heliusWalletAge}`);
  return parts.length ? parts.join(" | ") : null;
}

/**
 * Computes a 0–100 wallet risk score from Helius transaction history and GoldRush balances.
 */
export async function assessWalletRisk(
  input: WalletRiskInput
): Promise<WalletRiskOutput> {
  const t0 = performance.now();
  const wallet = validateSolanaWallet(input.wallet);
  const nowSec = Math.floor(Date.now() / 1000);

  const { bundle: data, timings: loadTimings } = await loadWalletData(wallet);
  const dataNote = buildDataQualityNote(data);

  const parts = {
    walletAge: scoreWalletAge(data, nowSec),
    concentration: scoreConcentration(data),
    txDiversity: scoreTxDiversity(data),
    longtailExposure: scoreLongtail(data),
    activityRecency: scoreActivityRecency(data, nowSec),
    dustAnomaly: scoreDust(data),
  };

  const weightSum =
    WEIGHTS.walletAge +
    WEIGHTS.concentration +
    WEIGHTS.txDiversity +
    WEIGHTS.longtailExposure +
    WEIGHTS.activityRecency +
    WEIGHTS.dustAnomaly;

  let weighted = 0;
  weighted += parts.walletAge.score * WEIGHTS.walletAge;
  weighted += parts.concentration.score * WEIGHTS.concentration;
  weighted += parts.txDiversity.score * WEIGHTS.txDiversity;
  weighted += parts.longtailExposure.score * WEIGHTS.longtailExposure;
  weighted += parts.activityRecency.score * WEIGHTS.activityRecency;
  weighted += parts.dustAnomaly.score * WEIGHTS.dustAnomaly;

  const score = Math.round(weighted / weightSum);
  const tier = tierFromScore(score);

  const reasons: WalletRiskReason[] = [
    {
      factor: "walletAge",
      weight: WEIGHTS.walletAge,
      detail: parts.walletAge.detail,
    },
    {
      factor: "concentration",
      weight: WEIGHTS.concentration,
      detail: parts.concentration.detail,
    },
    {
      factor: "txDiversity",
      weight: WEIGHTS.txDiversity,
      detail: parts.txDiversity.detail,
    },
    {
      factor: "longtailExposure",
      weight: WEIGHTS.longtailExposure,
      detail: parts.longtailExposure.detail,
    },
    {
      factor: "activityRecency",
      weight: WEIGHTS.activityRecency,
      detail: parts.activityRecency.detail,
    },
    {
      factor: "dustAnomaly",
      weight: WEIGHTS.dustAnomaly,
      detail: parts.dustAnomaly.detail,
    },
  ];

  if (dataNote) {
    const first = reasons[0]!;
    reasons[0] = {
      factor: first.factor,
      weight: first.weight,
      detail: `${first.detail} Data caveat: ${dataNote}`,
    };
  }

  const total_ms = Math.round(performance.now() - t0);
  console.log("[assess-wallet-risk] timings", {
    balances_ms: Math.round(loadTimings.balances_ms),
    recentSigs_ms: Math.round(loadTimings.recentSigs_ms),
    walletAgeScan_ms: Math.round(loadTimings.walletAgeScan_ms),
    parseTransactions_ms: Math.round(loadTimings.parseTransactions_ms),
    total_ms,
  });
  console.log("[assess-wallet-risk] completed", {
    wallet,
    score,
    tier,
    ms: total_ms,
    sigCount: data.signatures?.length ?? 0,
    parsedCount: data.parsedTxs?.length ?? 0,
    balanceCount: data.balances?.length ?? 0,
    errors: data.errors,
  });

  return {
    score,
    tier,
    reasons,
    wallet,
    analyzedAt: new Date().toISOString(),
  };
}
