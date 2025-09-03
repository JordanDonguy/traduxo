import { z } from "zod";
import { translationItemSchema } from "./translationItem.schemas";
import { langSchema } from "../language/lang.schemas";

export const translationRequestSchema = z.object({
  translations: z.array(translationItemSchema),
  inputLang: langSchema,
  outputLang: langSchema,
});
