"use client";

import { useEffect, useRef, useState } from "react";
import { DioramaWorld } from "./diorama-world";
import { useLanguage } from "./language-context";

const railScenes = [
  { id: "product", label: { en: "Product", fr: "Produit" } },
  { id: "problem", label: { en: "Problem", fr: "Problème" } },
  { id: "how-it-works", label: { en: "How it works", fr: "Fonctionnement" } },
  { id: "security", label: { en: "Security", fr: "Sécurité" } },
  { id: "features", label: { en: "Features", fr: "Fonctionnalités" } },
  { id: "ai-assistant", label: { en: "AI assistant", fr: "Assistant IA" } },
  { id: "audience", label: { en: "Audience", fr: "Public" } },
  { id: "faq", label: { en: "FAQ", fr: "FAQ" } },
  { id: "get-started", label: { en: "Get started", fr: "Commencer" } },
] as const;

type ScrollWorldExperienceProps = { children: React.ReactNode };

export function ScrollWorldExperience({ children }: ScrollWorldExperienceProps) {
  const { language } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [activeRail, setActiveRail] = useState(0);
  const [cameraProgress, setCameraProgress] = useState(0);
  const [worldProgress, setWorldProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      const root = rootRef.current;
      if (!root) return;
      const viewportFocus = window.innerHeight * 0.52;
      const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
      let selected = sections[0];
      let selectedDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const containsFocus = rect.top <= viewportFocus && rect.bottom >= viewportFocus;
        const distance = containsFocus
          ? 0
          : Math.min(Math.abs(rect.top - viewportFocus), Math.abs(rect.bottom - viewportFocus));
        if (distance < selectedDistance) {
          selected = section;
          selectedDistance = distance;
        }
      });

      if (selected) {
        const rect = selected.getBoundingClientRect();
        const local = Math.min(1, Math.max(0, (viewportFocus - rect.top) / Math.max(rect.height, 1)));
        const scene = Number(selected.dataset.scene ?? 0);
        const rail = Number(selected.dataset.rail ?? scene);
        setActiveScene((current) => (current === scene ? current : scene));
        setActiveRail((current) => (current === rail ? current : rail));
        setCameraProgress(local);
      }

      const rootRect = root.getBoundingClientRect();
      const travel = Math.max(rootRect.height - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rootRect.top / travel));
      setWorldProgress(progress);
      setIsVisible(rootRect.bottom > 0 && rootRect.top < window.innerHeight);
    };

    const requestRead = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", requestRead, { passive: true });
    window.addEventListener("resize", requestRead);
    window.addEventListener("orientationchange", requestRead);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestRead);
      window.removeEventListener("resize", requestRead);
      window.removeEventListener("orientationchange", requestRead);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="scroll-world"
      data-active-scene={activeScene}
      data-active-rail={activeRail}
    >
      <div className={`scroll-world-fixed ${isVisible ? "is-visible" : ""}`} aria-hidden="true">
        <DioramaWorld activeScene={activeScene} cameraProgress={cameraProgress} />
        <div className="world-vignette" />
        <div className="world-progress" style={{ transform: `scaleX(${worldProgress})` }} />
      </div>

      <nav
        className={`scene-rail ${isVisible ? "is-visible" : ""}`}
        aria-label={language === "fr" ? "Progression dans la page" : "Page journey"}
      >
        {railScenes.map((scene, index) => (
          <a
            href={`#${scene.id}`}
            key={scene.id}
            className={activeRail === index ? "is-active" : ""}
            aria-label={scene.label[language]}
            aria-current={activeRail === index ? "step" : undefined}
          >
            <span>{scene.label[language]}</span>
            <i aria-hidden="true" />
          </a>
        ))}
      </nav>

      <div className={`scroll-cue ${worldProgress > 0.025 ? "is-hidden" : ""}`} aria-hidden="true">
        <span>{language === "fr" ? "Défiler" : "Scroll"}</span>
        <i />
      </div>

      <div className="scroll-world-content">{children}</div>
    </div>
  );
}
