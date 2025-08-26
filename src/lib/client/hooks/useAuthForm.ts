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

    // ---- step 5: stop loading ----
    setIsLoading(false);
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

    // ---- step 6: redirect user ----
    router.push("/");
    setIsSignup(false);
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
      return;
    }

    // ---- step 2: set loading + reset error ----
    setIsLoading(true);
    setError("");

    try {
      // ---- step 3: call reset API ----
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // ---- step 4: notify user ----
      toast.success("If this email exists, a reset link has been sent.");
      router.replace("/");
    } catch (err) {
      // ---- step 5: handle error ----
      console.error(err);
      toast.error("Something went wrong.");
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
