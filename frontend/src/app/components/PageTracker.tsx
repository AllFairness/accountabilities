"use client";
import { useEffect } from "react";

export function PageTracker({ path }: { path: string }) {
  useEffect(() => {
    const referrer = document.referrer || "";

    const prev = parseInt(localStorage.getItem("visit_count") ?? "0", 10);
    const visitCount = prev + 1;
    localStorage.setItem("visit_count", String(visitCount));

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "access", data: { path, referrer, visitCount } }),
    }).catch(() => {});
  }, [path]);
  return null;
}
