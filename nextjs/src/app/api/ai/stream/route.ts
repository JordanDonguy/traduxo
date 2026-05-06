import type { NextRequest } from 'next/server';
import { getGroq } from '@/lib/server/ai/client';
import { checkQuota } from '@/lib/server/dailyLimiter';
import { aiStream } from "@/lib/server/handlers/ai/aiStream";

export async function POST(req: NextRequest) {
  return aiStream(req, { checkQuotaFn: checkQuota, groq: getGroq() });
}
