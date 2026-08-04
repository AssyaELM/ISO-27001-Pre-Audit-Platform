"use client";

import Link from "next/link";
import { useLanguage } from "./language-context";

const productLinks = ["#how-it-works", "#features", "/security", "/pricing"] as const;
const resourceLinks = [
  "/resources#iso-iec-27001-overview",
  "/resources#security-glossary",
  "/resources#guides",
  "/resources#contact",
] as const;
const legalLinks = ["/privacy", "/terms", "/cookies", "/ai-usage"] as const;

export function Footer() {
  const { copy, language, setLanguage } = useLanguage();
  const headings = language === "fr"
    ? ["Produit", "Ressources", "Mentions légales", "Langue"]
    : ["Product", "Resources", "Legal", "Language"];

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <a className="brand-lockup" href="#product">
            <span className="brand-mark" aria-hidden="true" />
            <span>{copy.navigation.brand}</span>
          </a>
        </div>
        <FooterColumn title={headings[0]}>
          {copy.footer.product.map((item, index) => <Link key={item} href={productLinks[index]}>{item}</Link>)}
        </FooterColumn>
        <FooterColumn title={headings[1]}>
          {copy.footer.resources.map((item, index) => (
            <Link key={item} href={resourceLinks[index]}>{item}</Link>
          ))}
        </FooterColumn>
        <FooterColumn title={headings[2]}>
          {copy.footer.legal.map((item, index) => <Link key={item} href={legalLinks[index]}>{item}</Link>)}
        </FooterColumn>
        <FooterColumn title={headings[3]}>
          {copy.footer.language.map((item, index) => (
            <button type="button" key={item} onClick={() => setLanguage(index === 0 ? "en" : "fr")}>{item}</button>
          ))}
        </FooterColumn>
      </div>
      <div className="footer-bottom" id="legal">
        <p>{copy.footer.disclaimer}</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="footer-column">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
