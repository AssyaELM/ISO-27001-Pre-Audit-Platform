"use client";

import Link from "next/link";
import type { Language } from "@/content/landing";
import { useStoredLanguage } from "@/components/language-preference";
import { NormCoreLogo } from "@/components/branding/normcore-logo";

export type PublicPageContent = {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: Array<{ id?: string; title: string; body: string }>;
  primaryLabel?: string;
  primaryHref?: string;
};

export function PublicInfoPage({ content }: { content: Record<Language, PublicPageContent> }) {
  const { language, setLanguage } = useStoredLanguage();

  const page = content[language];

  return (
    <main className="resource-page public-info-page">
      <div className="public-page-topbar">
        <Link prefetch={true} href="/" className="brand-lockup" aria-label="NormCore home">
          <NormCoreLogo width={180} height={49} priority />
        </Link>
        <button type="button" className="language-control" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
          {language === "en" ? "EN / FR" : "FR / EN"}
        </button>
      </div>

      <div className="public-page-content">
        <p className="eyebrow"><span />{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className="public-page-intro">{page.introduction}</p>

        <div className="public-page-sections">
          {page.sections.map((section) => (
            <section id={section.id} key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <div className="public-page-actions">
          {page.primaryHref && page.primaryLabel && (
            <Link prefetch={true} className="button button-primary" href={page.primaryHref}>{page.primaryLabel}</Link>
          )}
          <Link prefetch={true} className="button button-secondary" href="/">
            {language === "en" ? "Back to home" : "Retour à l’accueil"}
          </Link>
        </div>
      </div>
    </main>
  );
}
