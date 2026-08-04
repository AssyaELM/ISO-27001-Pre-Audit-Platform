import { LandingPage } from "@/components/landing/landing-page";
import { landingCopy } from "@/content/landing";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "NormCore",
      url: "https://normcore.io",
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: "NormCore",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: landingCopy.hero.description,
    },
    {
      "@type": "FAQPage",
      mainEntity: landingCopy.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
