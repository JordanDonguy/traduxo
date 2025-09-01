import { cleanGeminiResponse, cleanGeminiPoolResponse } from "@/lib/client/utils/cleanGeminiResponse";

describe("cleanGeminiResponse", () => {
  // ------ Test 1️⃣ ------
  it("removes ```json at the start and ``` at the end and parses JSON lines", () => {
    const input = "```json\n{\"foo\":\"bar\"}\n```";
    const expected = [{ foo: "bar" }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 2️⃣ ------
  it("removes ```json even with leading/trailing whitespace and parses JSON", () => {
    const input = "   ```json   \n{\"key\":123}\n```   ";
    const expected = [{ key: 123 }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 3️⃣ ------
  it("removes plain ``` fences (no json) and parses JSON lines", () => {
    const input = "```\n{\"hello\":\"world\"}\n```";
    const expected = [{ hello: "world" }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 4️⃣ ------
  it("does nothing if there are no code fences and parses JSON line", () => {
    const input = "{\"foo\":\"bar\"}";
    const expected = [{ foo: "bar" }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 5️⃣ ------
  it("handles multiple JSON objects on separate lines", () => {
    const input = "```json\n{\"a\":1}\n{\"b\":2}\n```";
    const expected = [{ a: 1 }, { b: 2 }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 6️⃣ ------
  it("handles uppercase JSON in the fence", () => {
    const input = "```JSON\n{\"x\":1}\n```";
    const expected = [{ x: 1 }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 7️⃣ ------
  it("removes trailing dots and ellipses after fences", () => {
    const input = "```json\n{\"y\":2}\n```...";
    const expected = [{ y: 2 }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });

  // ------ Test 8️⃣ ------
  it("trims empty lines between JSON objects", () => {
    const input = "```json\n{\"a\":1}\n\n{\"b\":2}\n```";
    const expected = [{ a: 1 }, { b: 2 }];
    expect(cleanGeminiResponse(input)).toEqual(expected);
  });
});

describe("cleanGeminiPoolResponse", () => {
  it("removes opening and closing fences but keeps raw text", () => {
    const input = "```json\nSome text here\n```";
    const expected = "Some text here";
    expect(cleanGeminiPoolResponse(input)).toBe(expected);
  });

  it("trims leading/trailing whitespace and fences", () => {
    const input = "   ```json   \nHello world\n```   ";
    const expected = "Hello world";
    expect(cleanGeminiPoolResponse(input)).toBe(expected);
  });

  it("removes trailing dots after fences", () => {
    const input = "```json\nText\n```...";
    const expected = "Text";
    expect(cleanGeminiPoolResponse(input)).toBe(expected);
  });
});
