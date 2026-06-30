"use client";

import { useCallback, useEffect } from "react";

export function AdminTeamFormReset({
  teamSaved,
  savedTeamMemberId,
  savedAt,
  teamDeleted,
  deletedAt
}: {
  teamSaved: boolean;
  savedTeamMemberId?: string;
  savedAt?: string;
  teamDeleted?: boolean;
  deletedAt?: string;
}) {
  const getStickyOffset = useCallback(() => {
    const sectionNav = document.querySelector<HTMLElement>(".admin-section-nav");
    return (sectionNav?.getBoundingClientRect().height || 0) + 28;
  }, []);

  const scrollElementIntoPlace = useCallback((element: HTMLElement) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const elementTop = element.getBoundingClientRect().top + window.scrollY - getStickyOffset();
        window.scrollTo({ top: Math.max(elementTop, 0), behavior: "smooth" });
      });
    });
  }, [getStickyOffset]);

  useEffect(() => {
    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    const scrollPanelIntoPlace = (panel: HTMLDetailsElement) => {
      scrollElementIntoPlace(panel);
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
  }, [scrollElementIntoPlace]);

  useEffect(() => {
    if (!teamDeleted) {
      return;
    }

    document.querySelectorAll<HTMLDetailsElement>("details.admin-team-edit-panel").forEach((panel) => {
      panel.open = false;
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    });

    const teamMembers = document.querySelector<HTMLElement>("#team-members");
    if (!teamMembers) {
      return;
    }

    window.history.replaceState(null, "", "#team-members");
    scrollElementIntoPlace(teamMembers);
  }, [teamDeleted, deletedAt, scrollElementIntoPlace]);

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
    scrollElementIntoPlace(savedPanel);

    return () => window.clearTimeout(hideConfirmation);
  }, [teamSaved, savedTeamMemberId, savedAt, scrollElementIntoPlace]);

  return null;
}
