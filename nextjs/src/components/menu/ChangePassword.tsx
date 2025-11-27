"use client";

import { useState } from "react";
import { useChangePassword } from "@traduxo/packages/hooks/auth/useChangePassword";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type ChangePasswordProps = {
  isCredentials: boolean | undefined;
  showMenu: boolean
}

export default function ChangePassword({ isCredentials, showMenu }: ChangePasswordProps) {
  const router = useRouter();

  const { isLoading, error, handleSubmit } = useChangePassword({
    isCredentials,
    onSuccess: (msg) => {
      toast.success(msg);
      router.push("/");
    },
    onError: (msg) => toast.error(msg),
  });

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  return (
    <form
      id="change-password-form"
      aria-label={isCredentials ? "Change password form" : "Create password form"}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({ currentPassword, password, confirmPassword });
      }}
      className={`
        w-full mx-auto flex flex-col text-[var(--text-color)] pb-6
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200 overflow-y-auto scrollbar-hide
        `}
    >
      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        <div className="fixed pb-28 inset-0 bg-[var(--menu)] bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-medium">{isCredentials ? "Change password" : "Create password"}</h1>

        {/* -------------- Display error if any -------------- */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* -------------- Current password input -------------- */}
        {isCredentials ? (
          <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl shadow-md">
            <label htmlFor="current-password" className="flex items-center gap-2">
              <Lock />
              <span className="text-xl">Current password</span>
            </label>
            <input
              type="password"
              id="current-password"
              name="current-password"
              aria-label="Current password"
              placeholder="********"
              className="bg-[var(--bg)] p-4 w-full rounded-md focus:outline-none"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        ) : null}

        {/* -------------- Password input -------------- */}
        <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl shadow-md">
          <label htmlFor="password" className="flex items-center gap-2">
            <Lock />
            <span className="text-xl">{isCredentials ? "New password" : "Password"}</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            aria-label="Password"
            placeholder="********"
            className="bg-[var(--bg)] p-4 w-full rounded-md focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* -------------- Confirm password input -------------- */}
        <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl shadow-md">
          <label htmlFor="confirm-password" className="flex items-center gap-2">
            <Lock />
            <span className="text-xl">Confirm password</span>
          </label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            aria-label="Confirm password"
            placeholder="********"
            className="bg-[var(--bg)] p-4 w-full rounded-md focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* -------------- Submit button -------------- */}
        <button
          id="change-password-button"
          aria-label={isCredentials ? "Change password" : "Create password"}
          disabled={isLoading}
          type="submit"
          className="text-[var(--blue-1)] hover-1 flex-shrink-0 border border-[var(--gray-2)] shadow-md rounded-full h-12 flex items-center justify-center"
        >
          {isCredentials ? "Change password" : "Create password"}
        </button>

      </div>
    </form >
  )
}
