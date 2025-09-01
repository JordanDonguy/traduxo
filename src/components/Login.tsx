"use client";

import { useState } from "react";
import { useAuthHandlers } from "@/lib/client/hooks/useAuthForm";
import Image from "next/image";
import { Lock, Mail } from "lucide-react";

interface LoginProps {
  showMenu: boolean
}

export default function Login({ showMenu }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const { handleLogin, handleSignup, handleGoogleButton, handleForgotPassword } = useAuthHandlers();

  return (
    <form
      data-testid="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (isSignup) handleSignup(email, password, confirmPassword, setError, setIsSignup);
        else handleLogin(email, password, setError, setIsLoading);
      }}
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}
    >
      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-[var(--menu)] bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      <h1 data-testid="title" className="text-2xl text-center font-medium pb-6">{isSignup ? "Sign Up" : "Login"}</h1>

      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"} overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide`}>


        {/* -------------- Display error if any -------------- */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* -------------- Email input -------------- */}
        <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
          <label htmlFor="email" className="flex items-center gap-2">
            <Mail />
            <span className="text-xl">Email</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            className="bg-[var(--menu)] p-4 w-full rounded-md focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* -------------- Password input -------------- */}
        <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
          <label htmlFor="password" className="flex items-center gap-2">
            <Lock />
            <span className="text-xl">Password</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="********"
            className="bg-[var(--menu)] p-4 w-full rounded-md focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* -------------- Confirm password input -------------- */}
        {isSignup ? (
          <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
            <label htmlFor="confirm-password" className="flex items-center gap-2">
              <Lock />
              <span className="text-xl">Confirm password</span>
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              placeholder="********"
              className="bg-[var(--menu)] p-4 w-full rounded-md focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        ) : null}

        {/* -------------- Submit button -------------- */}
        <button
          type="submit"
          className="hover:bg-[var(--hover-2)] flex-shrink-0 border border-[var(--border)] bg-[var(--menu)] hover:cursor-pointer rounded-full h-12 flex items-center justify-center"
        >
          {isSignup ? "Sign Up" : "Sign In"}
        </button>

        {/* Google OAuth button */}
        <button
          id="google-btn"
          type="button"
          onClick={handleGoogleButton}
          className="relative flex flex-shrink-0 items-center justify-start h-14 px-4 rounded-full border border-[var(--border)] bg-[var(--menu)] hover:bg-[var(--hover-2)] hover:cursor-pointer"
        >
          <Image
            src="/google-logo.webp"
            alt="google-logo"
            width={40}
            height={40}
            className="absolute left-4"
          />
          <p className="text-base mx-auto">Continue with Google</p>
        </button>

        {/* -------------- Forgot your password button -------------- */}
        {!isSignup && (
          <button
            type="button"
            onClick={() => handleForgotPassword(email, setError, setIsLoading)}
            className="text-blue-500 hover:underline hover:cursor-pointer"
          >
            Forgot your password?
          </button>
        )}

        {/* -------------- Sign Up / Login switch -------------- */}
        <p className="text-center">
          {isSignup ? "Already have an account? " : "No account? "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-500 hover:underline hover:cursor-pointer pb-10"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </form >
  )
}
