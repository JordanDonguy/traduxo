import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { geminiStream } from "@/lib/server/handlers/geminiStream";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  const genai = new GoogleGenAI({});
  return geminiStream(req, { genai });
}
