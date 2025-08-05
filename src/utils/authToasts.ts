'use client';

import { toast } from "react-toastify";

interface Router {
  replace(url: string, options?: { scroll?: boolean }): void | Promise<void>;
}

const errorMessages: Record<string, string> = {
  NoMailOrPassword: "Please enter an email and a password",
  NoUserFound: "User not found, please sign up",
  NeedToCreatePassword: "This account uses Google sign-in. Log in with Google first, then set a password in your profile.",
  PasswordIncorrect: "Password incorrect",
  NeedGoogleLinking: "Email already registered. Log in with password, then link Google from your profile.",
  InvalidInput: "Invalid form input. Please check and try again."
};

export function showAuthToasts(router: Router) {
  if (typeof window === 'undefined') return;

  // Get url params
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const login = params.get('login');
  const logout = params.get('logout');
  let shouldClean = false;

  // Display error toast
  if (typeof error === 'string') {
    const message = errorMessages[error] || 'Unknown authentication error.';
    toast.error(message);
    shouldClean = true;
  }

  // Display login toast
  if (login === 'true') {
    toast.success('Successfully logged in!');
    shouldClean = true;
  }

  // Display logout toast
  if (logout === 'true') {
    toast.success('Successfully logged out.');
    shouldClean = true;
  }

  // Cleanup url
  if (shouldClean) {
    const url = new URL(window.location.href);
    url.search = '';
    router.replace(url.toString());
  }
}
