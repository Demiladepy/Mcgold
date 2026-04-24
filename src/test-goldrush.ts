import { ChainName, GoldRushClient } from "@covalenthq/client-sdk";
import "dotenv/config";

const apiKey = process.env.GOLDRUSH_API_KEY;
if (!apiKey) {
  console.error("GOLDRUSH_API_KEY not found in .env");
  process.exit(1);
}

const client = new GoldRushClient(apiKey);
const CHAIN = ChainName.SOLANA_MAINNET;
const TEST_WALLET = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function safeJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, val) => (typeof val === "bigint" ? val.toString() : val),
    2
  );
}

async function testBalances(): Promise<string | null> {
  console.log("\n=== TEST 1: Token Balances (already known to work) ===");
  try {
    const response = await client.BalanceService.getTokenBalancesForWalletAddress(
      CHAIN,
      TEST_WALLET
    );
    if (response.error) {
      console.error("API error:", response.error_message);
      return null;
    }

    const items = response.data?.items ?? [];
    console.log(`Got ${items.length} token balances`);

    const solEntry = items.find(
      (i) => i?.contract_ticker_symbol === "SOL" || i?.native_token === true
    );
    console.log("SOL entry:");
    console.log(safeJson(solEntry));
    return solEntry?.contract_address ?? null;
  } catch (err) {
    console.error(getErrorMessage(err));
    return null;
  }
}

async function testPricingWithAddress(contractAddress: string): Promise<void> {
  console.log("\n=== TEST 2: Pricing with discovered SOL address ===");
  console.log(`Using: ${contractAddress}`);
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);

    const response = await client.PricingService.getTokenPrices(
      CHAIN,
      "USD",
      contractAddress,
      {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        pricesAtAsc: true,
      }
    );

    if (response.error) {
      console.error("API error:", response.error_message);
      return;
    }
    console.log("Got pricing:");
    console.log(safeJson(response.data?.[0]).slice(0, 500));
  } catch (err) {
    console.error(getErrorMessage(err));
  }
}

async function testHistoricalPortfolio(): Promise<void> {
  console.log("\n=== TEST 3: Historical Portfolio Value ===");
  try {
    const response =
      await client.BalanceService.getHistoricalPortfolioForWalletAddress(
        CHAIN,
        TEST_WALLET
      );
    if (response.error) {
      console.error("API error:", response.error_message);
      return;
    }
    const items = response.data?.items ?? [];
    console.log(`Got ${items.length} token histories`);
    console.log("First item (truncated):");
    console.log(safeJson(items[0]).slice(0, 800));
  } catch (err) {
    console.error(getErrorMessage(err));
  }
}

async function testTokenHolders(): Promise<void> {
  console.log("\n=== TEST 4: Token Holders (for a known Solana token) ===");
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  try {
    for await (const response of client.BalanceService.getTokenHoldersV2ForTokenAddress(
      CHAIN,
      USDC_MINT
    )) {
      if (response.error) {
        console.error("API error:", response.error_message);
        return;
      }
      const items = response.data?.items ?? [];
      console.log(`Got ${items.length} USDC holders on first page`);
      console.log("Top holder:");
      console.log(safeJson(items[0]));
      break;
    }
  } catch (err) {
    console.error(getErrorMessage(err));
  }
}

async function main(): Promise<void> {
  console.log("Extended GoldRush Solana capability test\n");
  const solAddress = await testBalances();
  if (solAddress) {
    await testPricingWithAddress(solAddress);
  }
  await testHistoricalPortfolio();
  await testTokenHolders();
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error(getErrorMessage(err));
  process.exitCode = 1;
});
