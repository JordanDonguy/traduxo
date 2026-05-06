import Groq from "groq-sdk";

let cached: Groq | undefined;

// Lazily construct the Groq client so missing env vars don't throw at module load
// (Next.js collects page data at build time, which imports route modules).
export function getGroq(): Groq {
  if (!cached) cached = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return cached;
}
