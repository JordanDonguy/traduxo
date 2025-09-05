export default function getSuggestionLanguage(detectedLang: string, outputLang: string) {
  if (detectedLang === outputLang) {
    // Fallback logic: always pick something different from detectedLang
    const fallback = outputLang === "en" ? "fr" : "en";
    return fallback
  }
  return detectedLang;
}
