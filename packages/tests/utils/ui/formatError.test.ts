import { formatError } from "@utils/utils/ui/formatError";

describe("formatError", () => {
  // ------ Test 1️⃣ ------
  it("returns the same string if input is a string", () => {
    expect(formatError("simple error")).toBe("simple error");
  });

  // ------ Test 2️⃣ ------
  it("joins array of strings with semicolon", () => {
    expect(formatError(["error1", "error2"])).toBe("error1; error2");
  });

  // ------ Test 3️⃣ ------
  it("stringifies array with non-string elements", () => {
    expect(formatError(["error1", { code: 500 }])).toBe('error1; {"code":500}');
  });

  // ------ Test 4️⃣ ------
  it("stringifies plain objects", () => {
    expect(formatError({ message: "failed" })).toBe('{"message":"failed"}');
  });

  // ------ Test 5️⃣ ------
  it("handles Error instances", () => {
    expect(formatError(new Error("boom"))).toBe("boom");
  });

  // ------ Test 6️⃣ ------
  it("handles null and undefined as unknown error", () => {
    expect(formatError(null)).toBe("An unknown error occurred");
    expect(formatError(undefined)).toBe("An unknown error occurred");
  });

  // ------ Test 7️⃣ ------
  it("handles numbers, booleans, and other primitives as unknown error", () => {
    expect(formatError(42)).toBe("An unknown error occurred");
    expect(formatError(true)).toBe("An unknown error occurred");
  });

  // ------ Test 8️⃣ ------
  it("handles array with mixed primitives and objects", () => {
    expect(formatError(["err", 123, { msg: "oops" }])).toBe('err; 123; {"msg":"oops"}');
  });

  // ------ Test 9️⃣ ------
  it("handles unserializable objects gracefully", () => {
    const obj: any = {};
    obj.self = obj; // circular reference
    expect(formatError(obj)).toBe("An error occurred (unserializable object)");
  });

  // ------ Test 🔟 ------
  it("handles Error instances with empty message", () => {
    const error = new Error("");
    error.message = "";
    expect(formatError(error)).toBe("An unexpected error occurred");
  });
});
