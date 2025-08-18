"use client"

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function useWaitForAuthStatus() {
  const { status } = useSession();
  const [ready, setReady] = useState(status !== "loading");

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (status !== "loading") {
      setReady(true);
    }
  }, [status]);

  const waitForStatus = () =>
    new Promise<void>((resolve) => {
      if (ready) {
        resolve();
        return;
      }
      const interval = setInterval(() => {
        if (statusRef.current !== "loading") {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

  return { waitForStatus, ready, status };
}
