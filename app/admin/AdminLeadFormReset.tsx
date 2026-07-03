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
    const getLeadPanels = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-reset-on-close='true']"));

    const resetForms = (panel: HTMLDetailsElement) => {
      panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
    };

    const scrollPanelIntoPlace = (panel: HTMLDetailsElement) => {
      scrollElementIntoPlace(panel);
    };

    const closeActivityEditPanels = (timelinePanel: Element | null, exceptPanel?: HTMLDetailsElement) => {
      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-edit-panel='true']").forEach((panel) => {
        if (panel !== exceptPanel && panel.open) {
          panel.open = false;
          resetForms(panel);
        }
      });
    };

    const closeActivityCreatePanels = (timelinePanel: Element | null, exceptPanel?: HTMLDetailsElement) => {
      timelinePanel?.querySelectorAll<HTMLDetailsElement>("details[data-activity-create-panel='true']").forEach((panel) => {
        if (panel !== exceptPanel && panel.open) {
          panel.open = false;
          resetForms(panel);
        }
      });
    };

    const closeOtherActivityPanels = (targetPanel: HTMLDetailsElement) => {
      const timelinePanel = targetPanel.closest(".admin-timeline-panel");

      closeActivityEditPanels(timelinePanel, targetPanel);
      closeActivityCreatePanels(timelinePanel);
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

      if (panel.matches("details[data-activity-edit-panel='true']")) {
        if (panel.open) {
          closeOtherActivityPanels(panel);
          scrollActivityTimelineIntoPlace(panel);
        }

        return;
      }

      if (panel.matches("details[data-activity-create-panel='true']")) {
        if (!panel.open) {
          resetForms(panel);
          return;
        }

        const timelinePanel = panel.closest(".admin-timeline-panel");
        closeActivityEditPanels(timelinePanel);
        closeActivityCreatePanels(timelinePanel, panel);
        scrollActivityTimelineIntoPlace(panel);
        return;
      }

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

    const openActivityPanelFromSummary = (event: MouseEvent, summary: HTMLElement) => {
      const panel = summary.closest<HTMLDetailsElement>("details[data-activity-edit-panel='true']");

      if (!panel) {
        return;
      }

      event.preventDefault();

      const shouldOpen = !panel.open;
      const timelinePanel = panel.closest(".admin-timeline-panel");

      closeActivityEditPanels(timelinePanel, panel);
      closeActivityCreatePanels(timelinePanel);

      panel.open = shouldOpen;

      if (shouldOpen) {
        scrollActivityTimelineIntoPlace(panel);
        return;
      }

      resetForms(panel);
    };

    const openActivityCreatePanelFromSummary = (event: MouseEvent, summary: HTMLElement) => {
      const panel = summary.closest<HTMLDetailsElement>("details[data-activity-create-panel='true']");

      if (!panel) {
        return;
      }

      event.preventDefault();

      const shouldOpen = !panel.open;
      const timelinePanel = panel.closest(".admin-timeline-panel");

      closeActivityEditPanels(timelinePanel);
      closeActivityCreatePanels(timelinePanel, panel);

      panel.open = shouldOpen;

      if (shouldOpen) {
        scrollActivityTimelineIntoPlace(panel);
        return;
      }

      resetForms(panel);
    };

    const openLeadPanel = (event: MouseEvent, link: HTMLAnchorElement) => {
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

    const openLinkedActivityPanel = (event: MouseEvent, link: HTMLAnchorElement) => {
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

    const handleAdminPanelClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const summary = target?.closest("summary");
      const summaryPanel = summary?.parentElement;

      if (summaryPanel?.matches("details[data-activity-edit-panel='true']")) {
        openActivityPanelFromSummary(event, summary as HTMLElement);
        return;
      }

      if (summaryPanel?.matches("details[data-activity-create-panel='true']")) {
        openActivityCreatePanelFromSummary(event, summary as HTMLElement);
        return;
      }

      const activityLink = target?.closest<HTMLAnchorElement>("a[data-open-activity-panel='true']");
      if (activityLink) {
        openLinkedActivityPanel(event, activityLink);
        return;
      }

      const leadLink = target?.closest<HTMLAnchorElement>("a[data-open-lead-panel='true']");
      if (leadLink) {
        openLeadPanel(event, leadLink);
      }
    };

    document.addEventListener("click", handleAdminPanelClick);

    return () => {
      document.removeEventListener("toggle", handleLeadPanelToggle, true);
      document.removeEventListener("click", handleAdminPanelClick);
    };
  }, [scrollElementIntoPlace]);

  return null;
}
