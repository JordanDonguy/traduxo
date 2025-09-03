import { z } from "zod";

export const translationItemSchema = z.object({
  type: z.enum(["expression", "main_translation", "alternative", "orig_lang_code"]),
  value: z.string(),
});
