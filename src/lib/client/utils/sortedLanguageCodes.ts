import ISO6391 from "iso-639-1";

// Most popular languages first
const popularLangs = [
  "en", // English
  "es", // Spanish
  "fr", // French
  "de", // German
  "zh", // Chinese
  "ar", // Arabic
  "ru", // Russian
  "pt", // Portuguese
  "ja", // Japanese
  "hi", // Hindi
];

export const getSortedLanguageCodes = () => {
  return ISO6391.getAllCodes().sort((a, b) => {
    const indexA = popularLangs.indexOf(a);
    const indexB = popularLangs.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
  });
};
