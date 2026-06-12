import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, anvil } from 'wagmi/chains';

// We configure a default projectId for development.
// For production, this should come from process.env.NEXT_PUBLIC_PROJECT_ID
export const projectId = '04309cdf0df4d7a38bab7b5dcdcd5361';

export const config = getDefaultConfig({
  appName: 'dWorkspace',
  projectId,
  chains: [
    sepolia,
    mainnet,
    // Keep local Anvil for local backend operations
    {
      ...anvil,
      rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
      },
    },
  ],
  ssr: true,
});
