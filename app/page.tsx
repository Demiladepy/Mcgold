import Link from "next/link";
import type React from "react";
import { BadgeCheck, Coins, Database, ExternalLink, Hammer, Play, Terminal, Zap } from "lucide-react";

import { CodeTabs } from "../components/code-tabs";
import Logo from "../src/assets/logo.svg";

const terminalOutput = `[AGENT] Starting counterparty trust analysis
[AGENT] My wallet:    4dHc2cag4hmVeMFuFHF2Gjc4BoUiKFFMCTGfiWmyMsvx
[AGENT] Alice wallet: 9sHdrUkpXAr4wQeKMh4RGKepDHX11RK5uZQoCmR5Y5zR

[CLAUDE] I'll start by assessing Alice's wallet risk profile,
since knowing her general behavior is foundational to evaluating
this transfer.

[PAY] Calling assess_wallet_risk
[PAY] Price: $0.02 USDC
[PAY] Payment confirmed: 2psxoniGxS3z...je9eyH
[TOOL] Risk score: 14/100 (low)
       - Established wallet with 3+ years of history
       - Diversified portfolio (~$6,700)
       - No concerning concentration

[CLAUDE] Alice's wallet looks legitimate. But I should check our
specific counterparty relationship for any red flags.

[PAY] Calling score_counterparty_trust
[PAY] Price: $0.03 USDC
[PAY] Payment confirmed: 4ZP18bsx...QQupb
[TOOL] Trust score: 28/100 (caution)
       - No prior direct transaction history
       - No shared counterparties
       - Red flag: no_prior_interaction

[CLAUDE] FINAL RECOMMENDATION: PROCEED_WITH_CAUTION

The wallet itself raises no red flags - the caution is purely
about the unknown relationship, which is normal for first-time
senders. Once verified off-chain, this looks like a relatively
safe transaction.

Total: $0.05 USDC across 2 tool calls`;

const toolCards = [
  {
    name: "assess_wallet_risk",
    description:
      "Score any Solana wallet's risk profile across six factors: age, holdings concentration, transaction diversity, longtail exposure, activity recency, and dust patterns.",
    price: "$0.02 USDC per call",
  },
  {
    name: "trace_whale_activity",
    description:
      "Analyze top-holder behavior for any token: notable movements, concentration metrics, and risk flags like net selling or distribution skew.",
    price: "$0.01 USDC per call",
  },
  {
    name: "score_counterparty_trust",
    description:
      "Score the trust between two wallets for transacting: direct interaction history, shared counterparty networks, behavioral similarity, and stability red flags.",
    price: "$0.03 USDC per call",
  },
];

const badges = [
  { icon: BadgeCheck, label: "Live on Solana Devnet" },
  { icon: Hammer, label: "Built on Covalent GoldRush" },
  { icon: Coins, label: "x402 USDC Settlement" },
];

