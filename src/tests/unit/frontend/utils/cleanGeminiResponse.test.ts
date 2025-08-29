import { cleanGeminiResponse } from "@/lib/client/utils/cleanGeminiResponse";

describe("cleanGeminiResponse", () => {
  // ------ Test 1️⃣ ------
  it("removes ```json at the start and ``` at the end", () => {
    const input = "```json\n{\n  \"foo\": \"bar\"\n}\n```";
    const expected = "{\n  \"foo\": \"bar\"\n}";
    // Should strip the ```json and closing ```
    expect(cleanGeminiResponse(input)).toBe(expected);
  });

  // ------ Test 2️⃣ ------
  it("removes ```json even with leading/trailing whitespace", () => {
    const input = "   ```json   \n{\"key\":123}\n```   ";
    const expected = "{\"key\":123}";
    // Leading/trailing spaces/newlines are removed
    expect(cleanGeminiResponse(input)).toBe(expected);
  });

  // ------ Test 3️⃣ ------
  it("removes plain ``` fences (no json)", () => {
    const input = "```\nhello\n```";
    const expected = "hello";
    // Works even without 'json' specifier
    expect(cleanGeminiResponse(input)).toBe(expected);
  });

  // ------ Test 4️⃣ ------
  it("does nothing if there are no code fences", () => {
    const input = "{ \"foo\": \"bar\" }";
    // Input should remain unchanged
    expect(cleanGeminiResponse(input)).toBe(input);
  });

  // ------ Test 5️⃣ ------
  it("handles uppercase JSON in the fence", () => {
    const input = "```JSON\n{\"x\":1}\n```";
    const expected = "{\"x\":1}";
    // Case-insensitive removal of ```JSON
    expect(cleanGeminiResponse(input)).toBe(expected);
  });

  // ------ Test 6️⃣ ------
  it("removes trailing dots and ellipses after fences", () => {
    const input = "```json\n{\"y\":2}\n```...";
    const expected = "{\"y\":2}";
    // Should strip both fences and trailing dots
    expect(cleanGeminiResponse(input)).toBe(expected);
  });
});
