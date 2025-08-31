// utils/textUtils.ts
export function replaceQuotesInHTML(text: string): string {
  return text
    // Replace double quotes
    .replace(/"([^"]+)"/g, '<strong>$1</strong>')
    // Replace French style quotes
    .replace(/«([^»]+)»/g, '<strong>$1</strong>');
}
