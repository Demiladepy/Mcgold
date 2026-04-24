import { GoldRushClient } from "@covalenthq/client-sdk";
import { createHelius, type HeliusClient } from "helius-sdk";

/** GoldRush chain id for Solana mainnet API calls. */
export const SOLANA_CHAIN_NAME = "solana-mainnet" as const;

let goldRushClient: GoldRushClient | null = null;
let heliusClient: HeliusClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env or the process environment.`
    );
  }
  return value.trim();
}

/** Lazy singleton for GoldRush (Covalent) API. */
export function getGoldRushClient(): GoldRushClient {
  if (!goldRushClient) {
    goldRushClient = new GoldRushClient(requireEnv("GOLDRUSH_API_KEY"));
  }
  return goldRushClient;
}

/** Lazy singleton for Helius (Solana RPC + APIs). */
export function getHeliusClient(): HeliusClient {
  if (!heliusClient) {
    heliusClient = createHelius({
      apiKey: requireEnv("HELIUS_API_KEY"),
      network: "mainnet",
    });
  }
  return heliusClient;
}
