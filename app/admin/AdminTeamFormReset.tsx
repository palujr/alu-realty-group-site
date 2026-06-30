"use client";

import { useEffect } from "react";

export function AdminTeamFormReset({
  teamSaved,
  savedTeamMemberId,
  savedAt
}: {
  teamSaved: boolean;
  savedTeamMemberId?: string;
  savedAt?: string;
}) {
  useEffect(() => {
    if (!teamSaved || !savedTeamMemberId) {
      return;
    }

    document.querySelectorAll("[data-team-save-confirmation='true']").forEach((element) => {
      element.removeAttribute("hidden");
    });

    const hideConfirmation = window.setTimeout(() => {
      document.querySelectorAll("[data-team-save-confirmation='true']").forEach((element) => {
        element.setAttribute("hidden", "true");
      });
    }, 7000);

    const createPanel = document.querySelector<HTMLDetailsElement>("#new-team-member");
    createPanel?.querySelector<HTMLFormElement>("form")?.reset();
    if (createPanel) {
      createPanel.open = false;
    }

    const savedPanel = document.querySelector<HTMLDetailsElement>(`#team-member-${savedTeamMemberId}`);
    if (!savedPanel) {
      return;
    }

    savedPanel.open = true;

    window.requestAnimationFrame(() => {
      savedPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(hideConfirmation);
  }, [teamSaved, savedTeamMemberId, savedAt]);

  return null;
}
