"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useStoredLanguage } from "@/components/language-preference";
import { authCopy } from "@/content/auth";

type AuthShellProps = {
  children: React.ReactNode;
  cardClassName?: string;
};

export function AuthShell({ children, cardClassName = "" }: AuthShellProps) {
  const { language } = useStoredLanguage();
  const copy = authCopy[language];

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand-lockup" href="/" aria-label="NormCore home">
          <span className="brand-mark" aria-hidden="true" />
          <span>NormCore</span>
        </Link>
        <Link className="auth-back-link" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{copy.back}</span>
        </Link>
      </header>

      <section className="auth-main" aria-labelledby="auth-title">
        <div className={`auth-card ${cardClassName}`.trim()}>
          {children}
          <div className="auth-trust-note">
            <ShieldCheck size={20} aria-hidden="true" />
            <p>{copy.trust}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
