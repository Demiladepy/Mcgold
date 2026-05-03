import { ChainName } from "@covalenthq/client-sdk";
import { PublicKey } from "@solana/web3.js";
import { getCached, setCached } from "../cache.js";
import { getGoldRushClient, getHeliusClient } from "../clients.js";
import type {
  WhaleActivityInput,
  WhaleActivityOutput,
} from "./types.js";

/** Minimal Helius enhanced tx fields used for whale movement parsing. */
type ParsedTokenTransfer = {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number | string;
  decimals?: number;
};

type ParsedTx = {
  type?: string;
  signature: string;
  timestamp?: number;
  tokenTransfers?: ParsedTokenTransfer[];
};

const CACHE_PREFIX = "whale-activity:v4:";
const CACHE_TTL_MS = 5 * 60 * 1000;
const HOLDER_FETCH_DELAY_MS = 150;
const TOP_HOLDER_COUNT = 10;
/** Per-holder enhanced tx cap (server still filters by gteTime). Lower = less movements_ms. */
const TX_LIMIT_PER_HOLDER = 25;
/** Min share of mint supply represented by the sum of all balances on the `getTokenAccounts` page. */
const MIN_PAGE_COVERAGE_PERCENT = 0.5;
/** Ignore new-whale math for holders below this fraction of total supply (filters dust ATAs on huge floats). */
const MIN_WHALE_SHARE_OF_SUPPLY = 1e-5;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
}

function validateMint(mint: string): string {
  const trimmed = mint.trim();
  try {
    return new PublicKey(trimmed).toBase58();
  } catch {
    throw new Error(`Invalid Solana mint address: "${mint}"`);
  }
}

function clampWindowHours(h?: number): number {
  const w = h === undefined || Number.isNaN(h) ? 24 : Math.floor(h);
  return Math.min(72, Math.max(1, w));
}

/**
 * DAS / Helius amounts: `getAsset.token_info.supply` and `getTokenAccounts[].amount` are
 * expected in the mint's **smallest unit** (integer string/number). `token_info.decimals`
 * scales those raw values to human UI: `ui = raw / 10^decimals`.
 *
 * **% of supply** is always `(sum holder_ui) / supply_ui * 100` so numerator and denominator
 * match. (Mathematically this equals `sum raw / supply raw`, but computing in UI makes the
 * intent obvious and avoids accidental mixed scaling if one source ever drifts.)
 *
 * **Coverage:** `getTokenAccounts` returns a single page of ATAs, not guaranteed to be the
 * largest holders globally. If the sum of *all* balances on that page is a tiny fraction of
 * `getAsset` supply (e.g. random dust vs USDC float), concentration % would be meaningless —
 * we null `top10HoldingPercent` and each `percentOfSupply` in that case.
 */
function toUiTokenAmount(
  raw: number,
  decimals: number
): number | null {
  if (!Number.isFinite(raw) || raw < 0) return null;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 24) {
    return null;
  }
  return raw / 10 ** decimals;
}

function isValidPercent(p: number): boolean {
  return Number.isFinite(p) && p >= 0 && p <= 100;
}

/** Parse positive numeric supply from DAS (number or numeric string). */
function parseSupplyRaw(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val) && val > 0) return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function transferUiAmount(tt: ParsedTokenTransfer): number {
  const raw =
    typeof tt.tokenAmount === "number"
      ? tt.tokenAmount
      : parseFloat(String(tt.tokenAmount).replace(/,/g, ""));
  const d = tt.decimals ?? 0;
  if (!Number.isFinite(raw)) return 0;
  return raw / 10 ** d;
}

function txTimestampSec(tx: ParsedTx): number | null {
  const t = tx.timestamp;
  if (t === undefined || !Number.isFinite(t)) return null;
  return t > 1_000_000_000_000 ? Math.floor(t / 1000) : Math.floor(t);
}

