import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Privacy Policy | NormCore" };

const contact = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "privacy@normcore.io";
const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Draft · 31 July 2026",
    title: "Privacy Policy",
    introduction: "This notice describes the limited personal data currently processed to create, authenticate and secure a NormCore account.",
    sections: [
      { title: "Data collected", body: "We collect the name, email address, authentication information and selected interface language needed to operate your account. Basic technical and security logs may also be processed." },
      { title: "Purpose", body: "We use this information to create and authenticate accounts, protect the service and provide requested NormCore functionality. It is not sold or used for third-party advertising." },
      { title: "Service providers", body: "Account and authentication data may be stored using Supabase infrastructure. Production providers and hosting regions must be documented before public launch." },
      { title: "Retention and rights", body: `Account data is retained while the account is active and as needed for security or legal obligations. To request access, correction or deletion, contact ${contact}.` },
      { title: "Future product data", body: "This notice does not yet govern assessment workspaces or uploaded evidence. A fuller product privacy notice and contractual terms will be published before those features become available." },
    ],
  },
  fr: {
    eyebrow: "Brouillon · 31 juillet 2026",
    title: "Politique de confidentialité",
    introduction: "Cette notice décrit les données personnelles limitées actuellement traitées pour créer, authentifier et sécuriser un compte NormCore.",
    sections: [
      { title: "Données collectées", body: "Nous collectons le nom, l’adresse e-mail, les informations d’authentification et la langue d’interface nécessaires au fonctionnement du compte. Des journaux techniques et de sécurité peuvent aussi être traités." },
      { title: "Finalités", body: "Ces informations servent à créer et authentifier les comptes, protéger le service et fournir les fonctionnalités NormCore demandées. Elles ne sont ni vendues ni utilisées pour la publicité de tiers." },
      { title: "Prestataires", body: "Les données de compte et d’authentification peuvent être stockées sur l’infrastructure Supabase. Les prestataires de production et régions d’hébergement devront être documentés avant le lancement public." },
      { title: "Conservation et droits", body: `Les données du compte sont conservées pendant son activité et selon les besoins de sécurité ou les obligations légales. Pour demander accès, rectification ou suppression, contactez ${contact}.` },
      { title: "Futures données produit", body: "Cette notice ne régit pas encore les espaces d’évaluation ni les preuves téléversées. Une politique produit complète et des conditions contractuelles seront publiées avant leur ouverture." },
    ],
  },
};

export default function PrivacyPage() {
  return <PublicInfoPage content={content} />;
}
