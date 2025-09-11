import { toast } from "@traduxo/packages/utils/ui/toast";

const errorMessages: Record<string, string> = {
  NoMailOrPassword: "Please enter an email and a password",
  NoUserFound: "User not found, please sign up",
  NeedToCreatePassword:
    "This account uses Google sign-in. Log in with Google first, then set a password in your profile.",
  PasswordIncorrect: "Password incorrect",
  InvalidInput: "Invalid form input. Please check and try again.",
};

let lastHandled: string = "";

/**
 * Platform-agnostic authentication toasts.
 * @param params - object containing auth params, e.g. { login: true, error: "NoUserFound" }
 * @param cleanCallback - optional function to clean URL/query params (used on Web)
 */
export function showAuthToasts(
  params: Record<string, string | boolean | undefined>,
  cleanCallback?: () => void
) {
  if (!params) return;

  const paramsString = JSON.stringify(params);
  if (lastHandled === paramsString) return; // prevent duplicate toasts
  lastHandled = paramsString;

  const { error, login, logout, delete: accountDeleted, resetPassword } = params;

  let toastShown = false;

  if (error) {
    toast.error(errorMessages[error as string] || "Unknown authentication error.");
    toastShown = true;
  }
  if (login) {
    toast.success("Successfully logged in!");
    toastShown = true;
  }
  if (logout) {
    toast.success("Successfully logged out.");
    toastShown = true;
  }
  if (accountDeleted) {
    toast.success("Account successfully deleted.");
    toastShown = true;
  }
  if (resetPassword) {
    toast.success("Your password has been updated, you can now login.");
    toastShown = true;
  }

  // Only call cleanup if a toast was shown and a cleanCallback function provided
  if (cleanCallback && toastShown) cleanCallback();
}
