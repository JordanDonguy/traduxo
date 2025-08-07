import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkQuota } from '@/lib/server/dailyLimiter';
import { geminiComplete } from "@/lib/server/handlers/geminiComplete";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  const genai = new GoogleGenAI({}); // Picks up GEMINI_API_KEY from env
  return geminiComplete(req, { checkQuotaFn: checkQuota, genai });
}
