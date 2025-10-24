export function replaceQuotesWithBold(text: string): string {
  if (!text) return "";

  return text
    // Replace double quotes, trimming spaces inside
    .replace(/"([^"]+?)"/g, (_, p1) => `**${p1.trim()}**`)
    // Replace French style quotes, trimming spaces inside
    .replace(/«([^»]+?)»/g, (_, p1) => `**${p1.trim()}**`);
}
