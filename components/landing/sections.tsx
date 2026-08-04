"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Database,
  FileCheck2,
  FileQuestion,
  FileText,
  Fingerprint,
  FolderLock,
  KeyRound,
  Languages,
  Network,
  Pause,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";
import { FAQAccordion } from "./faq";
import { useLanguage } from "./language-context";

const problemIcons = [FileQuestion, FolderLock, FileText, TriangleAlert];
const stepIcons = [Building2, ClipboardCheck, ScanSearch, CheckCircle2];
const domainIcons = [Building2, UsersRound, KeyRound, Network];
const featureIcons = [
  Target,
  Pause,
  ScanSearch,
  ClipboardCheck,
  FolderLock,
  FileCheck2,
  Sparkles,
  Languages,
];
const aiIcons = [FileQuestion, Target, FileText];
const audienceIcons = [BriefcaseBusiness, ShieldCheck, UserRoundCheck];

function SectionHeading({ title, align = "left" }: { title: string; align?: "left" | "center" }) {
  return <h2 className={`section-title ${align === "center" ? "text-center" : ""}`}>{title}</h2>;
}

export function HeroSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="product" className="hero-section world-section" data-scene="0" data-rail="0">
      <div className="section-container hero-grid">
        <div className="hero-copy glass-copy-panel">
          <p className="eyebrow"><span />{landingCopy.hero.eyebrow}</p>
          <h1>{landingCopy.hero.title}</h1>
          <p className="hero-description">{landingCopy.hero.description}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/signup">
              {landingCopy.hero.primaryCta}
              <ArrowRight size={17} />
            </Link>
            <a className="button button-secondary" href="#how-it-works">
              {landingCopy.hero.secondaryCta}
            </a>
          </div>
          <p className="hero-reassurance">{landingCopy.hero.reassurance}</p>
        </div>
        <div className="hero-dashboard">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

export function ProblemSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="problem" className="world-section content-section problem-section" data-scene="1" data-rail="1">
      <div className="section-container split-section">
        <div className="section-intro glass-copy-panel">
          <SectionHeading title={landingCopy.problem.title} />
          <p>{landingCopy.problem.description}</p>
        </div>
        <div className="card-grid problem-grid">
          {landingCopy.problem.items.map((item, index) => {
            const Icon = problemIcons[index];
            return (
              <article className="content-card problem-card" key={item.title}>
                <span className="card-icon risk"><Icon size={20} /></span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="how-it-works" className="world-section content-section how-section" data-scene="2" data-rail="2">
      <div className="section-container">
        <SectionHeading title={landingCopy.howItWorks.title} align="center" />
        <div className="steps-grid">
          {landingCopy.howItWorks.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <article className="step-card" key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <span className="card-icon"><Icon size={21} /></span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < landingCopy.howItWorks.steps.length - 1 && <span className="step-connector" />}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DomainsSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="security" className="world-section content-section domains-section" data-scene="3" data-rail="3">
      <div className="section-container">
        <SectionHeading title={landingCopy.domains.title} align="center" />
        <div className="domains-grid">
          {landingCopy.domains.items.map((domain, index) => {
            const Icon = domainIcons[index];
            return (
              <article className={`domain-card domain-card-${index + 1}`} key={domain.title} tabIndex={0}>
                <div className="domain-card-top">
                  <span className="domain-index">0{index + 1}</span>
                  <span className="card-icon"><Icon size={23} /></span>
                </div>
                <h3>{domain.title}</h3>
                <p>{domain.description}</p>
                <span className="control-count">{domain.controls}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="features" className="world-section content-section features-section" data-scene="4" data-rail="4">
      <div className="section-container">
        <div className="features-heading">
          <SectionHeading title={landingCopy.features.title} />
          <div className="feature-orbit" aria-hidden="true">
            <Database size={22} />
            <span />
            <CloudUpload size={22} />
          </div>
        </div>
        <div className="features-grid">
          {landingCopy.features.items.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <article className="feature-card" key={feature.title}>
                <span className="feature-index">0{index + 1}</span>
                <span className="card-icon"><Icon size={21} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AIAssistantSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="ai-assistant" className="world-section content-section ai-section" data-scene="4" data-rail="5">
      <div className="section-container ai-layout">
        <div className="ai-visual-panel" aria-hidden="true">
          <div className="ai-orb"><Bot size={42} /><span /></div>
          <div className="ai-flow flow-a"><Sparkles size={16} /></div>
          <div className="ai-flow flow-b"><FileText size={16} /></div>
          <div className="human-gate"><Fingerprint size={36} /></div>
          <div className="gate-line" />
        </div>
        <div className="ai-content glass-copy-panel">
          <SectionHeading title={landingCopy.ai.title} />
          <p>{landingCopy.ai.description}</p>
          <div className="ai-capabilities">
            {landingCopy.ai.items.map((item, index) => {
              const Icon = aiIcons[index];
              return (
                <article key={item.title}>
                  <span className="card-icon"><Icon size={18} /></span>
                  <div><h3>{item.title}</h3><p>{item.description}</p></div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AudienceSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="audience" className="world-section content-section audience-section" data-scene="4" data-rail="6">
      <div className="section-container">
        <SectionHeading title={landingCopy.audience.title} align="center" />
        <div className="audience-grid">
          {landingCopy.audience.items.map((item, index) => {
            const Icon = audienceIcons[index];
            return (
              <article className="audience-card" key={item.title}>
                <span className="card-icon"><Icon size={23} /></span>
                {"badge" in item && <span className="coming-badge">{item.badge}</span>}
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="faq" className="world-section content-section faq-section" data-scene="4" data-rail="7">
      <div className="section-container faq-layout">
        <div className="faq-title-wrap">
          <SectionHeading title={landingCopy.faq.title} />
          <span className="faq-shield" aria-hidden="true"><ShieldCheck size={34} /></span>
        </div>
        <FAQAccordion />
      </div>
    </section>
  );
}

export function FinalCTASection() {
  const { copy: landingCopy } = useLanguage();
  return (
    <section id="get-started" className="world-section final-cta-section" data-scene="5" data-rail="8">
      <div className="section-container final-cta-layout">
        <div className="final-cta-copy glass-copy-panel">
          <SectionHeading title={landingCopy.finalCta.title} />
          <p>{landingCopy.finalCta.description}</p>
          <Link className="button button-primary final-cta-button" href="/signup">
            {landingCopy.finalCta.button}
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
