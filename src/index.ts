import "dotenv/config";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createSolanaIntelMcpServer } from "./mcp-server.js";
import { runWithHttpContext } from "./payment.js";

/** Render injects PORT (often 10000); bind 0.0.0.0 so their port scanner sees the process. */
const port = Number(process.env.PORT) || 3000;
const defaultAllowedHosts = [
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
  "[::1]",
  "[::1]:3000",
  "mcgold.onrender.com",
];
const envAllowedHosts = (process.env.ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const renderHostname = process.env.RENDER_EXTERNAL_HOSTNAME?.trim();
const allowedHosts = Array.from(
  new Set(
    [...defaultAllowedHosts, ...envAllowedHosts, renderHostname ?? ""].filter(Boolean)
  )
);

const app = createMcpExpressApp({
  host: "0.0.0.0",
  allowedHosts,
});

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "solana-intel-mcp",
    endpoints: ["/mcp", "/healthz"],
  });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/mcp", async (req, res) => {
  const server = createSolanaIntelMcpServer();
  try {
    await runWithHttpContext(req, res, async () => {
      const transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true,
        allowedHosts,
        enableDnsRebindingProtection: true,
      });
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    });
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.listen(port, "0.0.0.0", () => {
  const banner = [
    "==========================================",
    `  Solana Intel MCP listening on 0.0.0.0:${port} (PORT=${process.env.PORT ?? "(unset)"})`,
    `  Local dev: http://127.0.0.1:${port}/mcp`,
    "==========================================",
  ].join("\n");
  console.log(banner);
});
