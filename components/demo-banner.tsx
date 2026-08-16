"use client";

import { operationsApi } from "@/lib/operations-api";

export function DemoBanner({ children }: { children: React.ReactNode }) {
  function reset() {
    operationsApi.resetDemo();
    window.location.reload();
  }

  return <div className="demo-banner"><span>{children}</span><button onClick={reset}>Reset demo</button></div>;
}
