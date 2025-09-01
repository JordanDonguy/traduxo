import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
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

export const langSchema = z
  .string()
  .length(2, { message: "Language code must be 2 characters" })
  .regex(/^[a-z]{2}$/i, { message: "Language code must contain only letters" });

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(32, "Token must be at least 32 characters"),
});

export const translationItemSchema = z.object({
  type: z.enum(["expression", "main_translation", "alternative", "orig_lang_code"]),
  value: z.string(),
});

export const translationRequestSchema = z.object({
  translations: z.array(translationItemSchema),
  inputLang: langSchema,
  outputLang: langSchema,
});
