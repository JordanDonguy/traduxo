export const getSystemLanguage = (): string => {
  if (typeof window !== "undefined") {
    return (navigator.language || navigator.languages?.[0] || "en").split("-")[0];
  }
  return "en";
};
