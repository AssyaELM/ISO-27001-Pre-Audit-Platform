"use client";

import { useLanguage } from "./language-context";

export function LandingSkipLink() {
  const { language } = useLanguage();

  return (
    <a className="skip-link" href="#main-content">
      {language === "fr" ? "Aller au contenu" : "Skip to content"}
    </a>
  );
}
