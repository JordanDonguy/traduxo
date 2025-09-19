/**
 * @jest-environment jsdom
 */
import { decodeTextStream } from "@traduxo/packages/utils/formatting/decodeTextStream";

// Polyfill TextDecoder/TextEncoder in Jest (Node may not expose them)
if (typeof (global as any).TextDecoder === "undefined") {
  const { TextDecoder, TextEncoder } = require("util");
  (global as any).TextDecoder = TextDecoder;
  (global as any).TextEncoder = TextEncoder;
}

describe("decodeTextStream", () => {
  // ------ Test 1️⃣ ------
  it("yields decoded strings for each streamed chunk", async () => {
    const chunks = [
      new TextEncoder().encode("Hello "),
      new TextEncoder().encode("world"),
      new TextEncoder().encode("!"),
    ];

    let callIndex = 0;
    const reader = {
      read: jest.fn().mockImplementation(async () => {
        if (callIndex < chunks.length) {
          const value = chunks[callIndex++];
          return { done: false, value };
        }
        return { done: true };
      }),
    };

    const results: string[] = [];
    for await (const chunk of decodeTextStream(reader as any)) {
      results.push(chunk);
    }

    expect(results).toEqual(["Hello ", "world", "!"]);
  });

  // ------ Test 2️⃣ ------
  it("skips undefined values returned by read()", async () => {
    const chunks: (Uint8Array | undefined)[] = [
      new TextEncoder().encode("Part1 "),
      undefined,
      new TextEncoder().encode("Part2"),
    ];

    let i = 0;
    const reader = {
      read: jest.fn().mockImplementation(async () => {
        if (i < chunks.length) {
          const v = chunks[i++];
          return { done: false, value: v as any };
        }
        return { done: true };
      }),
    };

    const results: string[] = [];
    for await (const chunk of decodeTextStream(reader as any)) {
      results.push(chunk);
    }

    expect(results).toEqual(["Part1 ", "Part2"]);
  });

  // ------ Test 3️⃣ ------
  it("completes without yielding when reader returns done immediately", async () => {
    const reader = {
      read: jest.fn().mockResolvedValue({ done: true }),
    };

    const results: string[] = [];
    for await (const chunk of decodeTextStream(reader as any)) {
      results.push(chunk);
    }

    expect(results).toEqual([]); // nothing yielded
  });
});
