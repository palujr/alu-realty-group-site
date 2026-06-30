"use client";

import { useEffect } from "react";

const statusParams = [
  "siteStatus",
  "siteSection",
  "siteError",
  "bannerStatus",
  "bannerId",
  "leadStatus",
  "leadId",
  "leadActivityStatus",
  "teamStatus",
  "teamMemberId",
  "teamSavedAt",
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

      document.querySelectorAll("[data-admin-status]").forEach((element) => {
        element.setAttribute("hidden", "true");
      });
    }, 7000);

    return () => window.clearTimeout(timeout);
  }, [active]);

  return null;
}
