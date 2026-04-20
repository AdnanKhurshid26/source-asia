import type {
  RateLimitResponseDto,
  RequestSuccessResponseDto,
} from "@/app/dto";
import { validateCreateRequestDto } from "@/app/dto";
import { rateLimiterService } from "@/app/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateCreateRequestDto(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: validation.error,
        },
        { status: 400 },
      );
    }

    const { user_id, payload } = validation.data;
    const result = rateLimiterService.checkAndRecord(user_id);

    const headers = {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": String(result.remainingRequests),
      "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
    };

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Maximum 5 requests per minute per user.`,
          retryAfter: Math.ceil(result.resetTime / 1000),
          currentRequests: result.currentRequests,
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(Math.ceil(result.resetTime / 1000)),
          },
        },
      );
    }

    const responseData: RequestSuccessResponseDto = {
      user_id,
      payload,
      processed_at: new Date().toISOString(),
    };

    const rateLimit: RateLimitResponseDto = {
      remaining: result.remainingRequests,
      resetInSeconds: Math.ceil(result.resetTime / 1000),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Request processed successfully",
        data: responseData,
        rateLimit,
      },
      {
        status: 200,
        headers,
      },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Use POST to submit requests, GET /api/stats for statistics",
    },
    { status: 405 },
  );
}
