import { getGoogleAuthUrl } from "@traduxo/packages/utils/auth/googleAuth";

describe("getGoogleAuthUrl", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns a URL with default redirect URI when none is provided", () => {
    const url = getGoogleAuthUrl();
    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent("http://localhost:3000/auth/google/callback")}`
    );
    expect(url).toContain("scope=openid%20email%20profile");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("prompt=consent");
  });

  it("returns a URL with provided redirect URI", () => {
    const redirectUri = "http://redirect.com/callback";
    const url = getGoogleAuthUrl(redirectUri);
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  });
});
