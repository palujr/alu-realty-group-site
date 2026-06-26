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

    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
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

    return () => {
      leadPanels.forEach((panel) => panel.removeEventListener("toggle", handleLeadPanelToggle));
    };
  }, []);

  return null;
}
