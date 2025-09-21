import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { validateJWTPayload } from "./utils/validateJwtPayload";

const JWT_SECRET = process.env.JWT_SECRET;

export async function checkAuth(
  req: Request | NextRequest
): Promise<{ user: { id: string; email: string } } | null> {
  try {
    // Try JWT Bearer token (mobile users)
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (!payload) return null;

    const user = validateJWTPayload(payload);
    if (!user) return null;

    return { user };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}
