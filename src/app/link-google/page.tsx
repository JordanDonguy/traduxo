"use client"

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import AppHeader from "@/components/AppHeader";
import { Mail, Lock } from "lucide-react";

export default function Home() {
  const { error, setError } = useApp();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit() {
    setError("");
    setIsLoading(true);

    if (!email.length || !password.length) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/google-linking", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong... Please try again later");
        setIsLoading(false);
        return;
      }

      // Sign in with credentials after linking
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/?login=true",
      });
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setError("Something went wrong... Please try again later");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full bg-[var(--bg)]">

      <AppHeader />

      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      {/* -------------- Main -------------- */}
      <main className={`flex flex-col justify-center items-center w-full flex-1 max-w-xl gap-4 ${isLoading ? "opacity-60" : "opacity-100"}`}>
        <p className="text-xl">Oups... 😰</p>
        <p className="text-center text-xl">It looks like your account is already registered using email and password.</p>
        <p className="text-center text-xl mb-4">If you want to add Google sign in method, please enter your email and password below.</p>

        {/* -------------- Display error if any -------------- */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* -------------- Form -------------- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col w-full items-center justify-center gap-4"
        >

          {/* -------------- Email input -------------- */}
          <div className="w-full flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
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
              className="bg-[var(--menu)] p-4 w-full rounded-md focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* -------------- Submit button -------------- */}
          <button
            type="submit"
            className="w-full hover:bg-[var(--hover-2)] flex-shrink-0 border border-[var(--border)] bg-[var(--menu)] hover:cursor-pointer rounded-full h-12 flex items-center justify-center"
          >
            Link Google Account
          </button>

        </form>
      </main>
    </div>
  );
}
