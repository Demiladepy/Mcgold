import "dotenv/config";
import express, { type Request, type Response } from "express";
import { X402PaymentHandler } from "x402-solana/server";

const PORT = 3100;
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function log(stage: string, data?: unknown): void {
  const ts = new Date().toISOString();
  if (data === undefined) {
    console.log(`[${ts}] [test-x402-server] ${stage}`);
  } else {
    console.log(`[${ts}] [test-x402-server] ${stage}`, data);
  }
}

const treasuryAddress = process.env.MCPAY_RECIPIENT_WALLET?.trim();
if (!treasuryAddress) {
  throw new Error("Missing MCPAY_RECIPIENT_WALLET in environment");
}

const x402 = new X402PaymentHandler({
  network: "solana-devnet",
  treasuryAddress,
  facilitatorUrl: "https://facilitator.payai.network",
  rpcUrl: "https://api.devnet.solana.com",
});

const app = express();
app.use(express.json());

app.post("/paid-ping", async (req: Request, res: Response) => {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  log("inbound request received", {
    path: req.path,
    method: req.method,
    hasPaymentHeader: Boolean(req.get("PAYMENT-SIGNATURE")),
  });

  try {
    const paymentHeader = x402.extractPayment(req.headers);
    const paymentRequirements = await x402.createPaymentRequirements(
      {
        amount: "10000", // 0.01 USDC (6 decimals => 10_000 atomic)
        asset: {
          address: USDC_DEVNET_MINT,
          decimals: 6,
        },
        description: "x402-solana paid ping",
      },
      resourceUrl
    );

    if (!paymentHeader) {
      log("no payment header present (sending 402)");
      const response = x402.create402Response(paymentRequirements, resourceUrl);
      const paymentRequiredHeader = Buffer.from(
        JSON.stringify(response.body)
      ).toString("base64");
      log("response sent", {
        status: response.status,
        stage: "payment_required",
        header: "PAYMENT-REQUIRED",
      });
      return res
        .status(response.status)
        .setHeader("PAYMENT-REQUIRED", paymentRequiredHeader)
        .json(response.body);
    }

    log("payment header present, verifying");
    const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
    log("verification result", verified);
    if (!verified.isValid) {
      log("response sent", { status: 402, stage: "invalid_payment" });
      return res.status(402).json({
        error: "Invalid payment",
        reason: verified.invalidReason ?? "verification_failed",
      });
    }

    const settlement = await x402.settlePayment(paymentHeader, paymentRequirements);
    log("settlement result", settlement);
    if (!settlement.success) {
      log("response sent", { status: 502, stage: "settlement_failed" });
      return res.status(502).json({
        error: "Settlement failed",
        reason: settlement.errorReason ?? "unknown_settlement_error",
      });
    }

    const payload = {
      success: true,
      timestamp: new Date().toISOString(),
      message: "payment confirmed via x402-solana",
    };
    log("response sent", { status: 200, stage: "success" });
    return res.status(200).json(payload);
  } catch (err) {
    log("handler error", err);
    return res.status(500).json({
      error: "server_error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log("==========================================");
  console.log(
    `  x402 test server listening on http://localhost:${PORT}/paid-ping`
  );
  console.log("==========================================");
});
