/**
 * @jest-environment jsdom
 */

import { saveToken } from "@traduxo/packages/utils/auth";

beforeAll(() => {
  let store: Record<string, string> = {};
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    },
    writable: true,
  });
});

beforeEach(() => {
  localStorage.clear();
});

describe("saveToken.web", () => {
  it("saves accessToken and refreshToken to localStorage", async () => {
    await saveToken("access123", "refresh456");

    expect(localStorage.getItem("accessToken")).toBe("access123");
    expect(localStorage.getItem("refreshToken")).toBe("refresh456");
  });
});
