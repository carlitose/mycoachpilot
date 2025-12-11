import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

/**
 * Create standardized error response (internal use only)
 */
function errorResponse(
  message: string,
  status: number = 500,
  additionalData?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...additionalData
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Wrapper for API routes with standardized error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  errorPrefix: string = "API Error"
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      log.error(`${errorPrefix}:`, error);
      
      if (error instanceof Error) {
        return errorResponse(error.message);
      }
      
      return errorResponse("Internal server error");
    }
  };
}

/**
 * Common API error responses
 */
export const ApiErrors = {
  UNAUTHORIZED: () => errorResponse("Unauthorized", 401),
  NOT_FOUND: (resource: string) => errorResponse(`${resource} not found`, 404),
  BAD_REQUEST: (message: string) => errorResponse(message, 400),
  PAYMENT_REQUIRED: (message?: string) => errorResponse(
    message || "Payment required",
    402,
    { requiresUpgrade: true }
  ),
  SERVER_ERROR: (message?: string) => errorResponse(
    message || "Internal server error",
    500
  )
} as const;