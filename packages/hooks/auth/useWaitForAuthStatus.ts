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
}: UseWaitForAuthStatusArgs) {
  // ---- Step 1: Get NextAuth session status ----
  const { status, refresh } = sessionHook();

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
  const waitForStatus = (timeout = 5000) =>
    new Promise<void>((resolve, reject) => {
      // If already ready, resolve immediately
      if (ready) {
        resolve();
        return;
      }

      // Timeout to prevent infinite waiting
      const timer = setTimeout(() => {
        clearIntervalFn(interval);
        reject(new Error("Auth status timeout"));
      }, timeout);

      // Poll every 200ms and refresh auth status
      const interval = intervalFn(async () => {
        await refresh();

        if (statusRef.current !== "loading") {
          clearIntervalFn(interval);  // Stop polling
          clearTimeout(timer);
          resolve();                  // Resolve promise
        }
      }, 200);
    });

  // ---- Step 6: Return the API ----
  return { waitForStatus, ready, status };
}
