"use client";

import type React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const curlSnippet = `# 1. Discover available tools
curl -X POST https://mcgold.onrender.com/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 2. Call a tool (server returns 402 with payment requirements)
curl -X POST https://mcgold.onrender.com/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "trace_whale_activity",
      "arguments": {
        "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      }
    }
  }'

# 3. Pay 0.01 USDC on Solana, retry with PAYMENT-SIGNATURE header`;

const tsSnippet = `import { Client } from '@modelcontextprotocol/sdk/client/index.js'

// Connect, discover tools, and let your agent call them.
// Standard MCP - works in Cursor, Claude Desktop, or any
// MCP-compatible runtime.

const client = new Client({ name: 'my-agent', version: '1.0.0' })
await client.connect(transport)

const result = await client.callTool({
  name: 'assess_wallet_risk',
  arguments: { wallet: '<solana-pubkey>' }
})

// On 402, sign a USDC transfer using your wallet adapter,
// retry with the PAYMENT-SIGNATURE header.
// Tools cost $0.01-$0.03 per call.`;

const codeStyle = {
  ...oneLight,
  "pre[class*='language-']": {
    ...oneLight["pre[class*='language-']"],
    margin: 0,
    padding: "1rem",
    background: "#fffdfa",
  },
};

export function CodeTabs(): React.ReactElement {
  return (
    <Tabs defaultValue="curl" className="w-full">
      <TabsList>
        <TabsTrigger value="curl">curl</TabsTrigger>
        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
      </TabsList>
      <TabsContent value="curl" className="overflow-hidden rounded-xl border border-border">
        <SyntaxHighlighter language="bash" style={codeStyle} customStyle={{ margin: 0 }}>
          {curlSnippet}
        </SyntaxHighlighter>
      </TabsContent>
      <TabsContent
        value="typescript"
        className="overflow-hidden rounded-xl border border-border"
      >
        <SyntaxHighlighter language="typescript" style={codeStyle} customStyle={{ margin: 0 }}>
          {tsSnippet}
        </SyntaxHighlighter>
      </TabsContent>
    </Tabs>
  );
}