function classifyMintMovementsForHolder(
  tx: ParsedTx,
  holder: string,
  mint: string,
  tokenDecimals: number | undefined
): Array<{
  type: "buy" | "sell" | "transfer_in" | "transfer_out";
  amountUi: number;
}> {
  const transfers = (tx.tokenTransfers ?? []).filter(
    (x: ParsedTokenTransfer) =>
      x.mint === mint || x.mint?.toLowerCase?.() === mint.toLowerCase()
  );
  if (transfers.length === 0) return [];

  let delta = 0;
  for (const tt of transfers) {
    const amt = transferUiAmount({
      ...tt,
      decimals: tt.decimals ?? tokenDecimals ?? 0,
    });
    if (tt.toUserAccount === holder) delta += amt;
    if (tt.fromUserAccount === holder) delta -= amt;
  }
  const eps = 1e-12;
  if (Math.abs(delta) < eps) return [];

  const t = (tx.type ?? "").toUpperCase();
  const isSwap = t.includes("SWAP");

  if (delta > eps) {
    return [{ type: isSwap ? "buy" : "transfer_in", amountUi: delta }];
  }
  return [{ type: isSwap ? "sell" : "transfer_out", amountUi: -delta }];
}

async function fetchTokenHolders(mint: string): Promise<{
  rows: Array<{ owner: string; amount: number }>;
  /** Sum of raw amounts for every account in this response (coverage vs supply). */
  pageRawSum: number;
  /** Distinct owners with positive balance on this Helius page (for GoldRush cross-check). */
  uniqueOwnersOnPage: number;
  error?: string;
}> {
  try {
    const helius = getHeliusClient();
    const res = await helius.getTokenAccounts({
      mint,
      page: 1,
      limit: 100,
      options: { showZeroBalance: false },
    });
    const accounts = res.token_accounts ?? [];
    let pageRawSum = 0;
    const byOwner = new Map<string, number>();
    for (const a of accounts) {
      const owner = a.owner?.trim();
      if (!owner) continue;
      const amt = typeof a.amount === "number" ? a.amount : Number(a.amount);
      if (!Number.isFinite(amt) || amt <= 0) continue;
      pageRawSum += amt;
      byOwner.set(owner, (byOwner.get(owner) ?? 0) + amt);
    }
    const uniqueOwnersOnPage = byOwner.size;
    const rows = [...byOwner.entries()]
      .map(([owner, amount]) => ({ owner, amount }))
      .sort((x, y) => y.amount - x.amount)
      .slice(0, TOP_HOLDER_COUNT);
    return { rows, pageRawSum, uniqueOwnersOnPage };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trace-whale-activity] getTokenAccounts failed", {
      mint,
      err,
    });
    return { rows: [], pageRawSum: 0, uniqueOwnersOnPage: 0, error: msg };
  }
}

/**
 * First iterable page from GoldRush `getTokenHoldersV2ForTokenAddress` (matches SDK:
 * `chainName`, `tokenAddress`, then `{ pageSize, pageNumber }`).
 * Solana-mainnet coverage is often incomplete — errors and empty payloads become `count: null`.
 */
async function fetchGoldRushHolderPageCount(mint: string): Promise<{
  count: number | null;
  /** Message for `holderSourceReason` when falling back to Helius-only (API error text or short note). */
  failureDetail: string | null;
}> {
  try {
    const gr = getGoldRushClient();
    const iterable = gr.BalanceService.getTokenHoldersV2ForTokenAddress(
      ChainName.SOLANA_MAINNET,
      mint,
      { pageSize: 100, pageNumber: 0 }
    );

    for await (const resp of iterable) {
      if (resp.error) {
        const msg = (resp.error_message ?? "GoldRush holders error").trim();
        console.error("[trace-whale-activity] GoldRush token holders API error", {
          mint,
          msg,
        });
        return { count: null, failureDetail: msg };
      }
      const items = resp.data?.items ?? [];
      if (items.length === 0) {
        return {
          count: null,
          failureDetail:
            "GoldRush returned success but an empty holders page for this mint.",
        };
      }
      return { count: items.length, failureDetail: null };
    }

    return {
      count: null,
      failureDetail:
        "GoldRush holder iterator produced no page for this request.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trace-whale-activity] GoldRush token holders threw", {
      mint,
      err,
    });
    return { count: null, failureDetail: msg };
  }
}

