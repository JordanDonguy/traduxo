import { replaceQuotesWithBold } from "@packages/utils/formatting/replaceQuotesWithBold";

describe("replaceQuotesWithBold", () => {
  // ------ Test 1️⃣ ------
  it("wraps double quotes with **", () => {
    const text = 'This is a "test" sentence';
    const result = replaceQuotesWithBold(text);
    expect(result).toContain("**test**");
  });

  // ------ Test 2️⃣ ------
  it("wraps French quotes «...» with **", () => {
    const text = "Voici un «exemple»";
    const result = replaceQuotesWithBold(text);
    expect(result).toContain("**exemple**");
  });

  // ------ Test 3️⃣ ------
  it("handles text with both types of quotes", () => {
    const text = 'Mix "quotes" and «français»';
    const result = replaceQuotesWithBold(text);
    expect(result).toContain("**quotes**");
    expect(result).toContain("**français**");
  });

  // ------ Test 4️⃣ ------
  it("returns text unchanged if no quotes present", () => {
    const text = "No quotes here";
    const result = replaceQuotesWithBold(text);
    expect(result).toBe(text);
  });

  // ------ Test 5️⃣ ------
  it("returns empty string if input is empty", () => {
    expect(replaceQuotesWithBold("")).toBe("");
  });
});
