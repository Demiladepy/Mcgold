import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import type React from "react";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mcgold.vercel.app"),
  title: "mcgold - Paid Solana Intelligence for AI Agents",
  description:
    "Paid Solana intelligence tools for AI agents. Three tools. Per-call USDC settlement on Solana. No subscriptions, no API keys - just an agent and a wallet.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "mcgold - Paid Solana Intelligence for AI Agents",
    description:
      "Three tools. Per-call USDC settlement on Solana. No subscriptions, no API keys - just an agent and a wallet.",
    images: ["/og.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "mcgold - Paid Solana Intelligence for AI Agents",
    description:
      "Paid Solana intelligence tools for AI agents with USDC settlement per call on Solana.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable} min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  );
}
