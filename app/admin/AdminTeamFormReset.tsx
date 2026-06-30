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
  }, [teamSaved, savedTeamMemberId]);

  return null;
}
