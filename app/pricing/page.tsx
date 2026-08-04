import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Pricing | NormCore" };

const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Pre-launch pricing",
    title: "Pricing is being validated with early users.",
    introduction: "There is no paid plan to purchase today. The first offer will be defined after the working Annex A assessment has been tested with real organizations.",
    sections: [
      { title: "What the first plan is intended to include", body: "One organization workspace, the progressive Annex A assessment, save and resume, gap analysis, remediation tracking, evidence management and exportable drafts." },
      { title: "No surprise commitment", body: "Creating a NormCore account does not create a paid subscription or payment obligation." },
    ],
    primaryLabel: "Create account",
    primaryHref: "/signup",
  },
  fr: {
    eyebrow: "Tarification avant lancement",
    title: "Les tarifs sont en cours de validation avec les premiers utilisateurs.",
    introduction: "Aucune offre payante n’est disponible aujourd’hui. La première offre sera définie après avoir testé l’évaluation Annexe A fonctionnelle avec de vraies organisations.",
    sections: [
      { title: "Contenu prévu de la première offre", body: "Un espace organisation, l’évaluation progressive de l’Annexe A, la sauvegarde et reprise, l’analyse des gaps, le suivi des remédiations, la gestion des preuves et les brouillons exportables." },
      { title: "Aucun engagement caché", body: "La création d’un compte NormCore ne crée aucun abonnement payant ni obligation de paiement." },
    ],
    primaryLabel: "Créer un compte",
    primaryHref: "/signup",
  },
};

export default function PricingPage() {
  return <PublicInfoPage content={content} />;
}
