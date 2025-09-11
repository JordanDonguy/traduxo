/**
 * @jest-environment jsdom
 */
import { getSystemLanguage } from "@traduxo/packages/utils/language/systemLanguage";

describe("getSystemLanguage (web)", () => {
  const originalNavigator = { ...global.navigator };

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  // ------ Test 1️⃣ ------
  it("returns navigator.language when defined", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: "fr-FR", languages: ["fr-FR"] },
      writable: true,
    });

    expect(getSystemLanguage()).toBe("fr");
  });

  // ------ Test 2️⃣ ------
  it("falls back to navigator.languages[0] when navigator.language is undefined", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: ["es-ES"] },
      writable: true,
    });

    expect(getSystemLanguage()).toBe("es");
  });

  // ------ Test 3️⃣ ------
  it("returns 'en' when neither navigator.language nor navigator.languages are defined", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: undefined },
      writable: true,
    });

    expect(getSystemLanguage()).toBe("en");
  });
});
