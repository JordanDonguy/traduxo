import { rateLimiter, resetRateLimiterStore, startRateLimiterCleanup, stopRateLimiterCleanup } from "@/lib/server/middlewares/rateLimit";
import { NextRequest } from "next/server";

function createRequest(ip?: string, headerName = "cf-connecting-ip") {
  return {
    headers: new Map(ip ? [[headerName, ip]] : []),
  } as unknown as NextRequest;
}

describe("rateLimiter", () => {
  let store: typeof import("@/lib/server/middlewares/rateLimit").rateLimitStore;

  // ------ Reset store values before each tests ------
  beforeEach(() => {
    store = {
      WINDOW: 60_000,
      LIMIT: 3,
      buckets: new Map(),
    };
    resetRateLimiterStore(store);
  });

  // ------ Stop auto limiter cleanup when test ends to prevent timer leaks -------
  afterAll(() => {
    stopRateLimiterCleanup();
  });

  // ------ Test 1️⃣ ------
  it("allows first request from an IP", () => {
    const req = createRequest("1.2.3.4");
    const res = rateLimiter(req, store);
    expect(res).toBeUndefined(); // undefined = allowed
    expect(store.buckets.get("1.2.3.4")?.count).toBe(1);
  });

  // ------ Test 2️⃣ ------
  it("blocks when exceeding limit", async () => {
    const req = createRequest("1.2.3.4");
    for (let i = 0; i < store.LIMIT; i++) {
      expect(rateLimiter(req, store)).toBeUndefined();
    }
    const res = rateLimiter(req, store);
    expect(res?.status).toBe(429);
    const json = res ? await res.json() : undefined;
    expect(json?.error).toContain("Too many requests");
  });

  // ------ Test 3️⃣ ------
  it("resets after window expires", () => {
    const req = createRequest("1.2.3.4");
    for (let i = 0; i < store.LIMIT; i++) {
      expect(rateLimiter(req, store)).toBeUndefined();
    }
    // Move time forward past reset
    const now = Date.now() + store.WINDOW + 1;
    const res = rateLimiter(req, store, now);
    expect(res).toBeUndefined(); // allowed again
  });

  // ------ Test 4️⃣ ------
  it("detects IP from different headers", () => {
    const reqRealIp = createRequest("5.6.7.8", "x-real-ip");
    const reqForwarded = createRequest("9.10.11.12, 13.14.15.16", "x-forwarded-for");

    rateLimiter(reqRealIp, store);
    rateLimiter(reqForwarded, store);

    expect(store.buckets.has("5.6.7.8")).toBe(true);
    expect(store.buckets.has("9.10.11.12")).toBe(true);
  });

  // ------ Test 5️⃣ ------
  it("cleans up expired buckets with startRateLimiterCleanup", async () => {
    jest.useFakeTimers();

    // Set expiry date of this bucket at one seconds in the past (already expired)
    store.buckets.set("1.1.1.1", { count: 1, reset: Date.now() - 1000 });

    const interval = startRateLimiterCleanup(store);
    jest.advanceTimersByTime(store.WINDOW);     // Fast-forward timer by window duration to trigger auto cleanup

    expect(store.buckets.size).toBe(0);
    stopRateLimiterCleanup(interval);

    jest.useRealTimers();
  });

  // ------ Test 6️⃣ ------
  it("uses cf-connecting-ip when present", () => {
    const req = createRequest("1.2.3.4", "cf-connecting-ip");
    rateLimiter(req, store);
    expect(store.buckets.has("1.2.3.4")).toBe(true);
  });

  // ------ Test 7️⃣ ------
  it("uses x-real-ip if cf-connecting-ip is missing", () => {
    const req = createRequest("5.6.7.8", "x-real-ip");
    rateLimiter(req, store);
    expect(store.buckets.has("5.6.7.8")).toBe(true);
  });

  // ------ Test 8️⃣ ------
  it("uses first IP from x-forwarded-for if cf-connecting-ip and x-real-ip are missing", () => {
    const req = createRequest("9.10.11.12,13.14.15.16", "x-forwarded-for");
    rateLimiter(req, store);
    expect(store.buckets.has("9.10.11.12")).toBe(true);
  });

  // ------ Test 9️⃣ ------
  it('falls back to "unknown" if no IP headers exist', () => {
    const req = createRequest(undefined, "non-existent-header");
    rateLimiter(req, store);
    expect(store.buckets.has("unknown")).toBe(true);
  });

});
