"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Language } from "@/content/landing";

const storageKey = "normcore-language";
const changeEvent = "normcore-language-change";

function readLanguage(): Language {
  const saved = window.localStorage.getItem(storageKey);
  if (saved === "en" || saved === "fr") return saved;
  return "en";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

export function useStoredLanguage() {
  const language = useSyncExternalStore<Language>(subscribe, readLanguage, () => "en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(storageKey, nextLanguage);
    window.dispatchEvent(new Event(changeEvent));
  }, []);

  return { language, setLanguage };
}
