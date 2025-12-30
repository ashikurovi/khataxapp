import { SignJWT, jwtVerify, JWTPayload } from "jose";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ALGORITHM = "HS256";

// Convert secret to Uint8Array for jose
const getSecretKey = () => {
  return new TextEncoder().encode(SECRET_KEY);
};

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Generate a JWT token with 20-day expiration
 */
export async function generateToken(payload: TokenPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("20d") // 20 days expiration
    .sign(secretKey);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALGORITHM],
    });

    return payload as TokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  
  return parts[1];
}

