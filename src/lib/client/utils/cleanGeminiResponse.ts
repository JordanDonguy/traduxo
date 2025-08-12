export function cleanGeminiResponse(text: string) {
  return text
    .replace(/```json\s*/, "")
    .replace(/[\s\n\r]*```+[\s\n\r]*$/, "");
};
