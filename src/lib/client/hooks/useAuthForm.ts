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
    setIsLoading: (loading: boolean) => void
  ) => {
    // ---- step 1: validate password length ----
    if (password.length < 8) {
      setError("Password length must be at least 8 characters");
      return;
    }

    // ---- step 2: set loading ----
    setIsLoading(true);

    try {
      // ---- step 3: attempt sign in ----
      const res = await signIn("credentials", {
        callbackUrl: "/?login=true",
        email,
        password,
      });

      // ---- step 4: handle success or error ----
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
    } finally {
      // ---- step 5: stop loading ----
      setIsLoading(false);
    }
  };

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
    setIsSignup: (val: boolean) => void
  ) => {
    // ---- step 1: validate password length ----
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return;
    }

    // ---- step 2: check passwords match ----
    if (password !== confirmPassword) {
      setError("Password and confirm password don't match");
      return;
    }

    try {
      // ---- step 3: register user to db ----
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // ---- step 4: handle API error ----
      if (!res.ok) {
        setError(data.error);
        return;
      }

      // ---- step 5: login after successful signup ----
      await signIn("credentials", {
        callbackUrl: "/?login=true",
        email,
        password,
      });

      // ---- step 5: reset isSignup state ----
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
    handleSignup,
    handleGoogleButton,
    handleForgotPassword,
  };
}
