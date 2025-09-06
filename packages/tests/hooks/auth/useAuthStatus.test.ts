/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useAuthStatus } from "@packages/hooks/auth/useAuthStatus";

// ---- Mocks ----
const mockGetToken = jest.fn();
jest.mock("@packages/utils/auth/getToken", () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
}));

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("useAuthStatus", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("sets status loading initially", () => {
    process.env.PLATFORM = "react-native";
    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() => useAuthStatus());
    expect(result.current.status).toBe("loading");
  });

  it("returns authenticated with token on RN if token exists", async () => {
    process.env.PLATFORM = "react-native";
    const fakeToken = "jwt.token.here";
    mockGetToken.mockResolvedValue(fakeToken);

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    expect(result.current.token).toBe(fakeToken);
  });

  it("returns unauthenticated on RN if no token", async () => {
    process.env.PLATFORM = "react-native";
    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    expect(result.current.token).toBeUndefined();
  });

  it("returns web session status on Next.js", async () => {
    process.env.PLATFORM = "web";
    mockUseSession.mockReturnValue({ status: "authenticated", data: null });

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    expect(result.current.token).toBeUndefined();
  });

  it("returns unauthenticated on unknown platform", async () => {
    process.env.PLATFORM = "other";

    const { result } = renderHook(() => useAuthStatus());

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    expect(result.current.token).toBeUndefined();
  });

  it("does not update state if unmounted", async () => {
    process.env.PLATFORM = "react-native";
    mockGetToken.mockResolvedValue("jwt.token");

    const { result, unmount } = renderHook(() => useAuthStatus());

    unmount(); // immediately unmount

    // Wait a tick to let the async effect try to run
    await new Promise(r => setTimeout(r, 0));

    // Status should remain as initial "loading"
    expect(result.current.status).toBe("loading");
    expect(result.current.token).toBeUndefined();
  });

  it("does not set state for web if unmounted", async () => {
    process.env.PLATFORM = "web";
    const mockStatus = "authenticated";
    mockUseSession.mockReturnValue({ status: mockStatus, data: null });
    const { result, unmount } = renderHook(() => useAuthStatus());

    unmount(); // cancel the effect

    // Wait a tick to allow async effect to run
    await new Promise(r => setTimeout(r, 0));

    // Status should remain initial
    expect(result.current.status).toBe("loading");
    expect(result.current.token).toBeUndefined();
  });
});
