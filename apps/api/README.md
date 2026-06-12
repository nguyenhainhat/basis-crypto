# dWorkspace API (NestJS)

## Setup
1. Install dependencies from the root: `npm install`
2. Configure your `.env` file with a valid PostgreSQL URL.
3. Run Prisma migrations: `npx prisma migrate dev`
4. Start the development server: `npm run start:dev`

## Architecture
- **Repository Pattern**: Database logic is abstracted into `*.repository.ts` files.
- **Global Validation**: Strict payload validation via `class-validator`.
- **Wallet Normalization**: Custom interceptor to ensure all Ethereum addresses are lowercase.
- **SIWE (Pending)**: Sign-In with Ethereum integration in progress.
