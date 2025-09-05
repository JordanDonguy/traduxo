import { decodeStream } from "@packages/utils/formatting/decodeStream";

describe("decodeStream", () => {
  // ------ Test 1️⃣ ------
  it("yields complete lines from streamed chunks", async () => {
    const chunks = [
      new TextEncoder().encode("line1\nli"), // partial second line
      new TextEncoder().encode("ne2\nline3\n"),
      new TextEncoder().encode("\n"),        // empty line
      new TextEncoder().encode("line4"),     // last incomplete line
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
    for await (const line of decodeStream(reader)) {
      results.push(line);
    }

    expect(results).toEqual([
      "line1",
      "line2",
      "line3",
      "line4",
    ]);
  });

  // ------ Test 2️⃣ ------
  it("skips empty lines", async () => {
    const chunks = [
      new TextEncoder().encode("\n\nline1\n\nline2\n"),
    ];

    const reader = {
      read: jest.fn()
        .mockResolvedValueOnce({ done: false, value: chunks[0] })
        .mockResolvedValueOnce({ done: true }),
    };

    const results: string[] = [];
    for await (const line of decodeStream(reader)) {
      results.push(line);
    }

    expect(results).toEqual(["line1", "line2"]);
  });

  // ------ Test 3️⃣ ------
  it("handles read() returning undefined value", async () => {
    const chunks = [
      new TextEncoder().encode("line1\n"),
      undefined, // triggers the else branch
      new TextEncoder().encode("line2\n"),
    ];

    let callIndex = 0;
    const reader = {
      read: jest.fn().mockImplementation(async () => {
        if (callIndex < chunks.length) {
          return { done: false, value: chunks[callIndex++] };
        }
        return { done: true };
      }),
    };

    const results: string[] = [];
    for await (const line of decodeStream(reader)) {
      results.push(line);
    }

    expect(results).toEqual(["line1", "line2"]);
  });
});
