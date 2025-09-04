import { z } from "zod";

export const langSchema = z
  .string()
  .length(2, { message: "Language code must be 2 characters" })
  .regex(/^[a-z]{2}$/i, { message: "Language code must contain only letters" });
