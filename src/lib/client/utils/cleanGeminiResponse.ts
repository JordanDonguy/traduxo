export function cleanGeminiResponse(text: string) {
  return text
    .replace(/```(?:json)?\s*/i, "")
    .replace(/[\s\n\r]*```+[\s\n\r]*$/, "")
    .trim();
};
