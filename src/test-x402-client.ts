import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
  Connection,
  Keypair,
  VersionedTransaction,
  type PublicKey,
} from "@solana/web3.js";
import { createX402Client } from "x402-solana/client";

const TARGET_URL = "http://localhost:3100/paid-ping";
const RPC_URL = "https://api.devnet.solana.com";

function log(stage: string, data?: unknown): void {
  const ts = new Date().toISOString();
  if (data === undefined) {
    console.log(`[${ts}] [test-x402-client] ${stage}`);
  } else {
    console.log(`[${ts}] [test-x402-client] ${stage}`, data);
  }
}

async function loadKeypair(path: string): Promise<Keypair> {
  const raw = await readFile(path, "utf8");
  const arr = JSON.parse(raw) as number[];
  if (!Array.isArray(arr) || (arr.length !== 64 && arr.length !== 32)) {
    throw new Error(
      `Invalid keypair JSON at ${path}: expected 32 or 64 numeric entries`
    );
  }
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

async function main(): Promise<void> {
  const startedMs = Date.now();
  const keypairPath = process.env.MCPAY_KEYPAIR_PATH?.trim();
  if (!keypairPath) {
    throw new Error("Missing MCPAY_KEYPAIR_PATH in environment");
  }

  log("loading keypair", { keypairPath });
  const keypair = await loadKeypair(keypairPath);
  log("keypair loaded", { address: keypair.publicKey.toBase58() });

  const connection = new Connection(RPC_URL, "confirmed");
  const adapter = {
    address: keypair.publicKey.toBase58(),
    publicKey: keypair.publicKey as PublicKey,
    signTransaction: async (
      tx: VersionedTransaction
    ): Promise<VersionedTransaction> => {
      log("payment transaction signing requested");
      tx.sign([keypair]);
      log("payment transaction signed");
      return tx;
    },
  };

  log("initial call (expect 402)");
  const initialRes = await fetch(TARGET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true }),
  });
  const initialText = await initialRes.text();
  log("initial call response", {
    status: initialRes.status,
    bodyPreview: initialText.slice(0, 240),
  });

  if (initialRes.status === 402) {
    log("402 details received");
  } else {
    log("warning: initial call did not return 402");
  }

  const client = createX402Client({
    wallet: adapter,
    network: "solana-devnet",
    rpcUrl: RPC_URL,
    amount: BigInt(100_000), // safety cap = 0.1 USDC
    verbose: true,
  });

  log("retry call via x402 client (auto 402 -> pay -> retry)");
  const paidRes = await client.fetch(TARGET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true }),
  });

  const finalText = await paidRes.text();
  log("final response received", {
    status: paidRes.status,
    body: finalText,
  });

  let parsed: unknown = null;
  try {
    parsed = finalText ? JSON.parse(finalText) : null;
  } catch {
    parsed = finalText;
  }

  const elapsedMs = Date.now() - startedMs;
  log("flow complete", { elapsedMs, parsed });
}

main().catch((err) => {
  log("stage failed", err);
  process.exit(1);
});
