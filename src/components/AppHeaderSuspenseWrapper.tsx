"use client";

import { Suspense } from "react";
import AppHeader from "./AppHeader";

export default function AppHeaderSuspenseWrapper() {
  return (
    <Suspense fallback={<div />}>
      <AppHeader />
    </Suspense>
  )
}
