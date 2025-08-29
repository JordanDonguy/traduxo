export function cleanGeminiResponse(text: string) {
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")                  // remove opening fence
    .replace(/[\s\n\r]*```(?:\.*)?[\s\n\r]*$/i, "")       // remove closing fence and trailing dots
    .trim();
}
