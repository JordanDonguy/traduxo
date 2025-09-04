import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export const QUOTA = 3;            // 3 requests
export const WINDOW = 24 * 60 * 60;  // 1 day

// Extract IP from request headers
function getIdentifier(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();
}

export function createQuotaChecker(redisClient: Redis) {
  return {
    // Check quota to allow or not request, and then increment user's used requests by one
    async checkQuota(req: Request) {
      const id = getIdentifier(req);

      // Get number of user's request for the last 24 hours
      const key = `rl:${id}`;
      const used = Number((await redisClient.get<number>(key)) ?? 0);

      // Check quota, return a response with allowed = false if quota's exceeded
      if (used >= QUOTA) {
        return { allowed: false, remaining: 0 };
      }

      await redisClient.incr(key);                            // Increment redisClient rate limiting by one
      if (used === 0) await redisClient.expire(key, WINDOW);  // Create a new key with expiring window of 24h if first uses of the day

      return { allowed: true, remaining: QUOTA - used - 1 };           // Returns remaning quota
    },
    
    // Function to decrement user's requests count
     async  giveBack(req: NextRequest) {
      const id = getIdentifier(req);
      await redisClient.decr(`rl:${id}`);
    }
  }
}

const redis = Redis.fromEnv();
export const { checkQuota, giveBack } = createQuotaChecker(redis);
