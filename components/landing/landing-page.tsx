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

export function LandingPage() {
  return (
    <LanguageProvider>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
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
      </div>
    </LanguageProvider>
  );
}
