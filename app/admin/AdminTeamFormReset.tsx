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
    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    const getStickyOffset = () => {
      const sectionNav = document.querySelector<HTMLElement>(".admin-section-nav");
      return (sectionNav?.getBoundingClientRect().height || 0) + 28;
    };

    const scrollPanelIntoPlace = (panel: HTMLDetailsElement) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const panelTop = panel.getBoundingClientRect().top + window.scrollY - getStickyOffset();
          window.scrollTo({ top: Math.max(panelTop, 0), behavior: "smooth" });
        });
      });
    };

    const handleTeamPanelToggle = (event: Event) => {
      const panel = event.target as HTMLDetailsElement;

      if (!panel.matches("details.admin-team-edit-panel")) {
        return;
      }

      if (panel.open) {
        const teamPanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details.admin-team-edit-panel"));

        teamPanels.forEach((otherPanel) => {
          if (otherPanel !== panel && otherPanel.open) {
            otherPanel.open = false;
            resetForms(otherPanel);
          }
        });

        window.history.replaceState(null, "", `#${panel.id}`);
        scrollPanelIntoPlace(panel);
        return;
      }

      resetForms(panel);
    };

    document.addEventListener("toggle", handleTeamPanelToggle, true);

    return () => {
      document.removeEventListener("toggle", handleTeamPanelToggle, true);
    };
  }, []);

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
      window.requestAnimationFrame(() => {
        const sectionNav = document.querySelector<HTMLElement>(".admin-section-nav");
        const stickyOffset = (sectionNav?.getBoundingClientRect().height || 0) + 28;
        const panelTop = savedPanel.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top: Math.max(panelTop, 0), behavior: "smooth" });
      });
    });

    return () => window.clearTimeout(hideConfirmation);
  }, [teamSaved, savedTeamMemberId, savedAt]);

  return null;
}
