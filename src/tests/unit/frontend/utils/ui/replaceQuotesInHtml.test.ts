import { replaceQuotesInHTML } from "@/lib/client/utils/ui/replaceQuotesInHTML";

describe("replaceQuotesInHTML", () => {
  // ------ Test 1️⃣ ------
  it("wraps double quotes with <strong>", () => {
    const text = 'This is a "test" sentence';
    const result = replaceQuotesInHTML(text);
    expect(result).toContain('<strong>test</strong>');
  });

  // ------ Test 2️⃣ ------
  it("wraps French quotes «...» with <strong>", () => {
    const text = 'Voici un «exemple»';
    const result = replaceQuotesInHTML(text);
    expect(result).toContain('<strong>exemple</strong>');
  });

  // ------ Test 3️⃣ ------
  it("handles text with both types of quotes", () => {
    const text = 'Mix "quotes" and «français»';
    const result = replaceQuotesInHTML(text);
    expect(result).toContain('<strong>quotes</strong>');
    expect(result).toContain('<strong>français</strong>');
  });

  // ------ Test 4️⃣ ------
  it("returns text unchanged if no quotes present", () => {
    const text = "No quotes here";
    const result = replaceQuotesInHTML(text);
    expect(result).toBe(text);
  });
});
