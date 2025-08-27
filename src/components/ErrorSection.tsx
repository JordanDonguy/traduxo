"use client"

import { useEffect } from "react";
import { useCooldown } from "@/lib/client/hooks/useCooldown";
import { useApp } from "@/context/AppContext";

type ErrorSectionProps = {
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

function ErrorSection({error, setError}: ErrorSectionProps) {
  const { setShowLoginForm } = useApp();
  const cooldown = useCooldown(error.startsWith("Too many requests"));  // Starts a cooldown if rateLimiter error

  // Reset error state when cooldown arrives at 0 if rateLimiting error
  useEffect(() => {
    if (cooldown === 0 && error.startsWith("Too many requests")) {
      setError("")
    }
  }, [cooldown, error, setError]);

  return (
    <div className={`mt-12 max-w-[96%] sm:max-w-xl lg:max-w-3xl  flex flex-col ${error.startsWith("To continue using") ? "gap-8" : "gap-2"}`}>
      <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">{error}</p>

      {error.startsWith("To continue using") && (
        <button
          onClick={() => setShowLoginForm(true)} 
          className="hover:bg-[var(--hover-2)] hover:cursor-pointer border border-[var(--border)] rounded-full h-12 flex items-center justify-center mx-2 md:mx-0"
        >
          Login
        </button>
      )}

      {(cooldown && cooldown > 0) && (
        <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">
          Try again in 0:{String(cooldown).padStart(2, "0")} 🙏
        </p>
      )}
    </div>
  );
}

export default ErrorSection;
