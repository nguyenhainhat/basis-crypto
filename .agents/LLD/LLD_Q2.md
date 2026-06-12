# Low-Level Design (LLD): Quarter 2 – Frontend Engine & Web3 dApp Integration

This document outlines the Low-Level Design (LLD) for Quarter 2 (Months 4–6) of the dWorkspace platform. This phase transitions the project from a headless backend system into an accessible, type-safe Next.js Single Page Application (SPA). The architecture focuses on smooth wallet connections, gasless user interactions (EIP-712 structured signing), and decoupled state management.

## 1. Frontend Client Architecture & Stack

To support multi-wallet interactions without unexpected UI updates, the client decouples layout components from the Web3 state engine.

### Core Architecture Components

```text
+------------------------------------+
|       Next.js App Router UI        |
|  (Dashboard, Proposal List, View)  |
+------------------------------------+
                 │
  Reads UI State / Triggers Actions
                 │
                 ▼
+------------------------------------+
|     Zustand Application Store      |
|  (Global non-Web3 state & Cache)   |
+------------------------------------+
                 │
 Coordinates Blockchain Operations
                 │
                 ▼
+------------------------------------------------------------------------+
|                      Web3 Context Provider Layer                       |
| +----------------------------------------------------------------+     |
| |                         Wagmi Client Core                      |     |
| |           (Manages multi-wallet state & active account)        |     |
| +----------------------------------------------------------------+     |
|                                │                                       |
|                                ▼                                       |
| +----------------------------------------------------------------+     |
| |                         Viem Engine Layer                      |     |
| |       (Low-level EIP-1193 connections & payload codecs)        |     |
| +----------------------------------------------------------------+     |
+------------------------------------------------------------------------+
```

### Technical Stack & Dependencies

*   **Framework**: Next.js (App Router, React 19 concurrent features).
*   **Web3 Connectivity Client**: `wagmi` (Hooks wrapper) and `viem` (Lightweight abstraction layer replacing ethers.js on the client side).
*   **Wallet Modal Discovery Layer**: `@rainbow-me/rainbowkit` (A unified UI interface for wallet linking).
*   **State Management**: `zustand` (Transient application state) + `@tanstack/react-query` (Server cache abstraction managed internally via Wagmi).
*   **Styling & Primitives**: TailwindCSS + `shadcn/ui` (built on top of Radix UI primitives).

## 2. Global State & Context Strategy

Wagmi holds internal multi-wallet states within an explicit React Context Provider wrapper. App-wide transient parameters (e.g., UI modals, optimistic sidebar interactions) are managed outside React render trees via a lightweight Zustand configuration.

### Multi-Wallet Provider Composition (`src/providers/Web3Provider.tsx`)

```typescript
"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, polygonAmoy } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const config = getDefaultConfig({
  appName: "dWorkspace Internal Portal",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "MOCK_PROJECT_ID",
  chains: [baseSepolia, polygonAmoy],
  transports: {
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#4f46e5" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## 3. Cryptographic EIP-712 Design (Gasless Voting Payload)

To enable 40 team members to cast votes without paying gas fees or maintaining network native tokens, dWorkspace implements off-chain cryptographic signature verification via EIP-712.

### Structural Domain Definitions

The structured hashing data scheme mirrors the exact variables expected by the underlying Smart Contract (`DaoVoting.sol`).

*   **Domain Name**: "dWorkspace Governance"
*   **Version**: "1.0.0"
*   **VerifyingContract**: [Deployed DaoVoting Address]

**Type Struct:**
```text
┌────────────────────────────────────────────────────────┐
│                        Ballot                          │
├───────────────────────┬────────────────────────────────┤
│       Field Name      │             Type               │
├───────────────────────┼────────────────────────────────┤
│ proposalId            │ string (UUID cast as bytes32)  │
│ voter                 │ address                        │
│ choice                │ uint8 (0=YES, 1=NO, 2=ABSTAIN) │
└───────────────────────┴────────────────────────────────┘
```

### Type-Safe EIP-712 Client Implementation Hooks (`src/hooks/useGaslessVote.ts`)

```typescript
"use client";

import { useSignTypedData, useAccount } from "wagmi";

const EIP712_VOTING_DOMAIN = {
  name: "dWorkspace Governance",
  version: "1.0.0",
  chainId: 84532, // Base Sepolia Chain ID
  verifyingContract: process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS as `0x${string}`,
} as const;

const VOTING_TYPES = {
  Ballot: [
    { name: "proposalId", type: "string" },
    { name: "voter", type: "address" },
    { name: "choice", type: "uint8" },
  ],
} as const;

