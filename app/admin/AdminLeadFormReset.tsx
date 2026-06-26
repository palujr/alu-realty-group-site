"use client";

import { useEffect } from "react";

export function AdminLeadFormReset({
  activitySaved,
  savedLeadId
}: {
  activitySaved: boolean;
  savedLeadId?: string;
}) {
  useEffect(() => {
    if (!activitySaved || !savedLeadId) {
      return;
    }

    document.querySelector<HTMLFormElement>(`form[data-activity-form="${savedLeadId}"]`)?.reset();
  }, [activitySaved, savedLeadId]);

  useEffect(() => {
    const leadPanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-reset-on-close='true']"));

    const resetFormsOnClose = (event: Event) => {
      const panel = event.currentTarget as HTMLDetailsElement;

      if (panel.open) {
        return;
      }

      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    leadPanels.forEach((panel) => panel.addEventListener("toggle", resetFormsOnClose));

    return () => {
      leadPanels.forEach((panel) => panel.removeEventListener("toggle", resetFormsOnClose));
    };
  }, []);

  return null;
}
