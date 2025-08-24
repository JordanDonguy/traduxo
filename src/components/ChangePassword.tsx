"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";

type ChangePasswordProps = {
  isCredentials: boolean | undefined;
  showMenu: boolean
}

export default function ChangePassword({ isCredentials, showMenu }: ChangePasswordProps) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { update } = useSession();

  // -------------- Change / create password --------------
  const handleSubmit = async () => {
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return
    };

    if (password !== confirmPassword) {
      setError("New password and confirm password don't match");
      return
    };

    setIsLoading(true);           // to display a loading spinner

    // Fetch either update or create password route depending if user already has a password or not
    const res = isCredentials ? (
      // ----------- Update password -----------
      await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword, password })
      })
    ) : (
      // ----------- Or create password -----------
      await fetch("/api/auth/create-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      })
    );

    // If error, display it
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || `Error while ${isCredentials ? "udpating" : "creating"} your password`);
      setIsLoading(false);
      return
    };

    // If successful, reset password inputs and display toast success
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    toast.success(`Your password has been ${isCredentials ? "updated" : "created"}`);

    // Close menu and reset loading state
    router.push("/");
    setIsLoading(false);

    // Update next auth session state
    await update();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
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
            id="password"
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
