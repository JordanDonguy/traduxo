import { setAccessToken, getAccessToken, clearAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

describe("tokenStore", () => {
  // ------ Test 1️⃣ ------
  it("should return null initially", () => {
    expect(getAccessToken()).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("should store and retrieve access token", () => {
    setAccessToken("my-token");
    expect(getAccessToken()).toBe("my-token");
  });

  // ------ Test 3️⃣ ------
  it("should clear the access token", () => {
    setAccessToken("my-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("should overwrite token if set again", () => {
    setAccessToken("token1");
    setAccessToken("token2");
    expect(getAccessToken()).toBe("token2");
  });
});
