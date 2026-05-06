import type { NextRequest } from 'next/server';
import { getGroq } from '@/lib/server/ai/client';
import { aiComplete } from "@/lib/server/handlers/ai/aiComplete";

export async function POST(req: NextRequest) {
  return aiComplete(req, { groq: getGroq() });
}
