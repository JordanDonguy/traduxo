import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export const redis = Redis.fromEnv(); // Get redis ENV vaiables
 
export const QUOTA   = 300;            // 50 requests
export const WINDOW  = 24 * 60 * 60;  // 1 day

// Extract IP from request headers
function getIdentifier(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();
}

// Check quota to allow or not request, and then increment user's used requests by one
export async function checkQuota(req: NextRequest) {
  const id = getIdentifier(req);

  // Get number of user's request for the last 24 hours
  const key = `rl:${id}`;
  const used = Number((await redis.get<number>(key)) ?? 0);

  // Check quota, return a response with allowed = false if quota's exceeded
  if (used >= QUOTA) {
     return { allowed: false, remaining: 0 };
  }

  await redis.incr(key);                            // Increment redis rate limiting by one
  if (used === 0) await redis.expire(key, WINDOW);  // Create a new key with expiring window of 24h if first uses of the day

  return { allowed: true, remaining: QUOTA - used - 1 };           // Returns remaning quota
}

// Optional function to decrement user's requests count
export async function giveBack(req: NextRequest) {
  const id = getIdentifier(req);
  await redis.decr(`rl:${id}`);
}
