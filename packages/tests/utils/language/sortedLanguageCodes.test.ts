import ISO6391 from "iso-639-1";
import { getSortedLanguageCodes } from "@traduxo/packages/utils/language/sortedLanguageCodes";

jest.mock("iso-639-1", () => ({
  getAllCodes: jest.fn(),
}));

describe("getSortedLanguageCodes", () => {
  // ------ Test 1️⃣ ------
  it("sorts popular languages first in order", () => {
    // Mock ISO6391 to return a mix of popular and other codes
    (ISO6391.getAllCodes as jest.Mock).mockReturnValue([
      "pt", "xx", "fr", "de", "en", "zz"
    ]);

    const codes = getSortedLanguageCodes();
    // Popular languages appear first in the order defined in popularLangs
    expect(codes.slice(0, 4)).toEqual(["en", "fr", "de", "pt"]);
    // Remaining codes sorted alphabetically
    expect(codes.slice(4)).toEqual(["xx", "zz"]);
  });

  // ------ Test 2️⃣ ------
  it("keeps all codes sorted alphabetically if none are popular", () => {
    // Mock ISO6391 to return only uncommon codes
    (ISO6391.getAllCodes as jest.Mock).mockReturnValue(["bb", "aa", "cc"]);
    const codes = getSortedLanguageCodes();
    // All codes should be alphabetically sorted since none are popular
    expect(codes).toEqual(["aa", "bb", "cc"]);
  });
});
