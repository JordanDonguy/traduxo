import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { geminiComplete } from "@/lib/server/handlers/gemini/geminiComplete";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  const genai = new GoogleGenAI({}); // Picks up GEMINI_API_KEY from env
  return geminiComplete(req, { genai });
}
