/**
 * @jest-environment jsdom
 */

import { saveToken } from "@traduxo/packages/utils/auth/token/saveToken.web";
import { setAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

jest.mock("@traduxo/packages/utils/auth/token/tokenStore", () => ({
  setAccessToken: jest.fn(),
}));

const mockSetAccessToken = setAccessToken as jest.Mock;

describe("saveToken.web", () => {
  // ------ Test 1️⃣ ------
  it("calls setAccessToken with accessToken", async () => {
    await saveToken("access123", "refresh456");

    expect(mockSetAccessToken).toHaveBeenCalledWith("access123");
  });

  // ------ Test 2️⃣ ------
  it("does not call setAccessToken if accessToken is undefined", async () => {
    await saveToken(undefined, "refresh456");

    expect(mockSetAccessToken).not.toHaveBeenCalled();
  });
});
