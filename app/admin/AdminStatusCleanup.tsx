"use client";

import { useEffect } from "react";

const statusParams = [
  "bannerStatus",
  "bannerId",
  "leadStatus",
  "leadId",
  "teamStatus",
  "teamMemberId",
  "testimonialStatus",
  "testimonialId"
];

export function AdminStatusCleanup({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const url = new URL(window.location.href);
      statusParams.forEach((param) => url.searchParams.delete(param));

      const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, "", cleanUrl);

      document.querySelectorAll("[data-admin-status='saved']").forEach((element) => {
        element.setAttribute("hidden", "true");
      });
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [active]);

  return null;
}
