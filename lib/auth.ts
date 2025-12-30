import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader, TokenPayload } from "./jwt";

/**
 * Middleware to verify JWT token from Authorization header
 * Returns the decoded token payload or null if invalid
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<{ payload: TokenPayload | null; error: NextResponse | null }> {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      payload: null,
      error: NextResponse.json(
        { success: false, error: "Authentication token required" },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      payload: null,
      error: NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { payload, error: null };
}

/**
 * Middleware to verify token and check if user has required role
 */
export async function verifyAuthWithRole(
  request: NextRequest,
  requiredRoles: string[]
): Promise<{ payload: TokenPayload | null; error: NextResponse | null }> {
  const { payload, error } = await verifyAuthToken(request);

  if (error || !payload) {
    return { payload: null, error };
  }

  if (!requiredRoles.includes(payload.role)) {
    return {
      payload: null,
      error: NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { payload, error: null };
}

