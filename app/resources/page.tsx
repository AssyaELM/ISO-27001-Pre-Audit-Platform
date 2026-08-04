import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Resources | NormCore" };

const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Original, practical guidance",
    title: "Resources",
    introduction: "A growing library to help teams understand readiness concepts without reproducing the text of ISO publications. Detailed guides will be added as NormCore’s research is validated.",
    sections: [
      { id: "iso-iec-27001-overview", title: "ISO/IEC 27001 overview", body: "ISO/IEC 27001 is a management-system standard for protecting information through risk-based governance and continual improvement. NormCore’s first product scope concentrates on readiness for the 93 controls referenced in Annex A; it does not replace the complete standard or a certification audit." },
      { id: "security-glossary", title: "Security glossary", body: "The glossary will define practical terms used in the assessment, including control, evidence, applicability, implementation status, operating effectiveness, risk owner and remediation action. Definitions will be original, contextual and available in English and French." },
      { id: "guides", title: "Guides", body: "Planned guides include how to prepare useful evidence, how to distinguish a missing control from missing proof, how to assign remediation owners, and how to review an AI-generated policy draft." },
      { id: "contact", title: "Contact", body: "Questions, research participation and product feedback: contact@normcore.io. Please do not email confidential evidence or security credentials." },
    ],
    primaryLabel: "Create account",
    primaryHref: "/signup",
  },
  fr: {
    eyebrow: "Conseils originaux et pratiques",
    title: "Ressources",
    introduction: "Une bibliothèque en développement pour comprendre la préparation sans reproduire le texte des publications ISO. Les guides détaillés seront ajoutés après validation de la recherche NormCore.",
    sections: [
      { id: "iso-iec-27001-overview", title: "Présentation d’ISO/IEC 27001", body: "ISO/IEC 27001 est une norme de système de management destinée à protéger l’information par une gouvernance fondée sur les risques et l’amélioration continue. Le premier périmètre de NormCore se concentre sur la préparation aux 93 contrôles référencés dans l’Annexe A ; il ne remplace ni la norme complète ni un audit de certification." },
      { id: "security-glossary", title: "Glossaire de sécurité", body: "Le glossaire définira les termes pratiques de l’évaluation : contrôle, preuve, applicabilité, état de mise en œuvre, efficacité opérationnelle, propriétaire du risque et action de remédiation. Les définitions seront originales, contextualisées et bilingues." },
      { id: "guides", title: "Guides", body: "Les guides prévus expliqueront comment préparer des preuves utiles, distinguer un contrôle absent d’une preuve manquante, attribuer les remédiations et réviser un brouillon de politique généré avec l’IA." },
      { id: "contact", title: "Contact", body: "Questions, participation à la recherche et retours produit : contact@normcore.io. N’envoyez pas de preuves confidentielles ni d’identifiants de sécurité par e-mail." },
    ],
    primaryLabel: "Créer un compte",
    primaryHref: "/signup",
  },
};

export default function ResourcesPage() {
  return <PublicInfoPage content={content} />;
}
