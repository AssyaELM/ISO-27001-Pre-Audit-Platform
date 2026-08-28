"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Menu, X } from "lucide-react";
import styles from "./public-annex.module.css";
import {
  getAnnexControlBySlug,
  getAnnexControlsForTheme,
  getAnnexTheme,
  getControlNavigation,
  publicAnnexControls,
  publicAnnexStats,
  publicAnnexThemes,
  type PublicAnnexControl,
  type PublicAnnexThemeId,
} from "@/content/public-iso27001";
import { NormCoreLogo } from "@/components/branding/normcore-logo";

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/iso-27001/annex-a", label: "ISO 27001" },
  { href: "/iso-27001/annex-a", label: "Themes" },
  { href: "/resources", label: "Resources" },
] as const;

const themeIcons = {
  organizational: BookOpen,
  people: UsersIcon,
  physical: ShieldIcon,
  technological: LayersIcon,
};

function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 11a4 4 0 1 0-0.001-8.001A4 4 0 0 0 8 11Z" /><path d="M16.5 13a3.5 3.5 0 1 0-0.001-7.001A3.5 3.5 0 0 0 16.5 13Z" /><path d="M2.5 19c0-3.04 2.46-5.5 5.5-5.5h0c3.04 0 5.5 2.46 5.5 5.5" /><path d="M14.5 19c0-2.26 1.86-4.1 4.1-4.1h.4c2.43 0 4.4 1.97 4.4 4.4" /></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 20 6.5v5.4c0 4.2-2.9 7.9-8 8.9-5.1-1-8-4.7-8-8.9V6.5L12 3Z" /><path d="M9.2 12.1 11 14l3.8-4.2" /></svg>;
}

function LayersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 11 8 4 8-4" /><path d="m4 17 8 4 8-4" /></svg>;
}

function headerActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function PublicAnnexHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className={styles.header}>
        <Link className={styles.headerBrand} href="/" aria-label="NormCore home">
          <NormCoreLogo width={180} height={49} priority />
        </Link>

        <nav className={styles.headerNav} aria-label="Primary navigation">
          {publicNavItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href} aria-current={headerActive(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link className="sign-in" href="/login">
            Log in
          </Link>
          <Link className={`button button-primary button-small ${styles.headerCta}`} href="/signup">
            Create account
          </Link>
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {open && (
        <div className={styles.mobileMenu}>
          {publicNavItems.map((item) => (
            <Link key={`${item.href}-${item.label}-mobile`} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileActions}>
            <Link className="sign-in" href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link className="button button-primary" href="/signup" onClick={() => setOpen(false)}>
              Create account
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

function ThemeCard({ themeSlug }: { themeSlug: PublicAnnexThemeId }) {
  const theme = getAnnexTheme(themeSlug);
  if (!theme) return null;
  const controls = getAnnexControlsForTheme(themeSlug).slice(0, 3);
  const Icon = themeIcons[themeSlug];

  return (
    <article className={styles.themeCard}>
      <div className={styles.themeTop}>
        <div style={{ display: "grid", gap: 12 }}>
          <span className={styles.themeIcon} aria-hidden="true">
            <Icon size={23} />
          </span>
          <div>
            <h3 className={styles.themeTitle}>{theme.title}</h3>
            <span className={styles.themeCount}>{theme.count} controls</span>
          </div>
        </div>
      </div>
      <p className={styles.themeDescription}>{theme.description}</p>
      <div className={styles.chipList}>
        {controls.map((control) => (
          <span key={control.code} className={styles.chip}>
            {control.code} {control.title}
          </span>
        ))}
      </div>
      <div className={styles.cardActions}>
        <Link className={styles.cardLink} href={`/iso-27001/annex-a/${theme.slug}`}>
          {theme.ctaLabel}
        </Link>
      </div>
    </article>
  );
}

export function AnnexALandingSection({ copy }: { copy: any }) {
  return (
    <section id="iso-27001" className="world-section content-section" data-scene="6" data-rail="9">
      <div className="section-container">
        <div className={styles.hero}>
          <p className={styles.eyebrow}><span />{copy.annexA.eyebrow}</p>
          <h2 className={styles.title}>{copy.annexA.title}</h2>
          <p className={styles.subtitle}>{copy.annexA.subtitle}</p>
          <div className={styles.statsRow}>
            {copy.annexA.stats.map((stat: { label: string; value: string }) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.themeGrid}>
          <ThemeCard themeSlug="organizational" />
          <ThemeCard themeSlug="people" />
          <ThemeCard themeSlug="physical" />
          <ThemeCard themeSlug="technological" />
        </div>

        <div className={styles.footerCta}>
          <Link className="button button-secondary" href="/iso-27001/annex-a">
            Browse all 93 controls <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AnnexAIndexPage() {
  return (
    <main className={styles.shell}>
      <PublicAnnexHeader />
      <div className={styles.content}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}><span />ISO/IEC 27001:2022</p>
          <h1 className={styles.title}>ISO 27001 Annex A Controls</h1>
          <p className={styles.subtitle}>
            Explore the 93 ISO/IEC 27001:2022 Annex A controls across four themes and understand what each control addresses, why it matters, and the practical areas organisations should consider.
          </p>
          <div className={styles.statsRow}>
            {publicAnnexStats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.themeGrid}>
          {publicAnnexThemes.map((theme) => (
            <ThemeCard key={theme.slug} themeSlug={theme.slug} />
          ))}
        </div>

        <div className={styles.footerCta}>
          <Link className="button button-primary" href="/iso-27001/annex-a">
            Browse all 93 controls <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}

export function AnnexAThemePage({ themeSlug }: { themeSlug: PublicAnnexThemeId }) {
  const theme = getAnnexTheme(themeSlug);
  if (!theme) return null;
  const controls = getAnnexControlsForTheme(themeSlug);

  return (
    <main className={styles.shell}>
      <PublicAnnexHeader />
      <div className={styles.content}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "ISO 27001 Annex A", href: "/iso-27001/annex-a" }, { label: theme.title }]} />
        <section className={styles.hero}>
          <p className={styles.pageKicker}><span />ISO 27001 Annex A</p>
          <h1 className={styles.title}>{theme.title}</h1>
          <div className={styles.themeIntroMeta}>
            <span className={styles.themeCount}>{theme.count} controls</span>
            <span className={styles.themeIntroCount}>93 controls · 4 themes</span>
          </div>
          <p className={styles.pageSubtitle}>{theme.description}</p>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>All controls</h2>
          <p className={styles.sectionText}>Each control below opens a dedicated public reference page with a simple explanation, implementation notes and related controls.</p>
          <div className={styles.controlGrid}>
            {controls.map((control) => (
              <Link key={control.code} href={`/iso-27001/annex-a/${control.slug}`} className={styles.controlCard}>
                <span className={styles.controlCode}>{control.code}</span>
                <h3 className={styles.controlTitle}>{control.title}</h3>
                <p className={styles.controlText}>{control.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailBlock({ title, body }: { title: string; body: string | string[] }) {
  return (
    <section className={styles.detailSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {Array.isArray(body) ? <ul className={styles.sectionList}>{body.map((item) => <li key={item}>{item}</li>)}</ul> : <p className={styles.sectionText}>{body}</p>}
    </section>
  );
}

function RelatedControlCard({ control }: { control: PublicAnnexControl }) {
  return (
    <Link href={`/iso-27001/annex-a/${control.slug}`} className={styles.relatedLink}>
      <strong>{control.code} {control.title}</strong>
      <span>{control.shortDescription}</span>
    </Link>
  );
}

export function AnnexAControlPage({ controlSlug }: { controlSlug: string }) {
  const control = getAnnexControlBySlug(controlSlug);
  if (!control) return null;
  const theme = getAnnexTheme(control.theme);
  const navigation = getControlNavigation(control);
  const relatedControls = control.relatedControlCodes
    .map((code) => publicAnnexControls.find((item) => item.code === code))
    .filter((item): item is PublicAnnexControl => Boolean(item))
    .slice(0, 5);

  return (
    <main className={styles.shell}>
      <PublicAnnexHeader />
      <div className={styles.content}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "ISO 27001 Annex A", href: "/iso-27001/annex-a" }, { label: theme?.title ?? "Theme", href: `/iso-27001/annex-a/${theme?.slug ?? ""}` }, { label: control.code }]} />

        <div className={styles.detailLayout}>
          <div className={styles.detailColumn}>
            <section className={styles.hero}>
              <p className={styles.pageKicker}><span />ISO/IEC 27001:2022 · Annex A</p>
              <h1 className={styles.title}>{control.code} {control.title}</h1>
              <div className={styles.themeIntroMeta}>
                <span className={styles.themeCount}>{theme?.title ?? control.theme}</span>
                <span className={styles.themeIntroCount}>Public control reference</span>
              </div>
              <p className={styles.pageSubtitle}>{control.shortDescription}</p>
            </section>

            <DetailBlock title="Short description" body={control.shortDescription} />
            <DetailBlock title="Objective" body={control.objective} />
            <DetailBlock title="Plain-language explanation" body={control.explanation} />
            <DetailBlock title="Why it matters" body={control.whyItMatters} />
            <DetailBlock title="What organisations should consider" body={control.considerations} />
            <DetailBlock title="Typical evidence" body={control.evidenceExamples} />
            <DetailBlock title="Implementation guidance" body={control.implementationGuidance} />

            <section className={styles.detailSection}>
              <h2 className={styles.sectionTitle}>Navigation</h2>
              <div className={styles.navBar}>
                {navigation.previous ? (
                  <Link className={styles.navButton} href={`/iso-27001/annex-a/${navigation.previous.slug}`}>
                    <ArrowLeft size={16} />
                    Previous control
                  </Link>
                ) : (
                  <span className={styles.navButton} aria-disabled="true">
                    <ArrowLeft size={16} />
                    Previous control
                  </span>
                )}
                <Link className={styles.navButton} href="/iso-27001/annex-a">
                  Back to controls
                </Link>
                {navigation.next ? (
                  <Link className={styles.navButton} href={`/iso-27001/annex-a/${navigation.next.slug}`}>
                    Next control
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <span className={styles.navButton} aria-disabled="true">
                    Next control
                    <ArrowRight size={16} />
                  </span>
                )}
              </div>
            </section>
          </div>

          <aside className={styles.detailSide}>
            <section className={styles.sideCard}>
              <span className={styles.sideLabel}>Related controls</span>
              <div className={styles.relatedList}>
                {relatedControls.map((item) => <RelatedControlCard key={item.code} control={item} />)}
              </div>
            </section>
            <section className={styles.sideCard}>
              <span className={styles.sideLabel}>Theme</span>
              <p className={styles.sectionText}>{theme?.description}</p>
              <Link className="button button-secondary button-small" href={`/iso-27001/annex-a/${theme?.slug ?? "organizational"}`}>
                Explore {theme?.title ?? control.theme} controls
              </Link>
            </section>
            <section className={styles.sideCard}>
              <span className={styles.sideLabel}>Control details</span>
              <p className={styles.sectionText}>This public page is descriptive only. It does not include workspace data, evidence scores, assessment status or account-specific context.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function getPublicAnnexPageData(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return { kind: "index" as const };
  }
  if (slug.length === 1) {
    const value = slug[0] as string;
    const theme = getAnnexTheme(value as PublicAnnexThemeId);
    if (theme) {
      return { kind: "theme" as const, themeSlug: theme.slug };
    }
    const control = getAnnexControlBySlug(value);
    if (control) {
      return { kind: "control" as const, controlSlug: control.slug };
    }
  }
  return { kind: "not-found" as const };
}
