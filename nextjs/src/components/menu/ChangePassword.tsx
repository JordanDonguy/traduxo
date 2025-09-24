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
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({ currentPassword, password, confirmPassword });
      }}
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)] pb-6
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200 overflow-y-auto scrollbar-hide
        `}
    >
      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-medium">{isCredentials ? "Change password" : "Create password"}</h1>

        {/* -------------- Display error if any -------------- */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* -------------- Current password input -------------- */}
        {isCredentials ? (
          <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
            <label htmlFor="current-password" className="flex items-center gap-2">
              <Lock />
              <span className="text-xl">Current password</span>
            </label>
            <input
              type="password"
              id="current-password"
              name="current-password"
              placeholder="********"
              className="bg-[var(--menu)] p-4 w-full rounded-md focus:outline-none"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        ) : null}

        {/* -------------- Password input -------------- */}
        <div className="flex flex-col gap-3 bg-[var(--bg-2)] px-4 py-6 md:px-6 rounded-xl">
          <label htmlFor="password" className="flex items-center gap-2">
            <Lock />
            <span className="text-xl">{isCredentials ? "New password" : "Password"}</span>
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

        {/* -------------- Submit button -------------- */}
        <button
          type="submit"
          className="hover:bg-[var(--hover-2)] flex-shrink-0 border border-[var(--border)] bg-[var(--menu)] hover:cursor-pointer rounded-full h-12 flex items-center justify-center"
        >
          {isCredentials ? "Change password" : "Create password"}
        </button>

      </div>
    </form >
  )
}
