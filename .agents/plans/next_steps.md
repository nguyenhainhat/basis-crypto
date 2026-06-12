# dWorkspace Plan: Next Steps (Q1 Implementation)

This document outlines the current technical state of the **dWorkspace** workspace, identifies the immediate engineering gaps, and establishes a sequential roadmap for Q1, focusing heavily on solidifying our core NestJS backend with comprehensive unit testing before starting the frontend development.

---

## 1. Current State Assessment

We have inspected the workspace and found the following:
*   **Smart Contracts (`packages/contracts`)**:
    *   `WorkspaceSBT.sol` is fully implemented as a Soulbound ERC1155 token.
    *   Foundry unit tests in `WorkspaceSBT.t.sol` are completed and cover minting, authorization, and transfer failures.
*   **Database & Prisma (`apps/api/prisma`)**:
    *   Prisma schema is set up with `User` and `Kudos` tables.
    *   `PrismaService` is configured correctly.
*   **NestJS Backend (`apps/api/src`)**:
    *   **Auth Module**: Implements SIWE (Sign-In with Ethereum) to generate nonces and verify cryptographic signatures, issuing JWT tokens.
    *   **Users Module**: Implements user creation and profiles under the Repository Pattern.
    *   **Kudos Module**: Allows authenticated users to send kudos messages and retrieve received kudos.
    *   **Wallet Normalization**: A custom NestJS interceptor `WalletNormalizationInterceptor` successfully normalizes Ethereum addresses to lowercase to prevent database lookup duplication.
*   **Frontend Web App (`apps/web`)**:
    *   Currently an empty workspace directory.

---

## 2. Immediate Technical Gap: Testing Infrastructure

While the core functionality of the Q1 NestJS API is written, **there are currently zero unit tests on the backend.** 
According to **Rule 1 of `rules.md`**:
> *"write unit test for all functions"*

We must construct the testing framework and write comprehensive tests for every service, controller, interceptor, and repository.

---

## 3. Step 1: Install Testing Dependencies (Action Needed)

Since monorepo dependencies are managed via **Yarn Workspaces**, and adhering to **Rule 4 ("give me cmd, I will run myself for install something")**, please run the following command in your terminal to install the necessary testing libraries:

```bash
yarn workspace @dworkspace/api add -D jest ts-jest @types/jest @nestjs/testing supertest @types/supertest
```

---

## 4. Step 2: Configure Jest inside `apps/api`

Once dependencies are installed, we will create a `jest.config.js` in `apps/api` to configure Jest for TypeScript and NestJS mapping.

### Proposed `apps/api/jest.config.js`
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

---

## 5. Step 3: Implement Backend Unit Tests

We will write unit tests for every module. The exact details of the test suites are specified in [unit_tests_spec.md](file:///Users/nhatnguyen/code/ABC/basic-crypto/plan/unit_tests_spec.md).

*   `auth.service.spec.ts` & `auth.controller.spec.ts`
*   `users.service.spec.ts`, `users.repository.spec.ts`, and `users.controller.spec.ts`
*   `kudos.service.spec.ts`, `kudos.repository.spec.ts`, and `kudos.controller.spec.ts`
*   `wallet-normalization.interceptor.spec.ts`

To execute tests, you will be able to run:
```bash
yarn workspace @dworkspace/api run test
```

---

## 6. Step 4: Next.js Frontend Setup (Week 9-10 Roadmap)

After the backend is 100% unit-tested and secured, we will proceed to:
1. Initialize the `apps/web` directory with Next.js 14+ (App Router).
2. Set up wallet integrations (`Wagmi`, `RainbowKit`, `viem`).
3. Set up server-state synchronization with TanStack Query and state management with Zustand.
4. Construct SIWE authentication flows and Kudos dashboard interfaces.
