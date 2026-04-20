export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface RateLimitResponseDto {
  remaining: number;
  resetInSeconds: number;
}

export interface RequestSuccessResponseDto {
  user_id: string;
  payload: unknown;
  processed_at: string;
}

export interface RateLimitExceededResponseDto {
  error: string;
  message: string;
  retryAfter: number;
  currentRequests: number;
}

export interface UserStatsResponseDto {
  userId: string;
  requestsInCurrentWindow: number;
  totalRequests: number;
  blockedRequests: number;
  remainingRequests: number;
  oldestRequestInWindow: string | null;
}

export interface StatsSummaryDto {
  totalUsers: number;
  totalRequests: number;
  totalBlocked: number;
  activeUsersInWindow: number;
}

export interface StatsConfigDto {
  maxRequestsPerWindow: number;
  windowSeconds: number;
}

/**
 * Full stats response
 */
export interface StatsResponseDto {
  success: boolean;
  timestamp: string;
  config: StatsConfigDto;
  summary: StatsSummaryDto;
  users: UserStatsResponseDto[];
}
