import { z } from "zod";

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  password: z.string().min(8, "New password must be at least 8 characters"),
});
