import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "AI Usage Notice | NormCore" };

const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Product principle",
    title: "AI assists. People decide.",
    introduction: "AI features are planned for NormCore but are not used by the current account authentication flow. This notice describes their intended boundaries before release.",
    sections: [
      { title: "Intended uses", body: "AI may explain security concepts, summarize user-confirmed gaps, suggest remediation steps and prepare editable document drafts from approved organization context." },
      { title: "Decisions AI will not make", body: "AI will not certify an organization, approve evidence, accept risk, determine final applicability or replace qualified professional judgment." },
      { title: "Data minimization", body: "Only information necessary for the requested task should be sent to a model provider. Sensitive evidence should not be transmitted by default." },
      { title: "ISO content", body: "NormCore will not send copied ISO publication text to model providers or present generated content as the official standard. Assessment content must be original or appropriately licensed." },
      { title: "Human review", body: "Generated material is always a draft. Users must review accuracy, ownership, responsibilities, dates and real operating practices before approval or export." },
    ],
  },
  fr: {
    eyebrow: "Principe produit",
    title: "L’IA assiste. Les personnes décident.",
    introduction: "Des fonctions IA sont prévues dans NormCore mais ne sont pas utilisées par le parcours actuel d’authentification des comptes. Cette notice décrit leurs limites avant leur lancement.",
    sections: [
      { title: "Usages prévus", body: "L’IA pourra expliquer des concepts de sécurité, résumer des gaps confirmés, proposer des remédiations et préparer des brouillons modifiables à partir du contexte approuvé de l’organisation." },
      { title: "Décisions exclues", body: "L’IA ne certifiera pas une organisation, ne validera pas les preuves, n’acceptera pas les risques, ne décidera pas seule de l’applicabilité et ne remplacera pas le jugement professionnel." },
      { title: "Minimisation des données", body: "Seules les informations nécessaires à la tâche demandée devraient être transmises au fournisseur de modèle. Les preuves sensibles ne doivent pas l’être par défaut." },
      { title: "Contenu ISO", body: "NormCore ne transmettra pas aux fournisseurs de modèles le texte copié des publications ISO et ne présentera pas un contenu généré comme la norme officielle. Le contenu d’évaluation doit être original ou correctement licencié." },
      { title: "Validation humaine", body: "Tout contenu généré reste un brouillon. L’utilisateur doit vérifier son exactitude, les responsables, les dates et les pratiques réelles avant validation ou export." },
    ],
  },
};

export default function AIUsagePage() {
  return <PublicInfoPage content={content} />;
}