export function useGaslessVote() {
  const { address } = useAccount();
  const { signTypedDataAsync, isPending, error } = useSignTypedData();

  const signVotePayload = async (proposalId: string, choice: number) => {
    if (!address) throw new Error("Wallet context is disconnected.");

    const signature = await signTypedDataAsync({
      domain: EIP712_VOTING_DOMAIN,
      types: VOTING_TYPES,
      primaryType: "Ballot",
      message: {
        proposalId,
        voter: address,
        choice,
      },
    });

    return {
      voterAddress: address.toLowerCase(),
      signature,
      proposalId,
      choice,
    };
  };

  return { signVotePayload, isPending, error };
}
```

## 4. Component Layouts & View Contracts

The UI is built using isolated atomic views. Below is the specification for the core component where interaction events take place.

```text
+-----------------------------------------------------------------------------------+
| Component: ProposalDetailView                                                     |
+-----------------------------------------------------------------------------------+
| [Proposal Title: "Migrate Slack to Matrix Protocol"]                              |
| [Status Badge: ACTIVE]                       [Time Left Count Down: 4d 12h 02m]   |
+-----------------------------------------------------------------------------------+
| Description Payload Render Area:                                                  |
| "This proposal outlines the security benefits of transition corporate channels..."|
+-----------------------------------------------------------------------------------+
| Interactive Voting Panel Area                                                     |
|                                                                                   |
|  ( ) Yes (Approve)           ( ) No (Reject)           ( ) Abstain                |
|                                                                                   |
| +-----------------------------------------------------------------------------+   |
| |               [Button: Sign & Cast Ballot Cryptographically]                |   |
| +-----------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### Component Implementation Draft (`src/components/ProposalDetailView.tsx`)

```typescript
"use client";

import React, { useState } from "react";
import { useGaslessVote } from "@/hooks/useGaslessVote";

interface ProposalDetailViewProps {
  proposalId: string;
  title: string;
  description: string;
}

export function ProposalDetailView({ proposalId, title, description }: ProposalDetailViewProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const { signVotePayload, isPending } = useGaslessVote();
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleCastVote = async () => {
    if (selectedChoice === null) return;
    try {
      setStatusMessage("Awaiting user wallet signature approval...");
      const payload = await signVotePayload(proposalId, selectedChoice);

      // Dispatch explicit backend REST call structured for Q1 schema ingestion
      const response = await fetch("/api/v1/votes/submit-gasless", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Backend infrastructure rejected signature payload");

      setStatusMessage("Vote registered successfully!");
    } catch (err: any) {
      setStatusMessage(`Voting workflow aborted: ${err.message}`);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-white">
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-slate-400 mb-6 text-sm">{description}</p>

      <div className="space-y-3 mb-6">
        {[
          { label: "Yes, Approve", value: 0 },
          { label: "No, Reject", value: 1 },
          { label: "Abstain", value: 2 },
        ].map((option) => (
          <label key={option.value} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
            <input
              type="radio"
              name="ballot-option"
              value={option.value}
              onChange={() => setSelectedChoice(option.value)}
              className="accent-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleCastVote}
        disabled={selectedChoice === null || isPending}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 font-semibold rounded-lg text-sm transition-colors shadow-lg"
      >
        {isPending ? "Signing Contract..." : "Sign & Cast Ballot Cryptographically"}
      </button>

      {statusMessage && (
        <p className="mt-4 text-xs text-indigo-400 font-medium tracking-wide">{statusMessage}</p>
      )}
    </div>
  );
}
```

## 5. Quarter 2 Acceptance Criteria (AC)

### Frontend & Integration Quality Standards

*   **SSR Hydration Balance**: No React element initialization state discrepancies may surface between Vercel Node runtime executions and raw hydrated outputs on user screens. Web3 values must handle placeholder skeletons safely during hydration.
*   **Wallet Address Normalization**: Wallet balance requests, address formatting utilities, and routing logic must enforce case-insensitive data safety patterns. The UI must convert addresses to lowercase before dispatching cross-network operations or checking against local cache maps.
*   **Signature Timeout Rejection Isolation**: If a user flags a connection rejection inside their hardware or browser extension (e.g., cancellation within MetaMask), the UI engine must intercept the rejection loop immediately. It must gracefully reset state trees and clear all pending block overlays without locking the browser screen.

## 6. Detailed Weekly Sprint Backlog: Quarter 2

*   **Weeks 13–14 (UI Initialization & Architecture)**: Establish Tailwind themes and compile structural layouts for the internal directory using accessible components from `shadcn/ui`.
*   **Weeks 15–16 (Client Context Binding)**: Bind Wagmi context structures to the system. Implement explicit SIWE signature evaluation gates across route endpoints.
*   **Weeks 17–18 (Wallet UI Framework Integration)**: Connect RainbowKit configuration interfaces. Set up visual wallet feedback elements (e.g., network validation alerts and address truncation wrappers).
*   **Weeks 19–20 (EIP-712 Schema Structuring)**: Implement structural domain hashing utilities on the client side using Viem. Ensure payloads perfectly match the required types for both local testing networks and public testnets.
*   **Weeks 21–22 (Governance Voting Flows)**: Build the interactive proposal viewing states. Connect user submission inputs to the cryptographic signature components.
*   **Weeks 23–24 (End-to-End Client Testing & Optimization)**: Run rigorous UI testing cycles. Mock network latency vectors and simulate cross-wallet injection anomalies to verify that hydration layers remain perfectly stable.
