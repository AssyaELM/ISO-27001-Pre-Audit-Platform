"use client";

import { useStoredLanguage } from "@/components/language-preference";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useStoredLanguage();
  const nextLanguage = language === "en" ? "fr" : "en";
  const label = nextLanguage.toUpperCase();

  return (
    <button
      type="button"
      className={className}
      onClick={() => setLanguage(nextLanguage)}
      aria-label={language === "en" ? "Afficher la plateforme en français" : "Show the platform in English"}
      title={language === "en" ? "Passer en français" : "Switch to English"}
    >
      {label}
    </button>
  );
}
