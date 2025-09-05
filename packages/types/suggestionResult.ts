import { Translation } from "./translation";

export type SuggestionResult<T = Translation> =
  | { success: true; data: T; error?: undefined }
  | { success: false; error: string; data?: undefined };
