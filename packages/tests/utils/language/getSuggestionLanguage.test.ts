import getSuggestionLanguage from "@packages/utils/language/getSuggestionLanguage";

describe("getSuggestionLanguage", () => {
  // ------ Test 1️⃣ ------
  it("returns detectedLang if it differs from outputLang", () => {
    // If detected language is different, it should be used directly
    expect(getSuggestionLanguage("es", "en")).toBe("es");
    expect(getSuggestionLanguage("fr", "en")).toBe("fr");
  });

  // ------ Test 2️⃣ ------
  it("returns fallback if detectedLang equals outputLang", () => {
    // If detected language equals output language, pick fallback ('fr' for 'en', 'en' otherwise)
    expect(getSuggestionLanguage("en", "en")).toBe("fr");
    expect(getSuggestionLanguage("fr", "fr")).toBe("en");
  });

  // ------ Test 3️⃣ ------
  it("handles other languages correctly in fallback", () => {
    // Fallback for non-en/fr should default to 'en'
    expect(getSuggestionLanguage("de", "de")).toBe("en");
  });
});
