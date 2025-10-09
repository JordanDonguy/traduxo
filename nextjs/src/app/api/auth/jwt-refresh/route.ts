import { NextRequest } from "next/server";
import { refreshTokenHandler } from "@/lib/server/handlers/auth/jwtRefresh";

export async function POST(req: NextRequest) {
  return refreshTokenHandler(req);
}
