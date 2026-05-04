export type EndpointRole = "primary" | "specialized" | "legacy";

export type EndpointRoutingDecision = {
  endpoint: string;
  role: EndpointRole;
  selected: boolean;
  reason: string;
};

const endpointRoleMap: Record<string, EndpointRole> = {
  "BalanceService.getTokenBalancesForWalletAddress": "primary",
  "AllChainsService.getAddressActivity": "primary",
  "PricingService.getTokenPrices": "primary",
  "SecurityService.getApprovals": "specialized",
  "BalanceService.getHistoricalPortfolioForWalletAddress": "primary",
  "BalanceService.getTokenHoldersV2ForTokenAddress": "specialized",
};

/**
 * Docs-aligned endpoint role policy:
 * - primary endpoints are preferred by default
 * - specialized endpoints are selected only when feature-specific context requires them
 */
export function chooseEndpoint(
  endpoint: string,
  useCase: string
): EndpointRoutingDecision {
  const role = endpointRoleMap[endpoint] ?? "specialized";
  const selected = role !== "legacy";
  const reason =
    role === "primary"
      ? `Selected as primary endpoint for ${useCase}.`
      : role === "specialized"
        ? `Selected specialized endpoint for ${useCase} where primary data is insufficient.`
        : `Legacy endpoint avoided for ${useCase}.`;
  return { endpoint, role, selected, reason };
}
