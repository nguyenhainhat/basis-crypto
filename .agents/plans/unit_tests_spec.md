# dWorkspace Backend Unit Testing Specifications

This document defines the exact test suites, mock behaviors, and validation conditions for all services, controllers, repositories, and interceptors inside `@dworkspace/api` (NestJS).

---

## 1. Auth Module (`apps/api/src/auth`)

### A. `AuthService` (`auth.service.spec.ts`)
*   **Mocks**:
    *   `JwtService`: stub `sign()` to return a dummy string `"mock-jwt-token"`.
    *   `UsersService`: mock `findOrCreateUser(walletAddress)` to return a mock `User` entity.
*   **Test Cases**:
    *   `getNonce()`:
        *   Should return a non-empty, random cryptographic nonce string.
    *   `verifySignature(message, signature)`:
        *   **Success Path**: Should successfully parse SIWE signature, match nonce, fetch/create the user by wallet address, and return a signed JWT.
        *   **Failure - Nonce Mismatch**: Should throw `UnauthorizedException` if the signature nonce does not match the internal SIWE message nonce.
        *   **Failure - Verification Fails**: Should throw `UnauthorizedException` if SIWE message validation fails (e.g. signature is invalid).

### B. `AuthController` (`auth.controller.spec.ts`)
*   **Mocks**:
    *   `AuthService`: stub `getNonce()` and `verifySignature()`.
*   **Test Cases**:
    *   `getNonce()`:
        *   Should return `{ nonce: "some-nonce" }` on success.
    *   `verify()`:
        *   Should accept a `VerifyDto` (message & signature) and return `{ access_token: "mock-jwt-token" }` on success.

---

## 2. Users Module (`apps/api/src/users`)

### A. `UserRepository` (`users.repository.spec.ts`)
*   **Mocks**:
    *   `PrismaService`: mock `prisma.user.findUnique`, `prisma.user.create`, and `prisma.user.update`.
*   **Test Cases**:
    *   `findById(id)`: Should invoke `prisma.user.findUnique` with the exact ID.
    *   `findByWalletAddress(walletAddress)`: Should invoke `prisma.user.findUnique` with the lowercase wallet address.
    *   `create(data)`: Should invoke `prisma.user.create` with user payload.
    *   `update(id, data)`: Should invoke `prisma.user.update` for target user ID.

### B. `UsersService` (`users.service.spec.ts`)
*   **Mocks**:
    *   `UserRepository`: stub `findByWalletAddress()` and `create()`.
*   **Test Cases**:
    *   `getProfile(walletAddress)`:
        *   **Success**: Should convert address to lowercase, successfully fetch the profile, and return it.
        *   **Failure**: Should throw `NotFoundException` if no user exists at the normalized address.
    *   `findOrCreateUser(walletAddress)`:
        *   **Case 1 (Existing User)**: Should normalize the address, lookup existing record, and return the user immediately without creating a new record.
        *   **Case 2 (New User)**: Should normalize the address, detect the user does not exist, trigger creation via repository, and return the new user.

### C. `UsersController` (`users.controller.spec.ts`)
*   **Mocks**:
    *   `UsersService`: stub `getProfile()`.
*   **Test Cases**:
    *   `getProfile(walletAddress)`:
        *   Should route the path parameter to `UsersService` and return the profile.

---

## 3. Kudos Module (`apps/api/src/kudos`)

### A. `KudosRepository` (`kudos.repository.spec.ts`)
*   **Mocks**:
    *   `PrismaService`: mock `prisma.kudos.create`, `prisma.kudos.findMany`.
*   **Test Cases**:
    *   `create(data)`: Should invoke `prisma.kudos.create` with relation mappings.
    *   `findByReceiver(userId)`: Should invoke `prisma.kudos.findMany` filtering by `receiverId`.

### B. `KudosService` (`kudos.service.spec.ts`)
*   **Mocks**:
    *   `KudosRepository`: stub `create()` and `findByReceiver()`.
    *   `UsersService`: stub `findOrCreateUser()` and `getProfile()`.
*   **Test Cases**:
    *   `sendKudos(senderWallet, receiverWallet, message)`:
        *   **Success**: Should successfully resolve sender and receiver, call repository to record the kudos, and return the database entity.
        *   **Failure (Self-Gifting)**: Should throw `BadRequestException` if `senderWallet` and `receiverWallet` are identical (case-insensitive check).
    *   `getReceivedKudos(walletAddress)`:
        *   Should fetch the user profile, verify existence, and load all kudos records assigned to their ID.

### C. `KudosController` (`kudos.controller.spec.ts`)
*   **Mocks**:
    *   `KudosService`: stub `sendKudos()` and `getReceivedKudos()`.
*   **Test Cases**:
    *   `sendKudos()`:
        *   Should pass authenticated user's wallet address and body inputs to `KudosService`.
    *   `getReceived()`:
        *   Should route the requested address to the service layer.

---

## 4. Common Interceptors (`apps/api/src/common/interceptors`)

### A. `WalletNormalizationInterceptor` (`wallet-normalization.interceptor.spec.ts`)
*   **Mocks**:
    *   `ExecutionContext`: stub http context to supply mock request objects.
    *   `CallHandler`: stub standard rx-observable handle flow.
*   **Test Cases**:
    *   Should map `request.body.walletAddress` to lowercase if present.
    *   Should map `request.body.receiverAddress` to lowercase if present.
    *   Should map `request.params.walletAddress` to lowercase if present.
