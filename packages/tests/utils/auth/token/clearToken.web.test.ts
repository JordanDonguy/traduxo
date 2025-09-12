/**
 * @jest-environment jsdom
 */

import { clearToken } from "@traduxo/packages/utils/auth/token";

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
  localStorage.setItem("accessToken", "someAccess");
  localStorage.setItem("refreshToken", "someRefresh");
});

describe("clearToken.web", () => {
  it("removes accessToken and refreshToken from localStorage", async () => {
    await clearToken();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
