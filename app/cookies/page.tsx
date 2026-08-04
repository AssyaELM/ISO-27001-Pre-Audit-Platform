import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Cookie Policy | NormCore" };

const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Draft · 31 July 2026",
    title: "Cookie and Local Storage Notice",
    introduction: "The current pre-launch website does not use advertising cookies or third-party analytics cookies.",
    sections: [
      { title: "Language preference", body: "The website stores your English or French preference in your browser’s local storage so the interface can remain in the language you selected." },
      { title: "Essential infrastructure", body: "The hosting platform may process short-lived technical data needed for security, routing and availability. Any future non-essential analytics will be documented and, where required, presented for consent before activation." },
      { title: "Your control", body: "You can clear local storage and cookies using your browser settings. Removing the language preference simply returns the site to its default or browser language." },
    ],
  },
  fr: {
    eyebrow: "Brouillon · 31 juillet 2026",
    title: "Notice relative aux cookies et au stockage local",
    introduction: "Le site actuel de pré-lancement n’utilise ni cookies publicitaires ni cookies analytiques tiers.",
    sections: [
      { title: "Préférence linguistique", body: "Le site enregistre votre préférence anglais ou français dans le stockage local du navigateur afin de conserver la langue choisie." },
      { title: "Infrastructure essentielle", body: "L’hébergeur peut traiter des données techniques de courte durée nécessaires à la sécurité, au routage et à la disponibilité. Toute future analyse non essentielle sera documentée et soumise au consentement lorsqu’il est requis." },
      { title: "Votre contrôle", body: "Vous pouvez supprimer le stockage local et les cookies depuis les paramètres du navigateur. La suppression de la préférence linguistique rétablit simplement la langue par défaut ou celle du navigateur." },
    ],
  },
};

export default function CookiesPage() {
  return <PublicInfoPage content={content} />;
}
