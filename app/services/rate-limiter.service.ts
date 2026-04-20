import {
  RateLimitResult,
  RateLimiterConfig,
  RequestRecord,
  UserStats,
} from "@/app/models";

class RateLimiterService {
  private store: Map<string, RequestRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequests: number = 5, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.startCleanup();
  }

  checkAndRecord(userId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.store.get(userId);
    if (!record) {
      record = { userId, timestamps: [], totalRequests: 0, blockedRequests: 0 };
      this.store.set(userId, record);
    }

    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentRequests = record.timestamps.length;
    const allowed = currentRequests < this.maxRequests;

    if (allowed) {
      record.timestamps.push(now);
      record.totalRequests++;
    } else {
      record.blockedRequests++;
    }

    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = Math.max(0, oldestTimestamp + this.windowMs - now);

    return {
      allowed,
      remainingRequests: Math.max(
        0,
        this.maxRequests - record.timestamps.length,
      ),
      resetTime,
      currentRequests: record.timestamps.length,
    };
  }

  getStats(): UserStats[] {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const stats: UserStats[] = [];

    for (const [userId, record] of this.store.entries()) {
      const activeTimestamps = record.timestamps.filter(
        (ts) => ts > windowStart,
      );

      stats.push({
        userId,
        requestsInWindow: activeTimestamps.length,
        totalRequests: record.totalRequests,
        blockedRequests: record.blockedRequests,
        oldestRequestInWindow: activeTimestamps[0] || null,
        remainingRequests: Math.max(
          0,
          this.maxRequests - activeTimestamps.length,
        ),
      });
    }

    return stats;
  }

  getUserStats(userId: string): UserStats | null {
    const record = this.store.get(userId);
    if (!record) return null;

    const now = Date.now();
    const windowStart = now - this.windowMs;
    const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    return {
      userId,
      requestsInWindow: activeTimestamps.length,
      totalRequests: record.totalRequests,
      blockedRequests: record.blockedRequests,
      oldestRequestInWindow: activeTimestamps[0] || null,
      remainingRequests: Math.max(
        0,
        this.maxRequests - activeTimestamps.length,
      ),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * For testing: reset all state
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * Get configuration info
   */
  getConfig(): RateLimiterConfig {
    return {
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      windowSeconds: this.windowMs / 1000,
    };
  }
}

// Singleton instance - shared across all API route handlers
export const rateLimiterService = new RateLimiterService(5, 60 * 1000);
