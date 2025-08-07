import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({message: "Invalid email address"})
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  password: z.string().min(8, "New password must be at least 8 characters"),
});

export const createPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const authEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  JWT_SECRET: z.string(),
});
