# Frontend Architecture Design

The frontend is built as a Next.js (App Router) Single Page Application (SPA), utilizing React Server Components (RSC) for SEO and initial load speed, combined with Client Components for heavy Web3 interactivity.

## 1. Core Layers

*   **Application Framework**: Next.js 14+ (App Router).
*   **Web3 Connectivity Layer**: `@rainbow-me/rainbowkit` (UI for wallet connection) + `wagmi` (React hooks) + `viem` (underlying Ethereum client).
*   **State Management Triad**:
    *   **Server State (REST API)**: `@tanstack/react-query` (handles caching, polling, and background updates).
    *   **Web3 State**: Managed entirely by wagmi context (current wallet, chain ID, balances).
    *   **Local UI State**: Zustand (handles transient states like active modals, sidebar toggles, and multi-step form progress).
*   **Styling & UI Primitives**: TailwindCSS + `shadcn/ui` (accessible, headless Radix UI components) + `framer-motion` (for fluid micro-interactions).

## Directory Structure (Domain-Driven Design)

```text
src/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (auth)/login      # Wallet connection entry point
│   └── (dashboard)/      # Protected routes (Proposals, Kudos, Profile)
├── components/           # Reusable UI blocks
│   ├── core/             # Buttons, Inputs, Modals (shadcn UI)
│   └── web3/             # AddressDisplay, GaslessVoteButton, SbtBadge
├── hooks/                # Custom React logic
│   ├── useWeb3Auth.ts    # SIWE (Sign-In with Ethereum) logic
│   └── useOutbox.ts      # Optimistic UI updates for Kafka streams
├── store/                # Zustand stores (useUIStore.ts)
└── config/               # Wagmi & RainbowKit configurations 
```

## 2. UI/UX Concept & Visual Identity

**Theme Recommendation: "Modern Glassmorphism & Cyber-Corporate"**
Since this is an internal tool with Web3 elements, the design should be clean and trustworthy, but with subtle high-tech touches.

*   **Color Palette**: Dark Mode by default. Deep slate/navy backgrounds (`bg-slate-950`), stark white text, with vibrant Indigo (`#4f46e5`) and Cyan (`#06b6d4`) accents to represent Web3/Tech elements.
*   **Typography**: Inter or Geist for crisp, highly readable data tables, and Space Grotesk for numbers (e.g., Kudos balances, vote counts) to give a tech-forward feel.

## 3. Key Interface Layouts & Features

### A. The Onboarding / Auth View
*   **UX Concept**: No passwords, no seed phrases.
*   **Visual**: A clean, centered modal. The user clicks "Connect Wallet". RainbowKit opens. Once connected, a secondary prompt asks them to "Sign Message to Verify Identity" (SIWE).
*   **Micro-interaction**: Upon successful signature, a green checkmark morphs into a loading spinner, seamlessly pushing them to the dashboard.

### B. The Global Dashboard (The "Hub")
*   **Layout**: A three-column grid (Left Sidebar for navigation, Wide Center for the activity feed, Right Sidebar for personal stats).
*   **Center - Activity Feed (Kafka Real-time)**: A scrolling list of events (e.g., "Alice sent Bob 10 Kudos", "New Proposal Drafted").
*   **Right - Personal Widget**: Displays the user's current Kudos balance to give away, their received Kudos, and visually rich 3D-like icons of the Soulbound Tokens (SBTs) they have earned.

### C. The Kudos Hub (Send & Receive)
*   **UX Concept**: Gamified and delightful.
*   **Visual**: A multi-step modal or a clean card form. The user selects a colleague from a searchable dropdown (displaying avatars and names, not wallet addresses). They select an amount and write a message.
*   **Micro-interaction**: When the "Send Kudos" button is clicked, trigger a subtle confetti animation (`react-confetti`) from the button's position. This dopamine hit encourages continuous internal recognition.

### D. The Governance Arena (Proposals)
*   **UX Concept**: Split-screen reading and interaction.
*   **Visual (Left side)**: The proposal description (Markdown rendered), creator info, and the immutable hash (displayed as a subtle, clickable badge for tech-savvy members to verify).
*   **Visual (Right side)**: The Voting Panel.
*   **Pre-vote**: Three prominent, radio-style cards (YES / NO / ABSTAIN).
*   **Action**: The button reads "Sign to Cast Vote" (Abstracting the term "EIP-712").
*   **Post-vote (Results)**: Smooth, animated progress bars showing the current tally, which update in real-time via WebSockets/Kafka.

## 4. Senior UX Best Practices for Web3 (Frictionless Crypto)

To ensure high adoption among the 40 employees, implement these crucial Web3 UX patterns:

**Abstract Crypto Jargon:**
*   **Instead of**: "Sign EIP-712 Payload" ➔ **Use**: "Confirm Vote Securely".
*   **Instead of**: "Minting NFT/SBT" ➔ **Use**: "Generating Permanent Badge".
*   **Instead of**: "0x71c...3d1" ➔ **Use**: ENS Names or map the address to their Slack/Internal Name (e.g., "John Doe"). Only show truncated addresses in tooltips.

**Optimistic UI for Blockchain Latency:**
*   Web3 transactions take time. When a user sends Kudos, immediately update the UI to show the Kudos as "Sent" (Optimistic Update via React Query), while a subtle loading spinner indicates the background blockchain/Kafka processing.

**Graceful Error Boundaries:**
*   If the user hits "Reject" on their MetaMask popup, do not show a red generic crash page. Catch the `UserRejectedRequestError` and display a friendly toast notification: *"Signature cancelled. Take your time to review the proposal."*

