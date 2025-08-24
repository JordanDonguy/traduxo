"use client";

import { Suspense } from "react";
import AppHeader from "./AppHeader";

export default function AppHeaderSuspenseWrapper() {
  return (
    <Suspense fallback={<div className="z-50 fixed w-full max-w-6xl h-12 bg-[var(--bg-2)] rounded-b-4xl shadow-sm "/>}>
      <AppHeader />
    </Suspense>
  )
}
