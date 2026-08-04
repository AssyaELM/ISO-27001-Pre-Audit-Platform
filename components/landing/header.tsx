"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "./language-context";

const navLinks = [
  "#product",
  "#how-it-works",
  "#features",
  "/security",
  "/pricing",
  "/resources",
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { copy, toggleLanguage } = useLanguage();

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header className="site-header">
      <a className="brand-lockup" href="#product" aria-label="NormCore home">
        <span className="brand-mark" aria-hidden="true" />
          <span>{copy.navigation.brand}</span>
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navLinks.map((href, index) =>
          href.startsWith("/") ? (
            <Link key={href} href={href}>
              {copy.navigation.items[index]}
            </Link>
          ) : (
            <a key={href} href={href}>
              {copy.navigation.items[index]}
            </a>
          ),
        )}
      </nav>

      <div className="header-actions">
        <button className="language-control" type="button" aria-label="Switch language" onClick={toggleLanguage}>
          {copy.navigation.language}
        </button>
        <Link className="sign-in" href="/login">
          {copy.navigation.signIn}
        </Link>
        <Link className="button button-primary button-small" href="/signup">
          {copy.navigation.cta}
        </Link>
      </div>

      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>

      <div id="mobile-navigation" className={`mobile-menu ${open ? "is-open" : ""}`}>
        <nav aria-label="Mobile navigation">
          {navLinks.map((href, index) =>
            href.startsWith("/") ? (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {copy.navigation.items[index]}
              </Link>
            ) : (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {copy.navigation.items[index]}
              </a>
            ),
          )}
        </nav>
        <div className="mobile-menu-footer">
          <button type="button" onClick={toggleLanguage}>{copy.navigation.language}</button>
          <Link href="/login" onClick={() => setOpen(false)}>{copy.navigation.signIn}</Link>
          <Link className="button button-primary" href="/signup" onClick={() => setOpen(false)}>
            {copy.navigation.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
