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

export const translationsSchema = z
  .array(z.string())
  .min(2, "At least two translations required") // original + main translation
  .max(6, "No more than five translations allowed"); // original + main + alt1 + alt2 + alt3

export const langSchema = z
  .string()
  .length(2, { message: "Language code must be 2 characters" })
  .regex(/^[a-z]{2}$/i, { message: "Language code must contain only letters" });

export const translationRequestSchema = z.object({
  translations: translationsSchema,
  inputLang: langSchema,
  outputLang: langSchema,
});
