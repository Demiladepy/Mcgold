import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PaymentRequiredError, requirePayment, settleAfterExecution } from "./payment.js";
import { assessWalletRisk } from "./tools/assess-wallet-risk.js";
import { scoreCounterpartyTrust } from "./tools/score-counterparty-trust.js";
import { traceWhaleActivity } from "./tools/trace-whale-activity.js";
import {
  counterpartyTrustInputSchema,
  counterpartyTrustToolInputShape,
  walletRiskInputSchema,
  walletRiskToolInputShape,
  whaleActivityInputSchema,
  whaleActivityToolInputShape,
} from "./tools/types.js";

/**
 * Builds a configured {@link McpServer} for `solana-intel`.
 *
 * The Streamable HTTP transport is **stateless** in our app: each POST must use
 * a new server + transport pair (see SDK docs). Call this factory per request
 * from `src/index.ts`, not a single long-lived instance.
 */
export function createSolanaIntelMcpServer(): McpServer {
  const server = new McpServer({
    name: "solana-intel",
    version: "0.1.0",
  });
  const PRICE_ASSESS_WALLET_RISK = "20000";
  const PRICE_TRACE_WHALE_ACTIVITY = "10000";
  const PRICE_SCORE_COUNTERPARTY_TRUST = "30000";

  function toPaymentErrorResult(error: PaymentRequiredError) {
    return {
      isError: true as const,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: error.code,
              message: error.message,
              data: error.data,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  server.registerTool(
    "assess_wallet_risk",
    {
      description:
        "[Paid: $0.02 USDC on Solana] Score the risk of a Solana wallet based on transaction history, holdings, and behavior patterns. Returns a 0-100 risk score with structured reasons.",
      inputSchema: walletRiskToolInputShape,
    },
    async (args) => {
      try {
        await requirePayment("assess_wallet_risk", PRICE_ASSESS_WALLET_RISK);
        const parsed = walletRiskInputSchema.safeParse(args);
        if (!parsed.success) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "invalid_input",
                    issues: parsed.error.issues,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const result = await assessWalletRisk(parsed.data);
        await settleAfterExecution("assess_wallet_risk", PRICE_ASSESS_WALLET_RISK);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        if (err instanceof PaymentRequiredError) {
          return toPaymentErrorResult(err);
        }
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: "tool_failed", message },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "trace_whale_activity",
    {
      description:
        "[Paid: $0.01 USDC on Solana] Analyze whale (top-holder) activity for a Solana token. Returns top holders, notable movements in the time window, concentration metrics, and risk flags like net selling or concentration.",
      inputSchema: whaleActivityToolInputShape,
    },
    async (args) => {
      try {
        await requirePayment("trace_whale_activity", PRICE_TRACE_WHALE_ACTIVITY);
        const parsed = whaleActivityInputSchema.safeParse(args);
        if (!parsed.success) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "invalid_input",
                    issues: parsed.error.issues,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const result = await traceWhaleActivity(parsed.data);
        await settleAfterExecution(
          "trace_whale_activity",
          PRICE_TRACE_WHALE_ACTIVITY
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        if (err instanceof PaymentRequiredError) {
          return toPaymentErrorResult(err);
        }
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: "tool_failed", message },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "score_counterparty_trust",
    {
      description:
        "[Paid: $0.03 USDC on Solana] Score the trust between two Solana wallets for transacting with each other. Analyzes direct interaction history, shared counterparty networks, behavioral similarity, and the counterparty wallet's own stability. Returns a 0-100 trust score, tier, red flags, and positive signals.",
      inputSchema: counterpartyTrustToolInputShape,
    },
    async (args) => {
      try {
        await requirePayment(
          "score_counterparty_trust",
          PRICE_SCORE_COUNTERPARTY_TRUST
        );
        const parsed = counterpartyTrustInputSchema.safeParse(args);
        if (!parsed.success) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "invalid_input",
                    issues: parsed.error.issues,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const result = await scoreCounterpartyTrust(parsed.data);
        await settleAfterExecution(
          "score_counterparty_trust",
          PRICE_SCORE_COUNTERPARTY_TRUST
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        if (err instanceof PaymentRequiredError) {
          return toPaymentErrorResult(err);
        }
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: "tool_failed", message },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  return server;
}
