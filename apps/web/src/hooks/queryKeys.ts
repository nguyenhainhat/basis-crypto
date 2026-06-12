export const kudosKeys = {
  all: ["kudos"] as const,
  lists: () => [...kudosKeys.all, "list"] as const,
  list: (filters: string) => [...kudosKeys.lists(), { filters }] as const,
  details: () => [...kudosKeys.all, "detail"] as const,
  detail: (id: string) => [...kudosKeys.details(), id] as const,
  received: (walletAddress: string) => [...kudosKeys.all, "received", walletAddress] as const,
};

export const userKeys = {
  all: ["users"] as const,
  profile: (walletAddress: string) => [...userKeys.all, "profile", walletAddress] as const,
};
