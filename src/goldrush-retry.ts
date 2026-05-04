type GoldRushLikeResponse = {
  error?: boolean;
  error_code?: string | number;
  error_message?: string;
};

const RETRYABLE_STATUS = new Set(["429", "500", "503"]);
const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;
const MAX_JITTER_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRetryableStatus(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return RETRYABLE_STATUS.has(s) ? s : null;
}

function extractRetryableStatusFromError(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) return "429";
  if (msg.includes("500")) return "500";
  if (msg.includes("503")) return "503";
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit")) return "429";
  if (lower.includes("service unavailable")) return "503";
  if (lower.includes("internal server error")) return "500";
  return null;
}

/**
 * Shared retry helper for GoldRush SDK calls.
 * Retries transient statuses (429/500/503) with exponential backoff + jitter.
 */
export async function withGoldRushRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      const maybe = result as GoldRushLikeResponse;
      const status = maybe?.error ? asRetryableStatus(maybe.error_code) : null;
      if (!status) return result;
      if (attempt === maxAttempts) return result;
      const delay =
        BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * MAX_JITTER_MS);
      console.warn(`[goldrush-retry] ${label} retrying after response error`, {
        attempt,
        nextDelayMs: delay,
        status,
        message: maybe.error_message ?? "",
      });
      await sleep(delay);
      continue;
    } catch (err) {
      lastErr = err;
      const status = extractRetryableStatusFromError(err);
      if (!status || attempt === maxAttempts) {
        throw err;
      }
      const delay =
        BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * MAX_JITTER_MS);
      console.warn(`[goldrush-retry] ${label} retrying after thrown error`, {
        attempt,
        nextDelayMs: delay,
        status,
        message: err instanceof Error ? err.message : String(err),
      });
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("GoldRush call failed");
}
