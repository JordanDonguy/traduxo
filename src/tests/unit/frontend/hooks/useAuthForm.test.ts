/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useAuthHandlers } from "@/lib/client/hooks/useAuthForm";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";

// ---- Mocks ----
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));


// ---- Tests ----
describe("useAuthHandlers", () => {
  let setError: jest.Mock;
  let setIsLoading: jest.Mock;
  let setIsSignup: jest.Mock;

  beforeEach(() => {
    setError = jest.fn();
    setIsLoading = jest.fn();
    setIsSignup = jest.fn();
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("accepts minimum 8 char password", async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleLogin with 8-char password
    await act(async () => {
      await result.current.handleLogin("test@test.com", "12345678", setError, setIsLoading);
    });

    // Step 2: signIn should be called
    expect(signIn).toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("rejects password shorter than 8 characters", async () => {
    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleLogin with a 7-char password
    await act(async () => {
      await result.current.handleLogin("test@test.com", "1234567", setError, setIsLoading);
    });

    // Step 2: setError should be called with the correct validation message
    expect(setError).toHaveBeenCalledWith("Password length must be at least 8 characters");

    // Step 3: signIn should NOT be called
    expect(signIn).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("handles signIn returning res.error", async () => {
    // Step 0: Mock signIn to return an error
    (signIn as jest.Mock).mockResolvedValue({ error: "Invalid credentials" });

    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleLogin
    await act(async () => {
      await result.current.handleLogin("test@test.com", "password123", setError, setIsLoading);
    });

    // Step 2: setError should be called with the error returned by signIn
    expect(setError).toHaveBeenCalledWith("Invalid credentials");

    // Step 3: Loading should be stopped
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });


  // ------ Test 4️⃣ ------
  it("handles signIn throwing an error", async () => {
    (signIn as jest.Mock).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleLogin, error should be caught internally
    await act(async () => {
      await result.current.handleLogin("test@test.com", "password123", setError, setIsLoading);
    });

    // Step 2: setError should be called with user friendly message
    expect(setError).toHaveBeenCalledWith("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");

    // Step 3: Loading should be stopped
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  // ------ Test 5️⃣ ------
  it("rejects confirmPassword < 8 chars", async () => {
    const { result } = renderHook(() => useAuthHandlers());

    await act(async () => {
      await result.current.handleSignup("test@test.com", "password123", "short", setError, setIsSignup);
    });

    // Password length error should be set
    expect(setError).toHaveBeenCalledWith("Passwords length must be at least 8 characters");
  });

  // ------ Test 6️⃣ ------
  it("rejects signup when password and confirmPassword do not match", async () => {
    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleSignup with mismatched passwords
    await act(async () => {
      await result.current.handleSignup(
        "test@test.com",
        "password123",
        "password456",
        setError,
        setIsSignup
      );
    });

    // Step 2: setError should be called with mismatch message
    expect(setError).toHaveBeenCalledWith("Password and confirm password don't match");

    // Step 3: signIn should NOT be called
    expect(signIn).not.toHaveBeenCalled();

    // Step 4: setIsSignup should NOT be toggled
    expect(setIsSignup).not.toHaveBeenCalled();
  });


  // ------ Test 7️⃣ ------
  it("handles API error response", async () => {
    // Mock fetch resolved value to return false, "user exists"
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "User exists" }),
    } as Partial<Response>);

    const { result } = renderHook(() => useAuthHandlers());

    await act(async () => {
      await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup);
    });

    // API error message should be set
    expect(setError).toHaveBeenCalledWith("User exists");

    // signIn should not be called on API failure
    expect(signIn).not.toHaveBeenCalled();
  });

  // ------ Test 8️⃣ ------
  it("handles fetch rejecting", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useAuthHandlers());

    await act(async () => {
      await result.current.handleSignup("test@test.com", "password123", "password123", setError, setIsSignup);
    });

    // Should set friendly error message and not call signIn
    expect(setError).toHaveBeenCalledWith("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
    expect(signIn).not.toHaveBeenCalled();
  });

  // ------ Test 9️⃣ ------
  it("logs error if google signIn fails", async () => {
    // Step 0: Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    // Step 1: Mock signIn to throw
    (signIn as jest.Mock).mockRejectedValue(new Error("Google fail"));

    const { result } = renderHook(() => useAuthHandlers());

    // Step 2: Call handleGoogleButton
    await act(async () => {
      await result.current.handleGoogleButton();
    });

    // Step 3: signIn should still be called with google provider
    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/?login=true" });

    // Step 4: console.error should have been called with the error
    expect(consoleSpy).toHaveBeenCalledWith(
      "Google sign-in failed:",
      expect.any(Error)
    );

    // Step 5: Restore console
    consoleSpy.mockRestore();
  });

  // ------ Test 🔟 ------
  it("logs in and redirects after successful signup", async () => {
    // Step 0: Mock fetch to succeed
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Partial<Response>);

    // Step 1: Mock signIn to succeed
    (signIn as jest.Mock).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuthHandlers());

    // Step 2: Call handleSignup with valid data
    await act(async () => {
      await result.current.handleSignup(
        "test@test.com",
        "password123",
        "password123",
        setError,
        setIsSignup
      );
    });

    // Step 3: signIn should be called with credentials
    expect(signIn).toHaveBeenCalledWith("credentials", {
      callbackUrl: "/?login=true",
      email: "test@test.com",
      password: "password123",
    });

    // Step 4: setIsSignup should be set to false
    expect(setIsSignup).toHaveBeenCalledWith(false);

    // Step 5: setError should not be called
    expect(setError).not.toHaveBeenCalled();
  });

  // ------ Test 1️⃣1️⃣ ------
  it("rejects forgot password when email is empty", async () => {
    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleForgotPassword with empty email
    await act(async () => {
      await result.current.handleForgotPassword("", setError, setIsLoading);
    });

    // Step 2: setError should be called with the empty email message
    expect(setError).toHaveBeenCalledWith("Please enter your email to reset your password");

    // Step 3: setIsLoading should be set to false
    expect(setIsLoading).toHaveBeenCalledWith(false);

    // Step 4: fetch should NOT be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ------ Test 1️⃣2️⃣ ------
  it("handles API returning not-ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Partial<Response>);

    const { result } = renderHook(() => useAuthHandlers());

    await act(async () => {
      await result.current.handleForgotPassword("test@test.com", setError, setIsLoading);
    });

    // Expect a toast.error
    expect(toast.error).toHaveBeenCalledWith("Oops! Something went wrong... Please try again 🙏");
  });

  // ------ Test 1️⃣3️⃣ ------
  it("handles fetch rejecting", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useAuthHandlers());

    await act(async () => {
      await result.current.handleForgotPassword("test@test.com", setError, setIsLoading);
    });

    // Error toast should be displayed
    expect(toast.error).toHaveBeenCalledWith("Oops! Something went wrong... Please try again 🙏");

    // Loading should be stopped
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  // ------ Test 1️⃣4️⃣ ------
  it("successfully sends forgot password email", async () => {
    // Step 0: Mock fetch to succeed
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Partial<Response>);

    const { result } = renderHook(() => useAuthHandlers());

    // Step 1: Call handleForgotPassword with valid email
    await act(async () => {
      await result.current.handleForgotPassword("test@test.com", setError, setIsLoading);
    });

    // Step 2: toast.success should be called
    expect(toast.success).toHaveBeenCalledWith("If this email exists, a reset link has been sent.");

    // Step 4: setIsLoading should be set to false
    expect(setIsLoading).toHaveBeenCalledWith(false);

    // Step 5: setError should remain empty
    expect(setError).toHaveBeenCalledWith("");
  });
});
