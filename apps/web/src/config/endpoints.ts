export const API_ENDPOINTS = {
  AUTH: {
    NONCE: '/auth/nonce',
    VERIFY: '/auth/verify',
  },
  USERS: {
    PROFILE: (walletAddress: string) => `/users/${walletAddress}`,
  },
  KUDOS: {
    SEND: '/kudos/send',
    RECEIVED: (walletAddress: string) => `/kudos/received/${walletAddress}`,
  },
} as const;
