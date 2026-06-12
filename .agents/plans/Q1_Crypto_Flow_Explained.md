# Q1: Crypto Concepts & Code Flow Explained

This document is designed to help you easily understand the Web3 and Cryptography concepts implemented during Quarter 1, and how the data flows between the Frontend, Backend, and the Blockchain.

---

## 1. The Core Concept: Why Web3?

In a traditional application (Web2), a central server owns the database, and you log in using a username and password. 

In **dWorkspace**, we use Web3 principles:
*   **The Wallet**: You don't have a username/password. You have a **Wallet** (like MetaMask). A wallet is just a cryptographic keypair. 
    *   **Public Key**: Your wallet address (e.g., `0x123...`). This is like your public username.
    *   **Private Key**: A secret mathematical string stored on your device. This is like your password, but it never leaves your computer.
*   **Smart Contracts**: Instead of putting *all* of our business logic on a private server, we put some permanent, unchangeable rules directly on a public Blockchain using the **Solidity** programming language.

---

## 2. Authentication Flow: SIWE (Sign-In With Ethereum)

In Q1, we implemented SIWE. This completely replaces standard passwords.

### The "Why": Cryptographic Proof
How do you prove to the NestJS backend that you own the wallet `0x123...` without sending a password over the internet? You use cryptographic signatures!

### The Step-by-Step Code Flow:
1. **Frontend Request**: The user clicks "Sign In" on the Next.js app. The frontend asks the NestJS backend for a **Nonce** (Number Used Once).
2. **Backend Nonce Generation**: NestJS generates a random string (e.g., `X8j2dL...`) and sends it back. 
    * *Why?* This prevents "Replay Attacks" (hackers recording your login signature and reusing it tomorrow).
3. **User Signature (Wallet)**: The Next.js frontend uses `wagmi` (`useSignMessage`) to pop up MetaMask. MetaMask asks the user to sign a text message containing the Nonce.
    * *Crypto Magic*: The wallet uses your secret **Private Key** to generate a mathematical **Signature**. The private key is never revealed to the website.
4. **Backend Verification**: Next.js sends the Signature to NestJS (`/api/v1/auth/verify`). NestJS runs a cryptographic check: *"Did the private key belonging to `0x123...` actually sign this exact message?"*
5. **Session Created**: If the math checks out, NestJS issues a standard JWT (JSON Web Token) cookie. From this point on, the app acts like a normal web app!

---

## 3. The Smart Contract Flow: Tokens & Voting

In Q1, we wrote two smart contracts using the **Foundry** framework.

### A. Soulbound Tokens (SBT) - `WorkspaceSBT.sol`
*   **What is an SBT?** Usually, crypto tokens (like Bitcoin) or NFTs can be transferred or sold to other people. A **Soulbound Token** is a special NFT that **cannot be transferred**. Once it is minted to your wallet, it is permanently bound to your "Soul".
*   **The Flow**: When a user earns 100 Kudos on the NestJS backend, the backend acts as an "Admin". It uses a server-side private key to talk to the Blockchain and Mint (create) an SBT directly into the user's wallet. The user now has permanent, un-fakeable cryptographic proof of their reputation!

### B. DAO Voting - `DaoVoting.sol`
*   **What is a DAO?** Decentralized Autonomous Organization. It just means a group of people making decisions together on the blockchain instead of a centralized CEO.
*   **The Flow**: When the team votes on a proposal, they don't vote directly on the blockchain immediately (because that costs money/gas fees for every single vote). 
    *   Instead, they vote on our NestJS backend. 
    *   Once the 7-day vote is over, the backend tallies the score and sends **ONE** transaction to the `DaoVoting.sol` contract to permanently record the final decision (`finalizeProposal`). This makes the final decision immutable and public.

---

## 4. Overall Architecture Flow (The Big Picture)

Here is how all the pieces we built in Q1 talk to each other:

1. **Local Blockchain (`Anvil`)**: Runs on your laptop. It simulates the Ethereum network so we can deploy and test our smart contracts for free without paying real money.
2. **NestJS Backend**: The central brain. It handles the PostgreSQL database, verifies cryptographic signatures, and talks to the Blockchain using server-side keys when necessary.
3. **Next.js Frontend**: The UI engine. 
    *   It uses **RainbowKit** to give users a beautiful "Connect Wallet" button.
    *   It uses **Wagmi** to read blockchain data and prompt wallet signatures.
    *   It uses **React Query** (TanStack) and **Axios** to fetch data from the NestJS Backend.

---

## 5. How Wallet Connection Works (RainbowKit & OKX)

To allow users to log in, we don't build complicated connection modals from scratch. We rely on the **RainbowKit** and **Wagmi** libraries to "turn on" web3 connections.

### How the Code Turns it On:
1. **The Setup (`providers.tsx`)**: At the root of the React application, we wrap the entire frontend in a `<WagmiProvider>` and `<RainbowKitProvider>`. This injects the "Blockchain Context" into the app.
2. **The UI (`Navbar.tsx`)**: We simply import the `<ConnectButton />` component from RainbowKit. This one line of code handles opening the modal, showing loading states, switching networks, and displaying the user's address.

### How to Connect OKX Wallet specifically:
The OKX Wallet is a highly popular Web3 wallet. Our setup supports it seamlessly in two ways:

1. **Browser Extension (Desktop)**: 
    * If you install the **OKX Wallet Chrome/Brave Extension**, RainbowKit automatically detects the `window.okxwallet` object injected into the browser.
    * When you click "Connect Wallet", OKX will appear as a primary option. Clicking it will pop open the OKX extension asking you to approve the connection.
2. **QR Code Scanning (Mobile)**:
    * If you are using the OKX App on your phone, click the "Connect Wallet" button on your computer and select **WalletConnect**.
    * A QR code will appear on your screen.
    * Open your OKX mobile app, tap the scan icon, and scan the QR code to securely link your phone wallet to the desktop website.

**Developer Note**: If we want to force OKX to always be the #1 recommended wallet in the list, we can explicitly import the `okxWallet` connector from `@rainbow-me/rainbowkit/wallets` and pass it to our configuration list in `config/wagmi.ts`!
