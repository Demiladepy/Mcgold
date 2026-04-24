import "dotenv/config";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createSolanaIntelMcpServer } from "./mcp-server.js";
import { runWithHttpContext } from "./payment.js";

const PORT = Number(process.env.PORT ?? 3000);
const allowedHosts = (process.env.ALLOWED_HOSTS ?? "localhost,127.0.0.1,[::1]")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

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

app.listen(PORT, "0.0.0.0", () => {
  const banner = [
    "==========================================",
    `  Solana Intel MCP listening on port ${PORT}`,
    `  Endpoint: http://localhost:${PORT}/mcp`,
    "==========================================",
  ].join("\n");
  console.log(banner);
});