**Transaction Status Stepper:**
*   When an SBT is being automatically minted by the Temporal backend, display a real-time status tracker on their profile: `[1. Verifying Score] ➔ [2. Requesting Blockchain Execution] ➔ [3. Badge Secured]`.

Implementing this UI/UX strategy will make your Web3 internal tool feel as smooth as modern SaaS platforms like Notion or Linear, while secretly packing the power of immutable blockchain data.

---

Here is the exact Next.js App Router folder structure designed for scalability, followed by the EIP-712 Gasless Vote Button component that makes voting feel like a standard Web2 experience.

## 5. Next.js 14+ Directory Structure

This structure strictly follows Domain-Driven Design (DDD). We separate UI primitives (`components/ui`) from domain-specific components (`components/domain`), keeping the project clean even as it scales.

```text
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Route group (ignores folder in URL)
│   │   └── login/page.tsx # SIWE Wallet Connection
│   ├── (dashboard)/      # Protected routes
│   │   ├── layout.tsx    # Global sidebar & top-nav
│   │   ├── page.tsx      # Hub: Activity feed & Stats
│   │   ├── proposals/    # Governance views
│   │   │   ├── page.tsx  # List of active/closed proposals
│   │   │   └── [id]/page.tsx # Proposal Detail & Voting Panel
│   │   └── kudos/page.tsx # Give Kudos & Leaderboard
│   ├── api/              # Next.js Route Handlers (BFF layer)
│   └── layout.tsx        # Root layout with Web3Provider
│
├── components/  
│   ├── ui/               # Dumb, reusable components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── toast.tsx
│   └── domain/           # Smart, Web3-connected components
│       ├── web3/  
│       │   ├── ConnectWalletModal.tsx
│       │   └── GaslessVoteButton.tsx # EIP-712 component
│       └── workspace/  
│           ├── KudosFeed.tsx
│           └── SbtBadge.tsx
│
├── hooks/                # Custom React Hooks
│   ├── useWeb3Auth.ts    # Handles SIWE login flow
│   └── useKudosBalance.ts # Fetches DB + local Zustand cache
│
├── lib/                  # Utilities & Configs
│   ├── constants/
│   │   ├── abis.ts       # Smart Contract ABIs
│   │   └── contracts.ts  # Contract addresses
│   ├── utils.ts          # Tailwind merge (cn)
│   └── wagmi.ts          # Wagmi config & chains
│
└── store/                # Zustand global state
    └── ui-store.ts       # Sidebar toggle, active modals 
```

## 6. The GaslessVoteButton Component

This component is the heart of your UI/UX strategy. It uses Wagmi to ask the user's wallet (like MetaMask) to sign a structured message (EIP-712).

Because they are only signing a message and not executing a transaction, they pay zero gas. The signature is sent to your NestJS backend, which will verify it and pay the gas to submit it on-chain later.

```typescript
"use client";

import { useState } from "react";
import { useSignTypedData, useAccount } from "wagmi";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

// 1. Define the EIP-712 Domain matching the Smart Contract exactly
const domain = {
  name: "dWorkspace Governance",
  version: "1.0.0",
  chainId: 84532, // Base Sepolia Testnet
  verifyingContract: process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS as `0x${string}`,
} as const;

// 2. Define the exact data structure we are signing
const types = {
  Ballot: [
    { name: "proposalId", type: "string" },
    { name: "voter", type: "address" },
    { name: "choice", type: "uint8" }, // 0: YES, 1: NO, 2: ABSTAIN
  ],
} as const;

interface GaslessVoteButtonProps {
  proposalId: string;
  selectedChoice: number | null;
  onSuccess?: () => void;
}

export function GaslessVoteButton({ proposalId, selectedChoice, onSuccess }: GaslessVoteButtonProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVote = async () => {
    if (selectedChoice === null) {
      toast({ title: "Please select an option first.", variant: "destructive" });
      return;
    }

    if (!address) {
      toast({ title: "Wallet disconnected. Please reconnect.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);

      // 3. Prompt MetaMask to show the structured data to the user
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Ballot",
        message: {
          proposalId,
          voter: address,
          choice: selectedChoice,
        },
      });

      // 4. Send the cryptographically secure payload to NestJS backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/votes/gasless`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          voterAddress: address.toLowerCase(),
          choice: selectedChoice,
          signature,
        }),
      });

      if (!response.ok) throw new Error("Backend verification failed.");

      // 5. Success state updates
      setIsSuccess(true);
      toast({ title: "Vote cast successfully!", variant: "success" });
      onSuccess?.();

    } catch (error: any) {
      // 6. Graceful Error Handling (Catching user rejections)
      if (error.message.includes("User rejected")) {
        toast({ title: "Signature cancelled.", description: "You can vote later." });
      } else {
        toast({ title: "Voting failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Button disabled className="w-full bg-emerald-600 opacity-100 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Vote Registered
      </Button>
    );
  }

  return (
    <Button
      onClick={handleVote}
      disabled={isSubmitting || selectedChoice === null}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all" 
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Awaiting Signature...
        </>
      ) : (
        "Confirm Vote Securely"
      )}
    </Button>
  );
}
```

### Why this is a Senior-level implementation:
*   **Decoupled State**: It relies entirely on `wagmi` for wallet context, avoiding prop drilling or manual window object (`window.ethereum`) manipulations.
*   **Strict Typing (`as const`)**: By defining the domain and types as `const`, TypeScript will strictly infer the message structure inside `signTypedDataAsync`. If you typo `proposalId`, the compiler throws an error immediately.
*   **Fault-Tolerant UX**: It catches the notorious "User Rejected" error (when a user clicks "Cancel" in MetaMask) and displays a polite toast rather than letting the application crash or freeze in a loading state.
