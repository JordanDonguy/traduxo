/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useAuthHandlers } from "@traduxo/packages/hooks/auth/useAuthHandlers";
import { toast } from "react-toastify";
import { loginUser } from "@traduxo/packages/utils/auth/login";
import { logoutUser } from "@traduxo/packages/utils/auth/logout";
import { signupUser } from "@traduxo/packages/utils/auth/signup";
import { forgotPasswordRequest } from "@traduxo/packages/utils/auth/forgotPassword";
import { getGoogleAuthUrl } from "@traduxo/packages/utils/auth/googleAuth";

import { getToken, saveToken, clearToken } from "@traduxo/packages/utils/auth/token";

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@traduxo/packages/utils/auth/login", () => ({
  loginUser: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/logout", () => ({
  logoutUser: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/signup", () => ({
  signupUser: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/forgotPassword", () => ({
  forgotPasswordRequest: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/googleAuth", () => ({
  getGoogleAuthUrl: jest.fn(() => "http://redirect.com"),
}));

jest.mock("@traduxo/packages/utils/auth/token", () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  clearToken: jest.fn(),
}));

describe("useAuthHandlers", () => {
  // -------------------- handleLogin --------------------
  describe("handleLogin", () => {
    it("rejects short passwords", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      const success = await result.current.handleLogin(
        "a@b.com",
        "123",
        setError,
        setIsLoading,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Password length must be at least 8 characters");
    });

    it("logs in successfully and calls saveToken", async () => {
      const tokens = { accessToken: "a", refreshToken: "b" };
      (loginUser as jest.Mock).mockResolvedValue({ res: { ok: true }, data: tokens });

      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();
      const refresh = jest.fn();

      const success = await result.current.handleLogin("a@b.com", "12345678", setError, setIsLoading, refresh);

      expect(success).toBe(true);
      expect(saveToken).toHaveBeenCalledWith("a", "b");
      expect(refresh).toHaveBeenCalled();
    });

    it("handles API errors with error message", async () => {
      (loginUser as jest.Mock).mockResolvedValue({ res: { ok: false }, data: { error: "Invalid credentials" } });

      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      const success = await result.current.handleLogin("a@b.com", "12345678", setError, setIsLoading, jest.fn());

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Invalid credentials");
    });

    it("handles API errors fallback when no error message", async () => {
      (loginUser as jest.Mock).mockResolvedValue({ res: { ok: false }, data: {} });

      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      const success = await result.current.handleLogin("a@b.com", "12345678", setError, setIsLoading, jest.fn());

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Invalid credentials");
    });

    it("handles network or unexpected errors (catch block)", async () => {
      (loginUser as jest.Mock).mockRejectedValue(new Error("network fail"));

      const { result } = renderHook(() => useAuthHandlers());
      const setError = jest.fn();
      const setIsLoading = jest.fn();

      const success = await result.current.handleLogin("a@b.com", "12345678", setError, setIsLoading, jest.fn());

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
    });
  });


  // -------------------- handleLogout --------------------
  describe("handleLogout", () => {
    const refresh = jest.fn();
    const setIsLoading = jest.fn();
    it("returns false if getToken returns null", async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthHandlers());

      const success = await act(async () => result.current.handleLogout(refresh, setIsLoading));

      expect(success).toBe(false);
      expect(clearToken).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("logs out successfully and calls clearToken", async () => {
      (getToken as jest.Mock).mockResolvedValue({ token: "jwt-token", refreshToken: "refresh-token" });
      (logoutUser as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthHandlers());

      const success = await act(async () => result.current.handleLogout(refresh, setIsLoading));

      expect(success).toBe(true);
      expect(clearToken).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("returns false if logoutUser fails", async () => {
      (getToken as jest.Mock).mockResolvedValue({ token: "jwt-token", refreshToken: "refresh-token" });
      (logoutUser as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthHandlers());

      const success = await act(async () => result.current.handleLogout(refresh, setIsLoading));

      expect(success).toBe(false);
      expect(clearToken).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("handles errors in catch block", async () => {
      (getToken as jest.Mock).mockRejectedValue(new Error("network fail"));

      const { result } = renderHook(() => useAuthHandlers());

      const success = await act(async () => result.current.handleLogout(refresh, setIsLoading));

      expect(success).toBe(false);
      expect(clearToken).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  // -------------------- handleSignup --------------------
  describe("handleSignup", () => {
    let setError: jest.Mock;
    let setIsSignup: jest.Mock;
    let refresh: jest.Mock;

    beforeEach(() => {
      setError = jest.fn();
      setIsSignup = jest.fn();
      refresh = jest.fn();
    });

    it("rejects short passwords", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const success = await result.current.handleSignup(
        "a@b.com",
        "1234567",
        "1234567",
        setError,
        setIsSignup,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Passwords length must be at least 8 characters");
    });

    it("rejects mismatched passwords", async () => {
      const { result } = renderHook(() => useAuthHandlers());
      const success = await result.current.handleSignup(
        "a@b.com",
        "12345678",
        "87654321",
        setError,
        setIsSignup,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Password and confirm password don't match");
    });

    it("handles signup API failure", async () => {
      (signupUser as jest.Mock).mockResolvedValue({ res: { ok: false }, data: { error: "User exists" } });

      const { result } = renderHook(() => useAuthHandlers());
      const success = await result.current.handleSignup(
        "a@b.com",
        "12345678",
        "12345678",
        setError,
        setIsSignup,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("User exists");
    });

    it("handles login failure after successful signup", async () => {
      (signupUser as jest.Mock).mockResolvedValue({ res: { ok: true }, data: {} });
      (loginUser as jest.Mock).mockResolvedValue({ res: { ok: false }, data: { error: "Login failed" } });

      const { result } = renderHook(() => useAuthHandlers());
      const success = await result.current.handleSignup(
        "a@b.com",
        "12345678",
        "12345678",
        setError,
        setIsSignup,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith("Login failed");
    });

    it("successfully signs up and logs in, calls saveToken", async () => {
      const tokens = { accessToken: "a", refreshToken: "b" };
      (signupUser as jest.Mock).mockResolvedValue({ res: { ok: true }, data: {} });
      (loginUser as jest.Mock).mockResolvedValue({ res: { ok: true }, data: tokens });

      const { result } = renderHook(() => useAuthHandlers());
      const success = await act(async () =>
        result.current.handleSignup(
          "a@b.com",
          "12345678",
          "12345678",
          setError,
          setIsSignup,
          refresh
        )
      );

      expect(success).toBe(true);
      expect(saveToken).toHaveBeenCalledWith("a", "b");
      expect(setIsSignup).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });

    it("handles network or unexpected errors (catch block)", async () => {
      (signupUser as jest.Mock).mockRejectedValue(new Error("network fail"));

      const { result } = renderHook(() => useAuthHandlers());
      const success = await result.current.handleSignup(
        "a@b.com",
        "12345678",
        "12345678",
        setError,
        setIsSignup,
        refresh
      );

      expect(success).toBe(false);
      expect(setError).toHaveBeenCalledWith(
        "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
      );
    });
  });

  // -------------------- handleForgotPassword --------------------
  describe("handleForgotPassword", () => {
    let setError: jest.Mock;
    let setIsLoading: jest.Mock;

    beforeEach(() => {
      setError = jest.fn();
      setIsLoading = jest.fn();
      jest.clearAllMocks();
    });

    it("rejects empty email", async () => {
      const { result } = renderHook(() => useAuthHandlers());

      await result.current.handleForgotPassword("", setError, setIsLoading);

      expect(setError).toHaveBeenCalledWith(
        "Please enter your email to reset your password"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("calls API and shows success toast", async () => {
      (forgotPasswordRequest as jest.Mock).mockResolvedValue({ res: { ok: true }, data: {} });

      const { result } = renderHook(() => useAuthHandlers());

      await result.current.handleForgotPassword("a@b.com", setError, setIsLoading);

      expect(toast.success).toHaveBeenCalledWith(
        "If this email exists, a reset link has been sent."
      );
      expect(setError).toHaveBeenCalledWith("");
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("shows error toast when API response is not ok", async () => {
      (forgotPasswordRequest as jest.Mock).mockResolvedValue({ res: { ok: false }, data: { error: "Failed" } });

      const { result } = renderHook(() => useAuthHandlers());

      await result.current.handleForgotPassword("a@b.com", setError, setIsLoading);

      expect(toast.error).toHaveBeenCalledWith("Failed");
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it("shows error toast on network or unexpected errors", async () => {
      (forgotPasswordRequest as jest.Mock).mockRejectedValue(new Error("Network down"));

      const { result } = renderHook(() => useAuthHandlers());

      await result.current.handleForgotPassword("a@b.com", setError, setIsLoading);

      expect(toast.error).toHaveBeenCalledWith(
        "Oops! Something went wrong... Please try again 🙏"
      );
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  // -------------------- handleGoogleButton --------------------
  describe("handleGoogleButton", () => {
    it("calls getGoogleAuthUrl with provided redirectUri", () => {
      const { result } = renderHook(() => useAuthHandlers());

      const redirectUri = "http://redirect.com";
      result.current.handleGoogleButton(redirectUri);

      expect(getGoogleAuthUrl).toHaveBeenCalledWith(redirectUri);
    });

    it("calls getGoogleAuthUrl with default redirect if none provided", () => {
      const { result } = renderHook(() => useAuthHandlers());

      result.current.handleGoogleButton();

      expect(getGoogleAuthUrl).toHaveBeenCalledWith(undefined);
    });
  });
});
