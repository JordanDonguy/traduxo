/**
 * @jest-environment node
 */
import { getSystemLanguage } from "@traduxo/packages/utils/language/systemLanguage/getSystemLanguage.native";
import { getLocales } from "@react-native-localize";

// ---- Mock RNLocalize ----
jest.mock("@react-native-localize", () => ({
  getLocales: jest.fn(),
}));

describe("getSystemLanguage (native)", () => {
  // ------ Test 1️⃣ ------
  it("returns the first locale's languageCode", () => {
    (getLocales as jest.Mock).mockReturnValue([
      { languageCode: "fr", countryCode: "FR" },
    ]);

    expect(getSystemLanguage()).toBe("fr");
  });

  // ------ Test 2️⃣ ------
  it("falls back to 'en' when getLocales returns empty array", () => {
    (getLocales as jest.Mock).mockReturnValue([]);

    expect(getSystemLanguage()).toBe("en");
  });

  // ------ Test 3️⃣ ------
  it("falls back to 'en' when getLocales is undefined", () => {
    (getLocales as jest.Mock).mockReturnValue(undefined);

    expect(getSystemLanguage()).toBe("en");
  });
});
