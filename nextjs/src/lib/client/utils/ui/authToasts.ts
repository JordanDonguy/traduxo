"use client";

import { toast } from "react-toastify";

interface Router {
  replace(url: string, options?: { scroll?: boolean }): void | Promise<void>;
}

const errorMessages: Record<string, string> = {
  NoMailOrPassword: "Please enter an email and a password",
  NoUserFound: "User not found, please sign up",
  NeedToCreatePassword:
    "This account uses Google sign-in. Log in with Google first, then set a password in your profile.",
  PasswordIncorrect: "Password incorrect",
  InvalidInput: "Invalid form input. Please check and try again.",
};

let lastHandled: string = "";

export function showAuthToasts(router: Router) {
  if (typeof window === "undefined") return;

  // Always use a URL instance (works better in tests)
  const url = new URL(window.location.toString());
  const paramsString = url.search;

  // Prevent double toasts for same params
  if (lastHandled === paramsString) return;
  lastHandled = paramsString;

  const error = url.searchParams.get("error");
  const login = url.searchParams.get("login");
  const logout = url.searchParams.get("logout");
  const accountDeleted = url.searchParams.get("delete");
  const resetPassword = url.searchParams.get("reset-password");

  let shouldClean = false;

  // Display error toast
  if (error) {
    const message = errorMessages[error] || "Unknown authentication error.";
    toast.error(message);
    shouldClean = true;
  }

  // Display login toast
  if (login === "true") {
    toast.success("Successfully logged in!");
    shouldClean = true;
  }

  // Display logout toast
  if (logout === "true") {
    toast.success("Successfully logged out.");
    shouldClean = true;
  }

  // Display account deleted toast
  if (accountDeleted === "true") {
    toast.success("Accound successfully deleted.");
    shouldClean = true;
  }

  // Display reset password toast
  if (resetPassword === "true") {
    toast.success("Your password has been updated, you can now login.");
    shouldClean = true;
  }

  // Cleanup url
  if (shouldClean) {
    url.search = "";
    router.replace(url.toString());
  }
}
