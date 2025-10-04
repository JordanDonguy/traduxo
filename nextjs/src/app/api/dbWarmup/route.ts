import { prisma } from "@/lib/server/prisma";

// Flag to prevent overlapping warm-ups
let isWarmingUp = false;

export async function GET() {
  if (process.env.NODE_ENV !== "production") {
    return new Response("Warm-up skipped in dev", { status: 200 });
  }

  if (isWarmingUp) {
    return new Response("Warm-up already running", { status: 200 });
  }

  isWarmingUp = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("DB warm-up executed");
    return new Response("DB warm-up executed", { status: 200 });
  } catch (error) {
    console.error("DB warm-up failed:", error);
    return new Response("DB warm-up failed", { status: 500 });
  } finally {
    isWarmingUp = false;
  }
}
