"use client";

import { useCallback, useEffect } from "react";

export function AdminLeadFormReset({
  activitySaved,
  activitySavedAt,
  activityUpdated,
  savedLeadId,
  leadRemoved,
  leadRemovedAt
}: {
  activitySaved: boolean;
  activitySavedAt?: string;
  activityUpdated: boolean;
  savedLeadId?: string;
  leadRemoved?: boolean;
  leadRemovedAt?: string;
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
    if (!activitySaved || !savedLeadId) {
      return;
    }

    const activityForm = document.querySelector<HTMLFormElement>(`form[data-activity-form="${savedLeadId}"]`);
    const activityTimeline = document.querySelector<HTMLElement>(`#lead-activity-${savedLeadId}`);

    activityForm?.reset();
    activityForm?.closest<HTMLDetailsElement>("details[data-activity-create-panel='true']")?.removeAttribute("open");

    if (activityTimeline) {
      window.history.replaceState(null, "", `#lead-activity-${savedLeadId}`);
      scrollElementIntoPlace(activityTimeline);
    }
  }, [activitySaved, activitySavedAt, savedLeadId, scrollElementIntoPlace]);

  useEffect(() => {
    if (!activityUpdated || !savedLeadId) {
      return;
    }

    const activityTimeline = document.querySelector<HTMLElement>(`#lead-activity-${savedLeadId}`);

    document.querySelectorAll<HTMLDetailsElement>(`#lead-${savedLeadId} details[data-activity-edit-panel='true']`).forEach((panel) => {
      panel.open = false;
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    });

    if (activityTimeline) {
      window.history.replaceState(null, "", `#lead-activity-${savedLeadId}`);
      scrollElementIntoPlace(activityTimeline);
    }
  }, [activityUpdated, activitySavedAt, savedLeadId, scrollElementIntoPlace]);

  useEffect(() => {
    if (!leadRemoved) {
      return;
    }

    document.querySelectorAll<HTMLDetailsElement>("details[data-reset-on-close='true']").forEach((panel) => {
      panel.open = false;
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    });

    const leadOverview = document.querySelector<HTMLElement>("#lead-overview");
    if (!leadOverview) {
      return;
    }

    window.history.replaceState(null, "", "#lead-overview");
    scrollElementIntoPlace(leadOverview);
  }, [leadRemoved, leadRemovedAt, scrollElementIntoPlace]);

  useEffect(() => {
    const leadLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-open-lead-panel='true']"));
    const activityPanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']"));
    const activityCreatePanels = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-activity-create-panel='true']"));
    const activityTaskLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[data-open-activity-panel='true']"));

    const getLeadPanels = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-reset-on-close='true']"));

    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    const scrollPanelIntoPlace = (panel: HTMLDetailsElement) => {
      scrollElementIntoPlace(panel);
    };

    const closeOtherActivityPanels = (targetPanel: HTMLDetailsElement) => {
      const timelinePanel = targetPanel.closest(".admin-timeline-panel");

      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']").forEach((panel) => {
        if (panel !== targetPanel && panel.open) {
          panel.open = false;
          panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
        }
      });

      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-create-panel='true']").forEach((panel) => {
        if (panel.open) {
          panel.open = false;
          panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
        }
      });
    };

    const closeActivityEditPanels = (timelinePanel: Element | null) => {
      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']").forEach((panel) => {
        if (panel.open) {
          panel.open = false;
          panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
        }
      });
    };

    const scrollActivityTimelineIntoPlace = (element: Element | null) => {
      const timelinePanel = element?.closest<HTMLElement>(".admin-timeline-panel");

      if (!timelinePanel?.id) {
        return;
      }

      window.history.replaceState(null, "", `#${timelinePanel.id}`);
      scrollElementIntoPlace(timelinePanel);
    };

    const openActivityPanel = (targetPanel: HTMLDetailsElement) => {
      const parentLeadPanel = targetPanel.closest<HTMLDetailsElement>("details[data-reset-on-close='true']");

      if (parentLeadPanel && !parentLeadPanel.open) {
        parentLeadPanel.open = true;
      }

      closeOtherActivityPanels(targetPanel);
      targetPanel.open = true;
      scrollActivityTimelineIntoPlace(targetPanel);
    };

    const handleLeadPanelToggle = (event: Event) => {
      const panel = event.target as HTMLDetailsElement;

      if (!panel.matches("details[data-reset-on-close='true']")) {
        return;
      }

      if (panel.open) {
        getLeadPanels().forEach((otherPanel) => {
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

    document.addEventListener("toggle", handleLeadPanelToggle, true);

    const handleActivityPanelToggle = (event: Event) => {
      const panel = event.currentTarget as HTMLDetailsElement;

      if (panel.open) {
        closeOtherActivityPanels(panel);
        scrollActivityTimelineIntoPlace(panel);
      }
    };

    activityPanels.forEach((panel) => panel.addEventListener("toggle", handleActivityPanelToggle));

    const handleActivityCreatePanelToggle = (event: Event) => {
      const panel = event.currentTarget as HTMLDetailsElement;

      if (!panel.open) {
        panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
        return;
      }

      const timelinePanel = panel.closest(".admin-timeline-panel");
      closeActivityEditPanels(timelinePanel);
      scrollActivityTimelineIntoPlace(panel);
    };

    activityCreatePanels.forEach((panel) => panel.addEventListener("toggle", handleActivityCreatePanelToggle));

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

      getLeadPanels().forEach((panel) => {
        if (panel !== targetPanel && panel.open) {
          panel.open = false;
          resetForms(panel);
        }
      });

      targetPanel.open = true;
      window.history.replaceState(null, "", targetHash);

      scrollPanelIntoPlace(targetPanel);
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
      document.removeEventListener("toggle", handleLeadPanelToggle, true);
      activityPanels.forEach((panel) => panel.removeEventListener("toggle", handleActivityPanelToggle));
      activityCreatePanels.forEach((panel) => panel.removeEventListener("toggle", handleActivityCreatePanelToggle));
      leadLinks.forEach((link) => link.removeEventListener("click", openLeadPanel));
      activityTaskLinks.forEach((link) => link.removeEventListener("click", openLinkedActivityPanel));
    };
  }, [scrollElementIntoPlace]);

  return null;
}
