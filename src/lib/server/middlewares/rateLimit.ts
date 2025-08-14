import { NextRequest, NextResponse } from "next/server";

// Shared rate limiter store
export const rateLimitStore = {
  WINDOW: 60_000, // 1 minute
  LIMIT: 25,
  buckets: new Map<string, { count: number; reset: number }>(),
};

// Rate limiter function
export function rateLimiter(
  req: NextRequest,
  store = rateLimitStore,
  now: number = Date.now()
): NextResponse | void {
  const { WINDOW, LIMIT, buckets } = store;

  // Determine requester's IP
  const id = (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();

  // Get or initialize bucket for this IP
  const b = buckets.get(id) ?? { count: 0, reset: now + WINDOW };

  // Reset count if window has expired
  if (now > b.reset) Object.assign(b, { count: 0, reset: now + WINDOW });

  // Increase request count
  if (++b.count > LIMIT) {
    return NextResponse.json(
      { error: "Too many requests..." },
      { status: 429 }
    );
  }

  buckets.set(id, b); // Update store
}

// Cleanup function to remove expired buckets
export function startRateLimiterCleanup(store = rateLimitStore): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of store.buckets) {
      if (bucket.reset < now) {
        store.buckets.delete(ip);
      }
    }
  }, store.WINDOW);
}

// Start auto-cleanup by default (in prod environments)
const cleanupInterval = startRateLimiterCleanup();

// Helper for testing: clear store between tests
export function resetRateLimiterStore(store = rateLimitStore) {
  store.buckets.clear();
}

// Helper: stop auto-cleanup (for tests or graceful shutdown)
export function stopRateLimiterCleanup(interval = cleanupInterval) {
  clearInterval(interval);
}
