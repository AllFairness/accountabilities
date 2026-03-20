"use client";
import { useEffect } from "react";

export function PageTracker({ path }: { path: string }) {
  useEffect(() => {
    const referrer = document.referrer || "";
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "access", data: { path, referrer } }),
    }).catch(() => {});
  }, [path]);
  return null;
}
