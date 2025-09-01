export function cleanGeminiResponse(text: string) {
  // Remove code fences
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/[\s\n\r]*```(?:\.*)?[\s\n\r]*$/i, "")
    .trim();

  // Split by line and parse each line
  return cleaned
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => JSON.parse(line));
}

export function cleanGeminiPoolResponse(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")                  // remove opening fence
    .replace(/[\s\n\r]*```(?:\.*)?[\s\n\r]*$/i, "")       // remove closing fence
    .trim();
}
