import { z } from "zod";

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(32, "Token must be at least 32 characters"),
});
