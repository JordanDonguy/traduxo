'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { Mail, Lock } from "lucide-react";

type LoginProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Login({ showMenu, setShowMenu }: LoginProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // -------------- Credentials login --------------
  const handleLogin = async () => {
    if (password.length < 8) {
      setError("Password length must be at least 8 characters");
      return
    };

    setIsLoading(true);

    const res = await signIn("credentials", {
      callbackUrl: "/?login=true",
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setShowMenu(false)
    };
    setIsLoading(false);
  };

  // -------------- Google OAuth login --------------
  const handleGoogleButton = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/?login=true",
      });
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  // -------------- Credentials signup --------------
  const handleSignup = async () => {
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return
    };

    if (password !== confirmPassword) {
      setError("Password and confirm password don't match");
      return
    };

    // Register user to db (api call)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // After successful sign-up, log in user immediately
    await signIn('credentials', {
      callbackUrl: "/?login=true",
      email,
      password
    });

    setShowMenu(false);
    setIsSignup(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (isSignup) handleSignup();
        else handleLogin();
      }}
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}
    >
      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-bold">{isSignup ? "Sign Up" : "Login"}</h1>

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
              id="password"
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
          className="hover:bg-[var(--hover-2)] flex-shrink-0 border border-zinc-400 bg-[var(--btn)] hover:cursor-pointer rounded-full h-12 flex items-center justify-center"
        >
          {isSignup ? "Sign Up" : "Sign In"}
        </button>

        {/* Google OAuth button */}
        <button
          id="google-btn"
          type="button"
          onClick={handleGoogleButton}
          className="relative flex flex-shrink-0 items-center justify-start h-14 px-4 rounded-full border border-zinc-400 bg-[var(--btn)] hover:bg-[var(--hover-2)] hover:cursor-pointer"
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

        {/* -------------- Sign Up / Login switch -------------- */}
        <p className="text-center">
          {isSignup ? "Already have an account? " : "No account? "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-500 hover:cursor-pointer pb-10"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </form >
  )
}
