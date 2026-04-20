import type {
  StatsConfigDto,
  StatsResponseDto,
  StatsSummaryDto,
  UserStatsResponseDto,
} from "@/app/dto";
import { rateLimiterService } from "@/app/services";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = rateLimiterService.getStats();
    const config = rateLimiterService.getConfig();

    const configDto: StatsConfigDto = {
      maxRequestsPerWindow: config.maxRequests,
      windowSeconds: config.windowSeconds,
    };

    const summary: StatsSummaryDto = {
      totalUsers: stats.length,
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalBlocked: stats.reduce((sum, s) => sum + s.blockedRequests, 0),
      activeUsersInWindow: stats.filter((s) => s.requestsInWindow > 0).length,
    };

    const users: UserStatsResponseDto[] = stats.map((s) => ({
      userId: s.userId,
      requestsInCurrentWindow: s.requestsInWindow,
      totalRequests: s.totalRequests,
      blockedRequests: s.blockedRequests,
      remainingRequests: s.remainingRequests,
      oldestRequestInWindow: s.oldestRequestInWindow
        ? new Date(s.oldestRequestInWindow).toISOString()
        : null,
    }));

    const response: StatsResponseDto = {
      success: true,
      timestamp: new Date().toISOString(),
      config: configDto,
      summary,
      users,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
