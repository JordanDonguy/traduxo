"use client";

import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

// Injected dependencies for testing
type UseWaitForAuthStatusArgs = {
  sessionHook?: () => AuthContextType;
  intervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
};

export function useWaitForAuthStatus({
  sessionHook = useAuth,
  intervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: UseWaitForAuthStatusArgs = {}) {
  // ---- Step 1: Get NextAuth session status ----
  const { status } = sessionHook();

  // ---- Step 2: Track if the auth status is ready (not loading) ----
  const [ready, setReady] = useState(status !== "loading");

  // ---- Step 3: Keep latest status in a ref for interval checks ----
  const statusRef = useRef(status);
  statusRef.current = status;

  // ---- Step 4: Update ready state when status changes ----
  useEffect(() => {
    if (status !== "loading") setReady(true);
  }, [status]);

  // ---- Step 5: Promise-based function to wait until auth status is ready ----
  const waitForStatus = () =>
    new Promise<void>((resolve) => {
      // If already ready, resolve immediately
      if (ready) {
        resolve();
        return;
      }

      // Otherwise, poll every 50ms until status is no longer loading
      const interval = intervalFn(() => {
        if (statusRef.current !== "loading") {
          clearIntervalFn(interval); // Stop polling
          resolve();                 // Resolve promise
        }
      }, 50);
    });

  // ---- Step 6: Return the API ----
  return { waitForStatus, ready, status };
}
