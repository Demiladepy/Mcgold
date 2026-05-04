export const GOLDRUSH_X402_BASE_URL =
  process.env.GOLDRUSH_X402_BASE_URL?.trim() || "https://x402.goldrush.dev/v1";

type X402EndpointInfo = Record<string, unknown>;

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${GOLDRUSH_X402_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`GoldRush x402 request failed (${res.status}) for ${path}`);
  }
  return res.json();
}

/** Free endpoint discovery (no payment). */
export async function listGoldRushX402Endpoints(): Promise<X402EndpointInfo[]> {
  const data = (await fetchJson("/x402/endpoints")) as { endpoints?: X402EndpointInfo[] } | X402EndpointInfo[];
  if (Array.isArray(data)) return data;
  return data.endpoints ?? [];
}

/** Free endpoint search by keyword. */
export async function searchGoldRushX402Endpoints(
  query: string
): Promise<X402EndpointInfo[]> {
  const q = encodeURIComponent(query.trim());
  const data = (await fetchJson(`/x402/search?q=${q}`)) as
    | { results?: X402EndpointInfo[]; endpoints?: X402EndpointInfo[] }
    | X402EndpointInfo[];
  if (Array.isArray(data)) return data;
  return data.results ?? data.endpoints ?? [];
}

/** Free endpoint metadata lookup. */
export async function getGoldRushX402EndpointDetails(
  endpointName: string
): Promise<X402EndpointInfo> {
  return (await fetchJson(`/x402/endpoints/${encodeURIComponent(endpointName)}`)) as X402EndpointInfo;
}
