"use client";

import { useEffect } from "react";

export function AdminLeadFormReset({
  activitySaved,
  activityUpdated,
  savedLeadId
}: {
  activitySaved: boolean;
  activityUpdated: boolean;
  savedLeadId?: string;
}) {
  useEffect(() => {
    if (!activitySaved || !savedLeadId) {
      return;
    }

    const activityForm = document.querySelector<HTMLFormElement>(`form[data-activity-form="${savedLeadId}"]`);

    activityForm?.reset();
    activityForm?.closest<HTMLDetailsElement>("details[data-activity-create-panel='true']")?.removeAttribute("open");
  }, [activitySaved, savedLeadId]);

  useEffect(() => {
    if (!activityUpdated || !savedLeadId) {
      return;
    }

    document.querySelectorAll<HTMLDetailsElement>(`#lead-${savedLeadId} details[data-activity-edit-panel='true']`).forEach((panel) => {
      panel.open = false;
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    });
  }, [activityUpdated, savedLeadId]);

  useEffect(() => {
    const leadPanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-reset-on-close='true']"));
    const leadLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-open-lead-panel='true']"));
    const activityPanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']"));
    const activityTaskLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-open-activity-panel='true']"));

    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    const closeOtherActivityPanels = (targetPanel: HTMLDetailsElement) => {
      const timelinePanel = targetPanel.closest(".admin-timeline-panel");

      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']").forEach((panel) => {
        if (panel !== targetPanel && panel.open) {
          panel.open = false;
          panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
        }
      });
    };

    const openActivityPanel = (targetPanel: HTMLDetailsElement) => {
      const parentLeadPanel = targetPanel.closest<HTMLDetailsElement>("details[data-reset-on-close='true']");

      if (parentLeadPanel && !parentLeadPanel.open) {
        parentLeadPanel.open = true;
      }

      closeOtherActivityPanels(targetPanel);
      targetPanel.open = true;
      window.history.replaceState(null, "", `#${targetPanel.id}`);

      window.requestAnimationFrame(() => {
        targetPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    const handleLeadPanelToggle = (event: Event) => {
      const panel = event.currentTarget as HTMLDetailsElement;

      if (panel.open) {
        leadPanels.forEach((otherPanel) => {
          if (otherPanel !== panel && otherPanel.open) {
            otherPanel.open = false;
            resetForms(otherPanel);
          }
        });
        return;
      }

      resetForms(panel);
    };

    leadPanels.forEach((panel) => panel.addEventListener("toggle", handleLeadPanelToggle));

    const handleActivityPanelToggle = (event: Event) => {
      const panel = event.currentTarget as HTMLDetailsElement;

      if (panel.open) {
        closeOtherActivityPanels(panel);
      }
    };

    activityPanels.forEach((panel) => panel.addEventListener("toggle", handleActivityPanelToggle));

    const openLeadPanel = (event: MouseEvent) => {
      const link = event.currentTarget as HTMLAnchorElement;
      const targetHash = link.getAttribute("href");

      if (!targetHash?.startsWith("#lead-")) {
        return;
      }

      const targetPanel = document.querySelector<HTMLDetailsElement>(targetHash);

      if (!targetPanel) {
        return;
      }

      event.preventDefault();

      leadPanels.forEach((panel) => {
        if (panel !== targetPanel && panel.open) {
          panel.open = false;
          resetForms(panel);
        }
      });

      targetPanel.open = true;
      window.history.replaceState(null, "", targetHash);

      window.requestAnimationFrame(() => {
        targetPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    leadLinks.forEach((link) => link.addEventListener("click", openLeadPanel));

    const openLinkedActivityPanel = (event: MouseEvent) => {
      const link = event.currentTarget as HTMLAnchorElement;
      const targetHash = link.getAttribute("href");

      if (!targetHash?.startsWith("#activity-")) {
        return;
      }

      const targetPanel = document.querySelector<HTMLDetailsElement>(targetHash);

      if (!targetPanel) {
        return;
      }

      event.preventDefault();
      openActivityPanel(targetPanel);
    };

    activityTaskLinks.forEach((link) => link.addEventListener("click", openLinkedActivityPanel));

    return () => {
      leadPanels.forEach((panel) => panel.removeEventListener("toggle", handleLeadPanelToggle));
      activityPanels.forEach((panel) => panel.removeEventListener("toggle", handleActivityPanelToggle));
      leadLinks.forEach((link) => link.removeEventListener("click", openLeadPanel));
      activityTaskLinks.forEach((link) => link.removeEventListener("click", openLinkedActivityPanel));
    };
  }, []);

  return null;
}
