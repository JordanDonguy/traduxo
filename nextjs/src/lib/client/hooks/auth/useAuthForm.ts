"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function useAuthHandlers() {
  const router = useRouter();

  // ---- handleLogin ----
  const handleLogin = async (
    email: string,
    password: string,
    setError: (err: string) => void,
    setIsLoading: (loading: boolean) => void,
    refresh: () => Promise<void>,
  ) => {
    if (password.length < 8) {
      setError("Password length must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/jwt-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      // ---- store tokens ----
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // ---- redirect ----
      await refresh();
      router.push("/?login=true");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (
    refresh: () => Promise<void>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      // Call logout API
      const res = await fetch("/api/auth/jwt-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      // Clear tokens from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      await refresh();
      router.push("/?logout=true");
    } catch (err) {
      console.error("Logout failed:", err);
      return false;
    } finally {
      setIsLoading(false)
    }
  }

  // ---- handleGoogleButton ----
  const handleGoogleButton = async () => {
    try {
      // ---- step 1: start OAuth sign in ----
      await signIn("google", { callbackUrl: "/?login=true" });
    } catch (err) {
      // ---- step 2: log error if sign in fails ----
      console.error("Google sign-in failed:", err);
    }
  };

  // ---- handleSignup ----
  const handleSignup = async (
    email: string,
    password: string,
    confirmPassword: string,
    setError: (err: string) => void,
    setIsSignup: (val: boolean) => void,
    refresh: () => Promise<void>,
  ) => {
    // Step 1: validate passwords
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password don't match");
      return;
    }

    try {
      // Step 2: register user
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // Step 3: immediately login using JWT endpoint
      const loginRes = await fetch("/api/auth/jwt-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError(loginData.error || "Login failed after signup");
        return;
      }

      // Step 4: store tokens
      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("refreshToken", loginData.refreshToken);

      // Step 5: refresh auth context & redirect
      await refresh();
      router.push("/?login=true");

      setIsSignup(false);
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
    }
  };

  // ---- handleForgotPassword ----
  const handleForgotPassword = async (
    email: string,
    setError: (err: string) => void,
    setIsLoading: (val: boolean) => void
  ) => {
    // ---- step 1: check email is provided ----
    if (!email) {
      setError("Please enter your email to reset your password");
      setIsLoading(false);
      return;
    }

    // ---- step 2: set loading + reset error ----
    setIsLoading(true);
    setError("");

    try {
      // ---- step 3: call reset API ----
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      // ---- step 4: notify user ----
      if (!res.ok) {
        toast.error(data.error || "Oops! Something went wrong... Please try again 🙏");
        return;
      };

      toast.success("If this email exists, a reset link has been sent.");
    } catch (err) {
      // ---- step 5: handle error ----
      console.error(err);
      toast.error("Oops! Something went wrong... Please try again 🙏");
    }

    // ---- step 6: stop loading ----
    setIsLoading(false);
  };

  return {
    handleLogin,
    handleLogout,
    handleSignup,
    handleGoogleButton,
    handleForgotPassword,
  };
}
