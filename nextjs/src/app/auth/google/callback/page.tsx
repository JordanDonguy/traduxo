"use client";

import { Suspense } from "react";
import { useGoogleCallback } from "@traduxo/packages/hooks/auth/useGoogleCallback";

function GoogleCallbackContent() {
  useGoogleCallback({});

  return (
    <div className="bg-[var(--bg)] flex flex-col items-center justify-center h-screen gap-8">
      <p className="text-3xl text-center text-[var(--text)]">
        Signing you in with Google...
      </p>
      <div className="bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
        <div className="spinner relative! w-16! h-16! border-4!" />
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<p className="text-[var(--text)]">Loading...</p>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
