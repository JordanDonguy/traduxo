import { cleanAIResponse } from "@traduxo/packages/utils/formatting/cleanAIResponse";

describe("cleanAIResponse", () => {
  // ------ Test 1️⃣ ------
  it("removes ```json fences and trims whitespace", () => {
    const input = "```json\n{\"foo\":\"bar\"}\n```";
    const expected = "{\"foo\":\"bar\"}";
    expect(cleanAIResponse(input)).toBe(expected);
  });

  // ------ Test 2️⃣ ------
  it("removes ``` fences with leading/trailing spaces", () => {
    const input = "   ```json   \n{\"key\":123}\n```   ";
    const expected = "{\"key\":123}";
    expect(cleanAIResponse(input)).toBe(expected);
  });

  // ------ Test 3️⃣ ------
  it("removes plain ``` fences", () => {
    const input = "```\nSome text\n```";
    const expected = "Some text";
    expect(cleanAIResponse(input)).toBe(expected);
  });

  // ------ Test 4️⃣ ------
  it("removes trailing dots after fences", () => {
    const input = "```json\n{\"x\":1}\n```...";
    const expected = "{\"x\":1}";
    expect(cleanAIResponse(input)).toBe(expected);
  });

  // ------ Test 5️⃣ ------
  it("does nothing if there are no fences", () => {
    const input = "{\"y\":2}";
    const expected = "{\"y\":2}";
    expect(cleanAIResponse(input)).toBe(expected);
  });

  // ------ Test 6️⃣ ------
  it("handles uppercase JSON in the fence", () => {
    const input = "```JSON\n{\"z\":3}\n```";
    const expected = "{\"z\":3}";
    expect(cleanAIResponse(input)).toBe(expected);
  });
});
