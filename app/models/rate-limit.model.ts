export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  currentRequests: number;
}
