export interface User {
  id: string;
  createdAt: Date;
}

export interface RequestRecord {
  userId: string;
  timestamps: number[];
  totalRequests: number;
  blockedRequests: number;
}

export interface UserStats {
  userId: string;
  requestsInWindow: number;
  totalRequests: number;
  blockedRequests: number;
  oldestRequestInWindow: number | null;
  remainingRequests: number;
}