/** True if absolute difference exceeds 30% of the smaller nonzero count (or counts differ when one side is zero). */
function holderPageCountsStronglyDisagree(a: number, b: number): boolean {
  if (a === b) return false;
  const smaller = Math.min(a, b);
  const diff = Math.abs(a - b);
  if (smaller === 0) return diff > 0;
  return diff > 0.3 * smaller;
}

async function fetchMintMetadata(mint: string): Promise<{
  symbol: string | null;
  /** Total supply in smallest units (same base as holder balances from getTokenAccounts). */
  supplyRaw: number | null;
  decimals: number | undefined;
  /** Jupiter-derived spot from DAS when present (fallback when GoldRush has no price). */
  heliusUsd: number | null;
}> {
  try {
    const helius = getHeliusClient();
    const asset = await helius.getAsset({
      id: mint,
      options: { showFungible: true },
    });
    const sym =
      asset.token_info?.symbol?.trim() ||
      asset.content?.metadata?.symbol?.trim() ||
      null;
    const supplyRaw = parseSupplyRaw(asset.token_info?.supply);
    const decimals = asset.token_info?.decimals;
    const hi = asset.token_info?.price_info?.price_per_token;
    const heliusUsd =
      typeof hi === "number" && Number.isFinite(hi) ? hi : null;
    return { symbol: sym, supplyRaw, decimals, heliusUsd };
  } catch (err) {
    console.error("[trace-whale-activity] getAsset failed", { mint, err });
    return {
      symbol: null,
      supplyRaw: null,
      decimals: undefined,
      heliusUsd: null,
    };
  }
}

async function fetchTokenUsdPrice(mint: string): Promise<number | null> {
  try {
    const gr = getGoldRushClient();
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    const resp = await gr.PricingService.getTokenPrices(
      ChainName.SOLANA_MAINNET,
      "USD",
      mint,
      {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        pricesAtAsc: true,
      }
    );
    if (resp.error) {
      console.error("[trace-whale-activity] GoldRush pricing error", {
        mint,
        msg: resp.error_message,
      });
      return null;
    }
    const first = resp.data?.[0];
    const items = first?.items ?? [];
    if (items.length === 0) return null;
    const last = items[items.length - 1];
    const p = last?.price;
    if (typeof p !== "number" || !Number.isFinite(p)) return null;
    return p;
  } catch (err) {
    console.error("[trace-whale-activity] GoldRush pricing threw", {
      mint,
      err,
    });
    return null;
  }
}

/**
 * Whale / top-holder activity for a Solana mint: holders, windowed movements, concentration, flags.
 */
