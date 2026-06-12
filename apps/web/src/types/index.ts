export interface KudosLog {
  id: string;
  message: string;
  points: number;
  timestamp: string;
  sender: {
    walletAddress: string;
  };
  receiver: {
    walletAddress: string;
  };
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  username: string | null;
  profilePicture: string | null;
}
