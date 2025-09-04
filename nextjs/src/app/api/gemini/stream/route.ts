import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkQuota } from '@/lib/server/dailyLimiter';
import { geminiStream } from "@/lib/server/handlers/gemini/geminiStream";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  const genai = new GoogleGenAI({});
  return geminiStream(req, { checkQuotaFn: checkQuota, genai });
}
