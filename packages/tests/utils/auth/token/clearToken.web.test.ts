/**
 * @jest-environment jsdom
 */

import { clearToken } from "@traduxo/packages/utils/auth/token/clearToken.web";
import { clearAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

jest.mock("@traduxo/packages/utils/auth/token/tokenStore", () => ({
  clearAccessToken: jest.fn(),
}));

const mockClearAccessToken = clearAccessToken as jest.Mock;

describe("clearToken.web", () => {
  // ------ Test 1️⃣ ------
  it("calls clearAccessToken to clear in-memory token", async () => {
    await clearToken();

    expect(mockClearAccessToken).toHaveBeenCalled();
  });
});
