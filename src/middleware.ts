import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "./lib/middlewares/rateLimit";

export async function middleware(req: NextRequest) {
  // global rate‑limit for all API requests
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const res = rateLimiter(req);
    if (res) return res;                 // blocked -> 429
  }

  // default: allow through
  return NextResponse.next();
}

/** Run for everything */
export const config = { matcher: "/:path*" };
