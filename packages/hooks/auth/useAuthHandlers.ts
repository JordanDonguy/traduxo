
import { loginUser } from "@traduxo/packages/utils/auth/login";
import { logoutUser } from "@traduxo/packages/utils/auth/logout";
import { signupUser } from "@traduxo/packages/utils/auth/signup";
import { forgotPasswordRequest } from "@traduxo/packages/utils/auth/forgotPassword";
import { getGoogleAuthUrl } from "@traduxo/packages/utils/auth/googleAuth";
import { getToken, saveToken, clearToken } from "@traduxo/packages/utils/auth/token";

export function useAuthHandlers() {

  // ---- handleLogin ----
  const handleLogin = async (
    email: string,
    password: string,
    setError: (err: string) => void,
    setIsLoading: (loading: boolean) => void,
    refresh: () => Promise<void>
  ): Promise<boolean> => {
    if (password.length < 8) {
      setError("Password length must be at least 8 characters");
      return false;
    }

    setIsLoading(true);
    setError("");

    try {
      const { res, data } = await loginUser(email, password);
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return false;
      }

      saveToken(data.accessToken, data.refreshToken);

      await refresh();
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      setError("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
      return false
    } finally {
      setIsLoading(false);
    }
  };

  // ---- handleLogout ----
  const handleLogout = async (
    refresh: () => Promise<void>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      const tokenData = await getToken();
      if (!tokenData?.token) return false;

      const success = await logoutUser(tokenData.token, tokenData.refreshToken ?? undefined);
      if (!success) return false;

      clearToken();
      await refresh();
      return true;
    } catch (err) {
      console.error("Logout failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ---- handleGoogleButton ----
  const handleGoogleButton = (redirectUri?: string) => {
    if (typeof window === "undefined") return;
    window.location.href = getGoogleAuthUrl(redirectUri);
  };

  // ---- handleSignup ----
  const handleSignup = async (
    email: string,
    password: string,
    confirmPassword: string,
    setIsLoading: (loading: boolean) => void,
    setError: (err: string) => void,
    refresh: () => Promise<void>
  ): Promise<boolean> => {
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password don't match");
      return false;
    }

    try {
      setIsLoading(true);
      setError("");

      const { res, data } = await signupUser(email, password);
      if (!res.ok) {
        setError(data.message || "Signup failed");
        return false;
      }

      // Login immediately after signup
      const { res: loginRes, data: loginData } = await loginUser(email, password);
      if (!loginRes.ok) {
        setError(loginData.error || "Login failed after signup");
        return false;
      }

      saveToken(loginData.accessToken, loginData.refreshToken);
      await refresh();
      return true;
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ---- handleForgotPassword ----
  const handleForgotPassword = async (
    email: string,
    setError: (err: string) => void,
    setIsLoading: (val: boolean) => void
  ) => {
    if (!email) {
      setError("Please enter your email to reset your password");
      setIsLoading(false);
      return ({ success: false })
    }

    setIsLoading(true);
    setError("");

    try {
      const { res, data } = await forgotPasswordRequest(email);
      if (!res.ok) {
        console.log(data.error)
        setError("Oops! Something went wrong... Please try again 🙏");
        return ({ success: false });
      }

      return ({ success: true });
      /* toast.success("If this email exists, a reset link has been sent."); */
    } catch (err) {
      console.error(err);
      setError("Oops! Something went wrong... Please try again 🙏");
      return ({ success: false })
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin,
    handleLogout,
    handleSignup,
    handleGoogleButton,
    handleForgotPassword,
  };
}
