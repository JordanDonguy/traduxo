"use client"

import { useState, useEffect } from "react";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const { error, setError } = useApp();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Grab token from URL on client side
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  // Update password function
  async function handleSubmit() {
    setError("");
    setIsLoading(true);

    if (!password.length || !confirmPassword.length) {
      setError("Please enter both password and confirm password.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password don't match.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid token");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ password, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong... Please try again later");
        setIsLoading(false);
        return;
      }

      router.push("/?reset-password=true");
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setError("Something went wrong... Please try again later");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full overflow-y-scroll max-h-screen">

      {/* -------------- Loading spinner -------------- */}
      {isLoading && (
        <div className="fixed inset-0 bg-(var[--bg]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      )}

      <main className={`flex flex-col justify-center items-center w-full flex-1 max-w-xl gap-8 px-2 md:px-0 pt-16 pb-4 ${isLoading ? "opacity-60" : "opacity-100"}`}>
        <p className="text-xl text-center">Please enter your new password here:</p>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col w-full items-center justify-center gap-6"
        >

          {/* -------------- Password input -------------- */}
          <div className="w-full flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
            <label htmlFor="password" className="flex items-center gap-2">
              <Lock />
              <span className="text-xl">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="********"
              className="bg-[var(--bg)] p-4 w-full rounded-md focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* -------------- Confirm password input -------------- */}
          <div className="w-full flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
            <label htmlFor="confirm-password" className="flex items-center gap-2">
              <Lock />
              <span className="text-xl">Confirm password</span>
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              placeholder="********"
              className="bg-[var(--bg)] p-4 w-full rounded-md focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* -------------- Submit button -------------- */}
          <button
            type="submit"
            className="w-full mt-4 hover-1 flex-shrink-0 border border-[var(--gray-1)] bg-[var(--bg-2)]/70 rounded-full h-12 flex items-center justify-center"
          >
            Change password
          </button>
        </form>
      </main>
    </div>
  );
}
