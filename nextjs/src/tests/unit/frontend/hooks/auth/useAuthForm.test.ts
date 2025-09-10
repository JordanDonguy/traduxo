/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useAuthHandlers } from "@/lib/client/hooks/auth/useAuthForm";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("useAuthHandlers split tests", () => {
  let pushMock: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routerMock: any;

  beforeEach(() => {
    pushMock = jest.fn();
    routerMock = { push: pushMock, replace: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(routerMock);

    localStorage.clear();
    global.fetch = jest.fn();
  });

  // -------------------- handleLogin --------------------
  describe("handleLogin", () => {
    it("rejects password shorter than 8 chars", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      await act(async () => {
        await result.current.handleLogin("a@b.com", "123", setError, setIsLoading, refresh);
      });

      expect(setError).toHaveBeenCalledWith(
        "Password length must be at least 8 characters"
      );
      expect(setIsLoading).not.toHaveBeenCalledWith(true);
    });

    it("logs in successfully with valid credentials", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: "a", refreshToken: "b" }),
      });

      await act(async () => {
        await result.current.handleLogin("a@b.com", "12345678", setError, setIsLoading, refresh);
      });

      expect(localStorage.getItem("accessToken")).toBe("a");
      expect(localStorage.getItem("refreshToken")).toBe("b");
      expect(refresh).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/?login=true");
    });

    it("sets error when response is not ok", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid credentials from server" }),
      });

      await act(async () => {
        await result.current.handleLogin(
          "a@b.com",
          "12345678",
          setError,
          setIsLoading,
          jest.fn()
        );
      });

      expect(setError).toHaveBeenCalledWith("Invalid credentials from server");
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("handles network error in catch block", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

      await act(async () => {
        await result.current.handleLogin(
          "a@b.com",
          "12345678",
          setError,
          setIsLoading,
          jest.fn()
        );
      });

      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("handles network error in catch block", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

      await act(async () => {
        await result.current.handleLogin(
          "a@b.com",
          "12345678",
          setError,
          setIsLoading,
          jest.fn()
        );
      });

      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("handles refresh() failure in catch block", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: "a", refreshToken: "b" }),
      });

      const refresh = jest.fn().mockRejectedValue(new Error("refresh failed"));

      await act(async () => {
        await result.current.handleLogin(
          "a@b.com",
          "12345678",
          setError,
          setIsLoading,
          refresh
        );
      });

      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  // -------------------- handleLogout --------------------
  describe("handleLogout", () => {
    it("returns false if no refresh token", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      const res = await result.current.handleLogout("fake-token", refresh, setIsLoading);
      expect(res).toBe(false);
    });

    it("logs out successfully", async () => {
      localStorage.setItem("refreshToken", "token123");
      const { result } = renderHook(() => useAuthHandlers());
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await act(async () => {
        await result.current.handleLogout("fake-token", refresh, setIsLoading);
      });

      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(refresh).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/?logout=true");
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("returns false if response not ok", async () => {
      localStorage.setItem("refreshToken", "token123");
      const { result } = renderHook(() => useAuthHandlers());
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const res = await act(async () =>
        result.current.handleLogout("fake-token", refresh, setIsLoading)
      );

      expect(res).toBe(false);
      expect(localStorage.getItem("refreshToken")).toBe("token123"); // still there
      expect(pushMock).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("handles errors in catch block", async () => {
      localStorage.setItem("refreshToken", "token123");
      const { result } = renderHook(() => useAuthHandlers());
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

      const res = await act(async () =>
        result.current.handleLogout("fake-token", refresh, setIsLoading)
      );

      expect(res).toBe(false);
      expect(localStorage.getItem("refreshToken")).toBe("token123"); // not cleared
      expect(refresh).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  // -------------------- handleSignup --------------------
  describe("handleSignup", () => {
    let setError: jest.Mock;
    let setIsSignup: jest.Mock;
    let refresh: jest.Mock;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      setError = jest.fn();
      setIsSignup = jest.fn();
      refresh = jest.fn();
      originalFetch = global.fetch;
      jest.clearAllMocks();
      localStorage.clear();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("rejects passwords shorter than 8 characters", async () => {
      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "1234567", "1234567", setError, setIsSignup, refresh);
      });

      expect(setError).toHaveBeenCalledWith("Passwords length must be at least 8 characters");
      expect(setIsSignup).not.toHaveBeenCalled();
    });

    it("rejects when passwords do not match", async () => {
      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "password123", "password456", setError, setIsSignup, refresh);
      });

      expect(setError).toHaveBeenCalledWith("Password and confirm password don't match");
      expect(setIsSignup).not.toHaveBeenCalled();
    });

    it("handles signup API failure", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "User exists" }),
      } as Partial<Response>);

      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup, refresh);
      });

      expect(setError).toHaveBeenCalledWith("User exists");
      expect(setIsSignup).not.toHaveBeenCalled();
    });

    it("handles JWT login failure after successful signup", async () => {
      // Step 1: Signup succeeds
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Partial<Response>) // signup
        .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Login failed" }) } as Partial<Response>); // jwt-login

      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup, refresh);
      });

      expect(setError).toHaveBeenCalledWith("Login failed");
      expect(setIsSignup).not.toHaveBeenCalled();
    });

    it("successfully signs up and logs in using JWT endpoint", async () => {
      const fakeTokens = { accessToken: "jwt-access", refreshToken: "jwt-refresh" };

      // Step 1: signup API
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Partial<Response>)
        // Step 2: jwt-login API
        .mockResolvedValueOnce({ ok: true, json: async () => fakeTokens } as Partial<Response>);

      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup, refresh);
      });

      expect(localStorage.getItem("accessToken")).toBe("jwt-access");
      expect(localStorage.getItem("refreshToken")).toBe("jwt-refresh");
      expect(refresh).toHaveBeenCalled();
      expect(setIsSignup).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles network error gracefully", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network fail"));

      const { result } = renderHook(() => useAuthHandlers());

      await act(async () => {
        await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup, refresh);
      });

      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
      expect(setIsSignup).not.toHaveBeenCalled();
    });
  });

  // -------------------- handleForgotPassword --------------------
  describe("handleForgotPassword", () => {
    it("rejects empty email", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      await act(async () => {
        await result.current.handleForgotPassword("", setError, setIsLoading);
      });

      expect(setError).toHaveBeenCalledWith(
        "Please enter your email to reset your password"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("calls API and shows success toast", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await act(async () => {
        await result.current.handleForgotPassword("a@b.com", setError, setIsLoading);
      });

      expect(toast.success).toHaveBeenCalledWith(
        "If this email exists, a reset link has been sent."
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith("");
    });
  });
});
