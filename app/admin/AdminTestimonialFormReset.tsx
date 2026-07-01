"use client";

import { useCallback, useEffect } from "react";

export function AdminTestimonialFormReset({
  testimonialSaved,
  testimonialRemoved,
  savedTestimonialId,
  savedAt
}: {
  testimonialSaved: boolean;
  testimonialRemoved: boolean;
  savedTestimonialId?: string;
  savedAt?: string;
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

    const handleTestimonialPanelToggle = (event: Event) => {
      const panel = event.target as HTMLDetailsElement;

      if (!panel.matches("details.admin-testimonial-edit-panel")) {
        return;
      }

      if (panel.open) {
        document.querySelectorAll<HTMLDetailsElement>("details.admin-testimonial-edit-panel").forEach((otherPanel) => {
          if (otherPanel !== panel && otherPanel.open) {
            otherPanel.open = false;
            resetForms(otherPanel);
          }
        });

        window.history.replaceState(null, "", `#${panel.id}`);
        scrollElementIntoPlace(panel);
        return;
      }

      resetForms(panel);
    };

    document.addEventListener("toggle", handleTestimonialPanelToggle, true);

    return () => {
      document.removeEventListener("toggle", handleTestimonialPanelToggle, true);
    };
  }, [scrollElementIntoPlace]);

  useEffect(() => {
    if (!testimonialSaved && !testimonialRemoved) {
      return;
    }

    document.querySelectorAll("[data-testimonial-save-confirmation='true']").forEach((element) => {
      element.removeAttribute("hidden");
    });

    const hideConfirmation = window.setTimeout(() => {
      document.querySelectorAll("[data-testimonial-save-confirmation='true']").forEach((element) => {
        element.setAttribute("hidden", "true");
      });
    }, 7000);

    const createPanel = document.querySelector<HTMLDetailsElement>("#new-testimonial");
    createPanel?.querySelector<HTMLFormElement>("form")?.reset();
    if (createPanel) {
      createPanel.open = false;
    }

    if (testimonialRemoved || !savedTestimonialId) {
      document.querySelectorAll<HTMLDetailsElement>("details.admin-testimonial-edit-panel").forEach((panel) => {
        panel.open = false;
        panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
      });

      const testimonials = document.querySelector<HTMLElement>("#testimonials");
      if (testimonials) {
        window.history.replaceState(null, "", "#testimonials");
        scrollElementIntoPlace(testimonials);
      }
      return () => window.clearTimeout(hideConfirmation);
    }

    document.querySelectorAll<HTMLDetailsElement>("details.admin-testimonial-edit-panel").forEach((panel) => {
      if (panel.id !== `testimonial-${savedTestimonialId}` && panel.open) {
        panel.open = false;
        panel.querySelectorAll<HTMLFormElement>("form").forEach((form) => form.reset());
      }
    });

    const savedPanel = document.querySelector<HTMLDetailsElement>(`#testimonial-${savedTestimonialId}`);
    if (!savedPanel) {
      return () => window.clearTimeout(hideConfirmation);
    }

    savedPanel.open = true;
    scrollElementIntoPlace(savedPanel);

    return () => window.clearTimeout(hideConfirmation);
  }, [testimonialSaved, testimonialRemoved, savedTestimonialId, savedAt, scrollElementIntoPlace]);

  return null;
}