export default function Home(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 text-foreground sm:px-10 sm:pb-20 sm:pt-8 lg:px-12">
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 sm:mb-16">
        <Logo className="h-6 w-auto shrink-0 sm:h-7" aria-label="mcgold" />
        <Link
          href="https://github.com/Demiladepy/Mcgold"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-muted transition-colors hover:text-foreground sm:text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          GitHub
        </Link>
      </nav>

      <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-8">
          <h1 className="max-w-3xl font-[var(--font-display)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Paid Solana intelligence tools for AI agents.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            Three tools. Per-call USDC settlement on Solana. No subscriptions, no API keys -
            just an agent and a wallet.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="https://github.com/Demiladepy/Mcgold"
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#ea5f2e] sm:w-auto"
            >
              View on GitHub
            </Link>
            <Link
              href="#demo"
              className="w-full rounded-lg border border-border bg-white px-5 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-[#f9f3ed] sm:w-auto"
            >
              Try the demo →
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted"
            >
              <badge.icon className="h-4 w-4 text-accent" />
              {badge.label}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 grid gap-10 border-y border-border py-14 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">
            Today: AI agents can&apos;t pay for data.
          </h2>
          <p className="max-w-[65ch] leading-relaxed text-muted">
            Agents reasoning about Solana need rich on-chain context, but every existing API
            requires accounts, API keys, and monthly subscriptions. That doesn&apos;t fit how agents
            actually work.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">
            mcgold: pay-per-query intelligence.
          </h2>
          <p className="max-w-[65ch] leading-relaxed text-muted">
            Discover tools via MCP. Pay for each call in USDC, settled on Solana in seconds. The
            agent gets the data it needs, you only pay for what you use.
          </p>
        </div>
      </section>

      <section className="mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Three tools, ready for your agent.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {toolCards.map((tool) => (
            <article key={tool.name} className="rounded-2xl border border-border bg-surface p-6 shadow-panel">
              <p className="mb-4 inline-block rounded bg-[#f8f4f0] px-2 py-1 font-mono text-xs text-muted">
                {tool.name}
              </p>
              <p className="text-sm leading-relaxed text-muted">{tool.description}</p>
              <p className="mt-5 text-sm font-semibold text-accent">{tool.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="mt-24 space-y-6">
        <div className="space-y-2">
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            See an agent use mcgold in real time.
          </h2>
          <p className="text-muted">
            A Claude agent evaluates whether to accept a large transfer from a counterparty.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
          <div className="flex items-center gap-2 border-b border-border bg-[#f6f2ee] px-4 py-2 text-sm text-muted">
            <Terminal className="h-4 w-4" />
            Demo Output
          </div>
          <pre className="overflow-x-auto bg-[#fdf8f2] p-4 font-mono text-xs leading-relaxed text-[#2f2a25] sm:p-5 sm:text-sm">
            {terminalOutput}
          </pre>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Real Claude Sonnet 4.6 reasoning. Real USDC payments on Solana devnet. View
            transaction:{" "}
            <Link
              href="https://explorer.solana.com/tx/2psxoniGxS3zZPnhuw8jxHC1E9CwDRV2NTR67LDaHyLHmGUWnvLT3TyoRAbiMdmyvWcky7UR5EhU6PMhS8je9eyH?cluster=devnet"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/40"
            >
              explorer.solana.com/tx/2psxoniGxS3z...je9eyH
            </Link>
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#f9f3ed]"
          >
            <Play className="h-4 w-4" />
            Replay demo
          </button>
        </div>
      </section>

      <section className="mt-24 space-y-6">
        <div className="space-y-2">
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Integrate in minutes.
          </h2>
          <p className="text-muted">Standard MCP. Standard x402. No proprietary SDK.</p>
        </div>
        <CodeTabs />
        <p className="text-sm text-muted">
          Full integration example:{" "}
          <Link
            href="https://github.com/Demiladepy/Mcgold/blob/main/src/demo-agent.ts"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-accent/40"
          >
            github.com/Demiladepy/Mcgold/blob/main/src/demo-agent.ts
          </Link>
        </p>
      </section>

      <section className="mt-24 space-y-8 border-t border-border pt-14">
        <div className="space-y-2">
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Designed for agents, not humans.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="space-y-3 rounded-2xl border border-border bg-surface p-6">
            <Zap className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">MCP-native</h3>
            <p className="text-sm leading-relaxed text-muted">
              Tools auto-discovered by any MCP-compatible client. Cursor, Claude Desktop, custom
              agents - they just work.
            </p>
          </article>
          <article className="space-y-3 rounded-2xl border border-border bg-surface p-6">
            <Coins className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Real on-chain settlement</h3>
            <p className="text-sm leading-relaxed text-muted">
              Every call settles in USDC on Solana. No subscriptions to manage, no API keys to
              rotate, no accounts to create.
            </p>
          </article>
          <article className="space-y-3 rounded-2xl border border-border bg-surface p-6">
            <Database className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Powered by GoldRush</h3>
            <p className="text-sm leading-relaxed text-muted">
              Tools are built on Covalent&apos;s GoldRush API and Helius RPC. Real-time, accurate,
              production-grade Solana data.
            </p>
          </article>
        </div>
      </section>

      <footer className="mt-24 border-t border-border pt-8">
        <p className="text-sm text-muted">
          mcgold - built for the Solana Frontier Hackathon, April 2026
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href="https://github.com/Demiladepy/Mcgold" target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </Link>
          <span>•</span>
          <Link
            href="https://github.com/Demiladepy/Mcgold/blob/main/src/demo-agent.ts"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Demo source
          </Link>
          <span>•</span>
          <Link href="https://github.com/Demiladepy/Mcgold" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Architecture
          </Link>
          <span>•</span>
          <Link
            href="https://x.com/goldrushdev"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            @goldrushdev
          </Link>
        </div>
      </footer>
    </main>
  );
}