export async function traceWhaleActivity(
  input: WhaleActivityInput
): Promise<WhaleActivityOutput> {
  const t0 = performance.now();
  const mint = validateMint(input.mint);
  const windowHours = clampWindowHours(input.windowHours);
  const windowStartSec = Math.floor(Date.now() / 1000) - windowHours * 3600;

  const cacheKey = `${CACHE_PREFIX}${mint}:${windowHours}`;
  const cached = getCached<WhaleActivityOutput>(cacheKey);
  if (cached) {
    const total_ms = Math.round(performance.now() - t0);
    console.log("[trace-whale-activity] timings", {
      holdersFetch_ms: 0,
      goldrushHolders_ms: 0,
      holders_ms: 0,
      pricing_ms: 0,
      movements_ms: 0,
      total_ms,
    });
    return cached;
  }

  let partial = false;

  const tHoldersFetch0 = performance.now();
  const holdersRes = await fetchTokenHolders(mint);
  const holdersFetch_ms = performance.now() - tHoldersFetch0;

  const tGoldRushHolders0 = performance.now();
  const grHoldersPage = await fetchGoldRushHolderPageCount(mint);
  const goldrushHolders_ms = performance.now() - tGoldRushHolders0;

  const goldrushHolderCount = grHoldersPage.count;
  const heliusHolderCount = holdersRes.uniqueOwnersOnPage;

  let holderSourcesAgree: boolean | null = null;
  let holderSource: WhaleActivityOutput["holderSource"];
  let holderSourceReason: string;

  if (goldrushHolderCount === null) {
    holderSourcesAgree = null;
    holderSource = "helius_only";
    const hint =
      grHoldersPage.failureDetail ??
      "GoldRush did not return usable holder data for this mint.";
    holderSourceReason = `${hint} Using Helius first-page unique-owner count only.`;
  } else if (heliusHolderCount > 0) {
    holderSource = "both";
    holderSourcesAgree = !holderPageCountsStronglyDisagree(
      heliusHolderCount,
      goldrushHolderCount
    );
    holderSourceReason = holderSourcesAgree
      ? `GoldRush and Helius first-page holder counts agree within ~30% (${goldrushHolderCount} vs ${heliusHolderCount}).`
      : `GoldRush (${goldrushHolderCount}) and Helius (${heliusHolderCount}) first-page holder counts differ by more than ~30%.`;
  } else {
    holderSource = "goldrush_only";
    holderSourcesAgree = null;
    holderSourceReason = `Helius reported no funded token accounts on the first page while GoldRush returned ${goldrushHolderCount} holder row(s); whale movement analysis still follows Helius top-holder addresses when present.`;
  }

  const holderSourceDisagreement =
    holderSource === "both" && holderSourcesAgree === false;

  const tHoldersMeta0 = performance.now();
  const meta = await fetchMintMetadata(mint);
  const holders_ms = performance.now() - tHoldersMeta0;
  if (holdersRes.error) partial = true;

  const tPrice0 = performance.now();
  const goldRushUsd = await fetchTokenUsdPrice(mint);
  const tokenUSDPrice = goldRushUsd ?? meta.heliusUsd ?? null;
  const pricing_ms = performance.now() - tPrice0;

  const decimals = meta.decimals;
  const supplyRaw = meta.supplyRaw;
  const decimalsNum =
    typeof decimals === "number" &&
    Number.isInteger(decimals) &&
    decimals >= 0 &&
    decimals <= 24
      ? decimals
      : null;

  const tMove0 = performance.now();
  const helius = getHeliusClient();
  const notableMovements: WhaleActivityOutput["notableMovements"] = [];
  const holdersWithMovement = new Set<string>();
  let rateLimited = false;

  for (let i = 0; i < holdersRes.rows.length; i++) {
    if (i > 0) await sleep(HOLDER_FETCH_DELAY_MS);
    const holder = holdersRes.rows[i]!.owner;
    try {
      const txs = (await helius.enhanced.getTransactionsByAddress({
        address: holder,
        limit: TX_LIMIT_PER_HOLDER,
        gteTime: windowStartSec,
        sortOrder: "desc",
      })) as ParsedTx[];
      for (const tx of txs) {
        const tsSec = txTimestampSec(tx);
        if (tsSec === null) continue;
        const moves = classifyMintMovementsForHolder(
          tx,
          holder,
          mint,
          decimals
        );
        for (const m of moves) {
          holdersWithMovement.add(holder);
          const amountUSD =
            tokenUSDPrice !== null ? m.amountUi * tokenUSDPrice : null;
          notableMovements.push({
            wallet: holder,
            type: m.type,
            amountTokens: String(m.amountUi),
            amountUSD,
            timestamp: new Date(tsSec * 1000).toISOString(),
            txSignature: tx.signature,
          });
        }
      }
    } catch (err) {
      if (isRateLimitedError(err)) {
        rateLimited = true;
        partial = true;
        console.error("[trace-whale-activity] holder tx fetch rate limited", {
          mint,
          holder,
          err,
        });
        break;
      }
      partial = true;
      console.error("[trace-whale-activity] holder tx fetch failed", {
        mint,
        holder,
        err,
      });
    }
  }

  const movements_ms = performance.now() - tMove0;
  console.log(
    "[trace-whale-activity] holder tx fetch cap per address:",
    TX_LIMIT_PER_HOLDER,
    "(expect lower movements_ms vs previous limit of 100)"
  );

  const supplyUi =
    decimalsNum !== null && supplyRaw !== null
      ? toUiTokenAmount(supplyRaw, decimalsNum)
      : null;

  const holderUiByWallet = new Map<string, number>();
  if (decimalsNum !== null) {
    for (const h of holdersRes.rows) {
      const ui = toUiTokenAmount(h.amount, decimalsNum);
      if (ui === null) {
        holderUiByWallet.clear();
        break;
      }
      holderUiByWallet.set(h.owner, ui);
    }
  }

  const pageCoveragePercent =
    supplyRaw !== null &&
    supplyRaw > 0 &&
    holdersRes.pageRawSum > 0 &&
    Number.isFinite(holdersRes.pageRawSum)
      ? (holdersRes.pageRawSum / supplyRaw) * 100
      : null;

  const concentrationDataOk =
    decimalsNum !== null &&
    supplyUi !== null &&
    supplyUi > 0 &&
    pageCoveragePercent !== null &&
    isValidPercent(pageCoveragePercent) &&
    pageCoveragePercent >= MIN_PAGE_COVERAGE_PERCENT;

  if (
    decimalsNum !== null &&
    supplyRaw !== null &&
    supplyRaw > 0 &&
    pageCoveragePercent !== null &&
    pageCoveragePercent < MIN_PAGE_COVERAGE_PERCENT
  ) {
    console.log(
      "[trace-whale-activity] concentration n/a: getTokenAccounts page covers",
      pageCoveragePercent.toFixed(6),
      "% of supply (need ≥",
      MIN_PAGE_COVERAGE_PERCENT,
      "% for reliable % of supply)"
    );
  }

  let top10HoldingPercent: number | null = null;
  if (concentrationDataOk) {
    let sumTop10Ui = 0;
    for (const h of holdersRes.rows) {
      const ui = toUiTokenAmount(h.amount, decimalsNum);
      if (ui === null) {
        sumTop10Ui = NaN;
        break;
      }
      sumTop10Ui += ui;
    }
    const p =
      Number.isFinite(sumTop10Ui) && supplyUi !== null && supplyUi > 0
        ? (sumTop10Ui / supplyUi) * 100
        : NaN;
    top10HoldingPercent = isValidPercent(p) ? p : null;
  }

  const topHolders: WhaleActivityOutput["topHolders"] = holdersRes.rows.map(
    (h) => {
      const holderUi =
        decimalsNum !== null ? toUiTokenAmount(h.amount, decimalsNum) : null;
      const balanceUSD =
        tokenUSDPrice !== null && holderUi !== null
          ? holderUi * tokenUSDPrice
          : null;
      let percentOfSupply: number | null = null;
      if (
        concentrationDataOk &&
        top10HoldingPercent !== null &&
        supplyUi !== null &&
        supplyUi > 0 &&
        holderUi !== null
      ) {
        const ph = (holderUi / supplyUi) * 100;
        percentOfSupply = isValidPercent(ph) ? ph : null;
      }
      return {
        wallet: h.owner,
        balance: String(h.amount),
        balanceUSD,
        percentOfSupply,
      };
    }
  );

  if (
    top10HoldingPercent !== null &&
    topHolders.some((r) => r.percentOfSupply === null)
  ) {
    top10HoldingPercent = null;
    for (let i = 0; i < topHolders.length; i++) {
      const row = topHolders[i]!;
      topHolders[i] = { ...row, percentOfSupply: null };
    }
  }

  let netFlowUSD: number | null = null;
  if (tokenUSDPrice !== null) {
    let buy = 0;
    let sell = 0;
    for (const mv of notableMovements) {
      if (mv.amountUSD === null) continue;
      if (mv.type === "buy" || mv.type === "transfer_in") buy += mv.amountUSD;
      if (mv.type === "sell" || mv.type === "transfer_out")
        sell += mv.amountUSD;
    }
    netFlowUSD = buy - sell;
  }

  const distinctWhalesActive = holdersWithMovement.size;

  const sumTop10Usd =
    tokenUSDPrice !== null && holderUiByWallet.size === holdersRes.rows.length
      ? holdersRes.rows.reduce(
          (s, h) => s + (holderUiByWallet.get(h.owner) ?? 0) * tokenUSDPrice,
          0
        )
      : null;

  const flags: string[] = [];
  const dataQualityNotes: string[] = [];
  if (holderSourceDisagreement) {
    flags.push("holder_source_disagreement");
    dataQualityNotes.push(
      `Holder counts disagree between GoldRush and Helius (${goldrushHolderCount} vs ${heliusHolderCount}) — treat distribution metrics with caution; one source may be lagging or not fully indexing this token.`
    );
  }
  if (
    netFlowUSD !== null &&
    netFlowUSD < 0 &&
    sumTop10Usd !== null &&
    sumTop10Usd > 0 &&
    Math.abs(netFlowUSD) > 0.1 * sumTop10Usd
  ) {
    flags.push("top_holder_net_selling");
  }

  /**
   * New-whale signal (no extra Helius calls): for each top holder with window activity,
   * estimate pre-window UI balance as current_ui − (tokens_in_window) + (tokens_out_window).
   * If that estimate is < 1% of current UI holdings, they likely had ~no position before the window.
   */
  let newWhale = false;
  const newWhaleDetails: Array<{
    wallet: string;
    currentUi: number;
    preWindowUi: number;
  }> = [];
  for (const h of holdersRes.rows) {
    if (!holdersWithMovement.has(h.owner)) continue;
    const currentUi = holderUiByWallet.get(h.owner);
    if (currentUi === undefined || currentUi <= 0) continue;
    if (
      supplyUi !== null &&
      supplyUi > 0 &&
      currentUi / supplyUi < MIN_WHALE_SHARE_OF_SUPPLY
    ) {
      continue;
    }
    let inTok = 0;
    let outTok = 0;
    for (const mv of notableMovements) {
      if (mv.wallet !== h.owner) continue;
      const a = parseFloat(mv.amountTokens);
      if (!Number.isFinite(a) || a <= 0) continue;
      if (mv.type === "buy" || mv.type === "transfer_in") inTok += a;
      else outTok += a;
    }
    const preWindowUi = Math.max(0, currentUi - inTok + outTok);
    if (preWindowUi / currentUi < 0.01) {
      newWhale = true;
      newWhaleDetails.push({ wallet: h.owner, currentUi, preWindowUi });
    }
  }
  if (newWhale) {
    flags.push("new_whale_entered");
    for (const d of newWhaleDetails) {
      const usdStr =
        tokenUSDPrice !== null
          ? `$${(d.currentUi * tokenUSDPrice).toFixed(2)}`
          : "an unknown USD amount (no spot price)";
      console.log("[trace-whale-activity] new_whale_entered", {
        mint,
        wallet: d.wallet,
        detail: `Wallet ${d.wallet} had effectively zero position before the window (estimated pre-window ~${d.preWindowUi.toFixed(6)} UI tokens) but now holds ${usdStr} worth at current balance ~${d.currentUi.toFixed(6)} UI tokens.`,
      });
    }
  }

  if (top10HoldingPercent !== null && top10HoldingPercent > 80) {
    flags.push("high_concentration");
  }

  if (top10HoldingPercent !== null && supplyUi !== null && supplyUi > 0) {
    let top3Ui = 0;
    for (const h of holdersRes.rows.slice(0, 3)) {
      const ui =
        decimalsNum !== null ? toUiTokenAmount(h.amount, decimalsNum) : null;
      if (ui === null) {
        top3Ui = NaN;
        break;
      }
      top3Ui += ui;
    }
    const top3Pct =
      Number.isFinite(top3Ui) && supplyUi > 0
        ? (top3Ui / supplyUi) * 100
        : NaN;
    if (isValidPercent(top3Pct) && top3Pct > 50) {
      flags.push("low_liquidity_risk");
    }
  }

  const out: WhaleActivityOutput = {
    mint,
    symbol: meta.symbol,
    tokenUSDPrice,
    analyzedAt: new Date().toISOString(),
    partial,
    heliusHolderCount,
    goldrushHolderCount,
    holderSourcesAgree,
    holderSource,
    holderSourceReason,
    dataQualityNotes,
    topHolders,
    notableMovements,
    concentration: {
      top10HoldingPercent,
      netFlowUSD,
      distinctWhalesActive,
    },
    flags,
  };

  setCached(cacheKey, out, CACHE_TTL_MS);

  const total_ms = Math.round(performance.now() - t0);
  console.log("[trace-whale-activity] timings", {
    holdersFetch_ms: Math.round(holdersFetch_ms),
    goldrushHolders_ms: Math.round(goldrushHolders_ms),
    holders_ms: Math.round(holders_ms),
    pricing_ms: Math.round(pricing_ms),
    movements_ms: Math.round(movements_ms),
    total_ms,
  });

  return out;
}
