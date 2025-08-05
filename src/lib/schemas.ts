import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({message: "Invalid email address"})
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});
