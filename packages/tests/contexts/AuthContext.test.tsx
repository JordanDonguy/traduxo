/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth, AuthProvider } from "@traduxo/packages/contexts/AuthContext";
import { getToken } from "@traduxo/packages/utils/auth";

// ---- Mocks ----
jest.mock("@traduxo/packages/utils/auth");
const mockGetToken = getToken as jest.Mock;

// ---- Tests ----
describe("AuthContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  // ------ Test 1️⃣ ------
  it("sets status loading initially", () => {
    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.status).toBe("loading");
  });

  // ------ Test 2️⃣ ------
  it("returns authenticated with token and language if token exists", async () => {
    const fakeToken = "jwt.token.here";
    const fakeLang = "en";
    const fakeProviders = ["google", "github"];
    mockGetToken.mockResolvedValue({
      token: fakeToken,
      language: fakeLang,
      providers: fakeProviders,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.token).toBe(fakeToken);
    expect(result.current.language).toBe(fakeLang);
    expect(result.current.providers).toEqual(fakeProviders);
  });

  // ------ Test 3️⃣ ------
  it("returns unauthenticated if no token", async () => {
    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.token).toBeUndefined();
    expect(result.current.language).toBeUndefined();
    expect(result.current.providers).toBeUndefined();
  });

  // ------ Test 4️⃣ ------
  it("refresh updates the auth state", async () => {
    const fakeToken = "jwt.token.refresh";
    mockGetToken.mockResolvedValueOnce(null); // initial load
    mockGetToken.mockResolvedValueOnce({ token: fakeToken, language: "fr" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    await result.current.refresh(); // manually trigger refresh

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.token).toBe(fakeToken);
    expect(result.current.language).toBe("fr");
  });

  // ------ Test 5️⃣ ------
  it("does not crash if unmounted before refresh resolves", async () => {
    mockGetToken.mockResolvedValue({ token: "jwt.token", language: "en" });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    unmount();
    await new Promise((r) => setTimeout(r, 0));

    // Should remain initial "loading"
    expect(result.current.status).toBe("loading");
    expect(result.current.token).toBeUndefined();
  });

  // ------ Test 6️⃣ ------
  it("throws an error when used outside AuthProvider", () => {
    expect(() =>
      renderHook(() => useAuth())
    ).toThrow("useAuth must be used within an AuthProvider");
  });
});
