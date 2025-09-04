import { z } from "zod";

export const authEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  JWT_SECRET: z.string(),
});
