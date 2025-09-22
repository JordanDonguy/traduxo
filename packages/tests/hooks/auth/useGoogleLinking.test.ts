/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGoogleLinking } from "@traduxo/packages/hooks/auth/useGoogleLinking";
import * as authUtils from "@traduxo/packages/utils/auth/token";

describe("useGoogleLinking", () => {
  let mockFetch: jest.Mock;
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    mockNavigate = jest.fn();

    // Reset spy on saveToken before each test
    jest.spyOn(authUtils, "saveToken").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks(); // restore original implementation
  });

  // ------ Test 1️⃣ ------
  it("throws an error if navigateFn is not provided", () => {
    expect(() =>
      renderHook(() => useGoogleLinking({ fetchFn: mockFetch }))
    ).toThrow("Missing navigation dependencies");
  });

  // ------ Test 2️⃣ ------
  it("sets error if email or password is missing", async () => {
    const { result } = renderHook(() =>
      useGoogleLinking({ fetchFn: mockFetch, navigateFn: mockNavigate })
    );

    await act(async () => {
      await result.current.handleSubmit("", "password");
    });
    expect(result.current.error).toBe("Please enter both email and password.");
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.handleSubmit("email@example.com", "");
    });
    expect(result.current.error).toBe("Please enter both email and password.");
    expect(result.current.isLoading).toBe(false);
  });

  // ------ Test 3️⃣ ------
  it("sets fallback error if backend fails without tokens or error message", async () => {
    // Backend returns no tokens and no error
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useGoogleLinking({ fetchFn: mockFetch, navigateFn: mockNavigate })
    );

    await act(async () => {
      await result.current.handleSubmit("email@example.com", "password");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Something went wrong... Please try again later"
      );
      expect(result.current.isLoading).toBe(false);
      expect(authUtils.saveToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ------ Test 4️⃣ ------
  it("sets error if backend fails or tokens missing", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Invalid credentials" }),
    });

    const { result } = renderHook(() =>
      useGoogleLinking({ fetchFn: mockFetch, navigateFn: mockNavigate })
    );

    await act(async () => {
      await result.current.handleSubmit("email@example.com", "password");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid credentials");
      expect(result.current.isLoading).toBe(false);
      expect(authUtils.saveToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    })
  });

  // ------ Test 5️⃣ ------
  it("saves token and redirects on successful login", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ accessToken: "at", refreshToken: "rt" }),
    });

    const { result } = renderHook(() =>
      useGoogleLinking({ fetchFn: mockFetch, navigateFn: mockNavigate })
    );

    await act(async () => {
      await result.current.handleSubmit("email@example.com", "password");

      // Check state inside the same act block
      expect(authUtils.saveToken).toHaveBeenCalledWith("at", "rt");
      expect(mockNavigate).toHaveBeenCalledWith("/?login=true");
      expect(result.current.error).toBe("");
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ------ Test 6️⃣ ------
  it("sets generic error if fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() =>
      useGoogleLinking({ fetchFn: mockFetch, navigateFn: mockNavigate })
    );

    await act(async () => {
      await result.current.handleSubmit("email@example.com", "password");
    });

    expect(result.current.error).toBe("Something went wrong... Please try again later");
    expect(result.current.isLoading).toBe(false);
    expect(authUtils.saveToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
