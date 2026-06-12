# dWorkspace: Low-Level Design (LLD) - Quarter 1

**Phase: Building the Foundation (Reputation & Authentication)**

## 1. Overview

The goal of Q1 is to establish a secure, reliable foundation for peer-to-peer recognition (Kudos) and identity management using Sign-In with Ethereum (SIWE).

## 2. Technical Stack

- **Blockchain Foundation**: Foundry (Solidity development & testing framework).
- **Backend**: NestJS (Modular architecture).
- **Database**: PostgreSQL + Prisma (ORM).
- **Frontend**: Next.js 14+ (App Router).
- **Auth**: SIWE (Sign-In with Ethereum) via `siwe` and `ethers.js v6`.
- **Data Fetching**: TanStack Query (React Query) for server state management and axios for api fetching.
- **Monorepo**: Turborepo for workspace orchestration.
- **Infrastructure**: Docker Compose (Local Dev).

---

## 3. Monorepo Structure (Turborepo)

We utilize a monorepo to share types and configurations between the frontend and backend, ensuring type safety across the entire stack.

```text
.
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/          # NestJS Backend
├── packages/
│   ├── shared/       # Shared types, Zod schemas, and constants
│   ├── tsconfig/     # Shared TypeScript configurations
│   └── eslint-config/# Centralized ESLint rules
├── turbo.json        # Pipeline orchestration
└── package.json
```

- **Shared Types**: Use a shared package to define API responses and request DTOs, preventing "any" types or drift between FE/BE.
- **Task Orchestration**: `turbo dev` runs both apps and watches shared packages for changes.

---

## 4. Database Schema (Prisma)

We prioritize wallet normalization (storing all addresses in lowercase) to prevent duplicate accounts and lookup errors.

```prisma
// prisma/schema.prisma

model User {
  id             String   @id @default(uuid())
  walletAddress  String   @unique // Always stored lowercase
  username       String?  @unique
  profilePicture String?
  kudosReceived  Kudos[]  @relation("Receiver")
  kudosSent      Kudos[]  @relation("Sender")
  createdAt      DateTime @default(now())
}

model Kudos {
  id          String   @id @default(uuid())
  message     String
  points      Int      @default(1)
  sender      User     @relation("Sender", fields: [senderId], references: [id])
  senderId    String
  receiver    User     @relation("Receiver", fields: [receiverId], references: [id])
  receiverId  String
  timestamp   DateTime @default(now())

  @@index([senderId])
  @@index([receiverId])
}
```

---

## 5. Smart Contract Design (WorkspaceSBT.sol)

A non-transferable ERC1155 token to represent permanent achievements.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WorkspaceSBT is ERC1155, Ownable {
    constructor() ERC1155("https://api.dworkspace.com/metadata/{id}.json") Ownable(msg.sender) {}

    function mint(address account, uint256 id, uint256 amount) external onlyOwner {
        _mint(account, id, amount, "");
    }

    // Override transfer functions to make tokens Soulbound (SBT)
    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public pure override {
        revert("Tokens are Soulbound and non-transferable");
    }

    function safeBatchTransferFrom(address, address, uint256[] memory, uint256[] memory, bytes memory) public pure override {
        revert("Tokens are Soulbound and non-transferable");
    }
}
```

---

## 6. API Specification

### **Authentication (SIWE)**

- `GET /auth/nonce`: Generates a random nonce for the client to sign.
- `POST /auth/verify`: Verifies the SIWE signature and issues a JWT session.

### **Kudos Management**

- `GET /users/me`: Returns profile and total Kudos count.
- `POST /kudos/send`: Sends Kudos to another user.
  - **Payload**: `{ "receiverAddress": "0x...", "message": "Great work on the PR!" }`
  - **Logic**: Backend must verify the sender is not the receiver and normalize the address.

---

## 7. "Senior" Implementation Patterns

To reach a senior level, the following patterns will be strictly followed:

1.  **Repository Pattern**: Abstracting database logic from controllers to allow for easier testing and future database migrations.
2.  **Global Validation Pipe**: Using `class-validator` and `class-transformer` in NestJS to ensure all incoming payloads are strictly typed and sanitized.
3.  **Wallet Address Normalization**: A custom NestJS interceptor or middleware that converts all `walletAddress` inputs to lowercase before they reach the service layer.
4.  **Wallet Normalization Interceptor**:

    ```typescript
    @Injectable()
    export class WalletNormalizationInterceptor implements NestInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        if (request.body.walletAddress) {
          request.body.walletAddress = request.body.walletAddress.toLowerCase();
        }
        return next.handle();
      }
    }
    ```

5.  **Monorepo Type Safety**: Exporting Zod schemas from `packages/shared` to be used by both NestJS (`class-validator` via `zod-to-class-validator`) and Next.js (React Hook Form).

---

## 8. Frontend State Management (React Query)

To handle server state, we use **TanStack Query (React Query)**. This ensures efficient caching, background updates, and a "Senior" approach to data fetching.

- **Query Key Factory**: Centralized management of query keys to prevent hardcoding and ensure easy invalidation.
  ```typescript
  export const kudosKeys = {
    all: ["kudos"] as const,
    lists: () => [...kudosKeys.all, "list"] as const,
    list: (filters: string) => [...kudosKeys.lists(), { filters }] as const,
    details: () => [...kudosKeys.all, "detail"] as const,
    detail: (id: string) => [...kudosKeys.details(), id] as const,
  };
  ```
- **Custom Hooks**: Wrapping every API call in a custom hook (e.g., `useSendKudos`, `useUserKudos`) to keep components clean.
- **Optimistic Updates**: Implementing optimistic UI for Kudos sending to provide a "premium" snappy feel.

---

## 9. Code Quality & Standards (ESLint & Prettier)

Consistency is key for senior-level projects. We enforce strict rules via a shared configuration.

### **ESLint Configuration**

- **Plugin: simple-import-sort**: Enforces a consistent import order (React/Nest first, then internal packages, then styles).
- **Plugin: unused-imports**: Automatically removes unused imports on save.
- **Rules**:
  - `@typescript-eslint/no-explicit-any`: **Error** (Forces proper typing).
  - `@typescript-eslint/explicit-function-return-type`: **Warn** (Encourages explicit API contracts).

### **Prettier Configuration**

- **Standardization**: 2 spaces, semi-colons, single quotes.
- **Tailwind Plugin**: `prettier-plugin-tailwindcss` for consistent class ordering.
- **Pre-commit Hooks**: **Husky** + **lint-staged** to run `eslint --fix` and `prettier --write` before any code is committed.

---

## 10. Q1 Roadmap (12 Weeks)

| Week      | Milestone               | Focus                                                         |
| :-------- | :---------------------- | :------------------------------------------------------------ |
| **1-2**   | **Infrastructure**      | Setup Docker, Prisma, and Foundry boilerplate.                |
| **3-4**   | **Smart Contracts**     | Develop and test `WorkspaceSBT.sol`. Deploy to local Anvil.   |
| **5-6**   | **Authentication**      | Implement SIWE flow (Nonce -> Verify -> JWT).                 |
| **7-8**   | **Core API**            | Build User and Kudos modules with Repository Pattern.         |
| **9-10**  | **Frontend Foundation** | Next.js setup with Wagmi/RainbowKit for wallet connection.    |
| **11-12** | **Integration**         | Connect FE to BE; first peer-to-peer Kudos sent on local dev. |
