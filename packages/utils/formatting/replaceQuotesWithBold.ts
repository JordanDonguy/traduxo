export function replaceQuotesWithBold(text: string): string {
  if (!text) return "";

  return text
    // Replace double quotes
    .replace(/"([^"]+?)"/g, "**$1**")
    // Replace French style quotes
    .replace(/«([^»]+?)»/g, "**$1**");
}
