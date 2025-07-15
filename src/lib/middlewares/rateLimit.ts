import { NextRequest, NextResponse } from "next/server";

const WINDOW = 60_000;
const LIMIT  = 10;
const buckets = new Map<string,{ count:number; reset:number }>();

export function rateLimiter(req: NextRequest): NextResponse | void {
  const id = (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();

  const now = Date.now();
  const b   = buckets.get(id) ?? { count: 0, reset: now + WINDOW };

  if (now > b.reset) Object.assign(b, { count: 0, reset: now + WINDOW });
  if (++b.count > LIMIT) {
    return NextResponse.json({error: "Too many requests... Try again in a minute 🙏"}, { status: 429 });
  }
  buckets.set(id, b);
}
