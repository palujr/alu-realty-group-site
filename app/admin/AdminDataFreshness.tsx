"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const focusRefreshAfterMs = 15000;
const leadOpenRefreshAfterMs = 5000;

function hasDirtyAdminForm() {
  return Boolean(document.querySelector("form[data-admin-dirty='true']"));
}

export function AdminDataFreshness() {
  const router = useRouter();
  const lastRefreshAt = useRef(Date.now());

  useEffect(() => {
    const refreshIfSafe = (minimumAgeMs: number) => {
      if (Date.now() - lastRefreshAt.current < minimumAgeMs || hasDirtyAdminForm()) {
        return;
      }

      lastRefreshAt.current = Date.now();
      router.refresh();
    };

    const markFormDirty = (event: Event) => {
      const form = (event.target as HTMLElement | null)?.closest("form");

      if (form) {
        form.setAttribute("data-admin-dirty", "true");
      }
    };

    const clearFormDirty = (event: Event) => {
      const form = event.target as HTMLFormElement | null;

      if (form?.tagName === "FORM") {
        form.removeAttribute("data-admin-dirty");
      }
    };

    const handleFocus = () => refreshIfSafe(focusRefreshAfterMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfSafe(focusRefreshAfterMs);
      }
    };

    const handleToggle = (event: Event) => {
      const panel = event.target as HTMLDetailsElement | null;

      if (panel?.tagName === "DETAILS" && panel.open && panel.id.startsWith("lead-")) {
        refreshIfSafe(leadOpenRefreshAfterMs);
      }
    };

    document.addEventListener("input", markFormDirty, true);
    document.addEventListener("change", markFormDirty, true);
    document.addEventListener("submit", clearFormDirty, true);
    document.addEventListener("reset", clearFormDirty, true);
    document.addEventListener("toggle", handleToggle, true);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("input", markFormDirty, true);
      document.removeEventListener("change", markFormDirty, true);
      document.removeEventListener("submit", clearFormDirty, true);
      document.removeEventListener("reset", clearFormDirty, true);
      document.removeEventListener("toggle", handleToggle, true);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
