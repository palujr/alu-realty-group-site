"use client";

import { useEffect } from "react";

export function AdminTeamFormReset({
  teamSaved,
  savedTeamMemberId
}: {
  teamSaved: boolean;
  savedTeamMemberId?: string;
}) {
  useEffect(() => {
    if (!teamSaved || !savedTeamMemberId) {
      return;
    }

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
  }, [teamSaved, savedTeamMemberId]);

  return null;
}
