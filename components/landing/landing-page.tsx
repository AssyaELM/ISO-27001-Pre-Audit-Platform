import { Header } from "./header";
import { ScrollWorldExperience } from "./scroll-world-experience";
import {
  AIAssistantSection,
  AudienceSection,
  DomainsSection,
  AnnexASection,
  FAQSection,
  FeaturesSection,
  FinalCTASection,
  HeroSection,
  HowItWorksSection,
  ProblemSection,
} from "./sections";
import { Footer } from "./footer";
import { LanguageProvider } from "./language-context";
import { LandingSkipLink } from "./landing-skip-link";

function LandingContent() {
  return <div className="site-shell">
    <LandingSkipLink />
    <Header />
    <main id="main-content">
      <ScrollWorldExperience>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <DomainsSection />
        <AnnexASection />
        <FeaturesSection />
        <AIAssistantSection />
        <AudienceSection />
        <FAQSection />
        <FinalCTASection />
      </ScrollWorldExperience>
    </main>
    <Footer />
  </div>;
}

export function LandingPage() {
  return (
    <LanguageProvider>
      <LandingContent />
    </LanguageProvider>
  );
}
