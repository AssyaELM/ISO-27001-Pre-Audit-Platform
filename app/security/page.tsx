import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Security | NormCore" };

const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Product security",
    title: "Security must be part of the product, not only its subject.",
    introduction: "NormCore is pre-launch and does not claim certification. These are the engineering principles that will guide the product before organizations entrust it with assessment data and evidence.",
    sections: [
      { title: "Access and isolation", body: "Workspace access will be authenticated, role-based and designed so one organization cannot access another organization’s data." },
      { title: "Data protection", body: "Transport encryption, protected storage, least-privilege service access, backups and auditable administrative operations are baseline requirements for the production architecture." },
      { title: "Evidence privacy", body: "Evidence may contain sensitive security information. Collection will be minimized, access restricted and retention controls made explicit before the Evidence Room is released." },
      { title: "AI boundaries", body: "AI features will be opt-in where appropriate, separated from final decisions and designed to avoid sending ISO publication text or unnecessary confidential evidence to model providers." },
      { title: "Responsible reporting", body: "A vulnerability-reporting channel and response process will be published before the public product launch." },
    ],
    primaryLabel: "Read the AI usage notice",
    primaryHref: "/ai-usage",
  },
  fr: {
    eyebrow: "Sécurité du produit",
    title: "La sécurité doit faire partie du produit, pas seulement de son sujet.",
    introduction: "NormCore est en pré-lancement et ne revendique aucune certification. Ces principes guideront le produit avant que des organisations lui confient leurs évaluations et leurs preuves.",
    sections: [
      { title: "Accès et isolation", body: "L’accès aux espaces sera authentifié, fondé sur les rôles et conçu pour empêcher une organisation d’accéder aux données d’une autre." },
      { title: "Protection des données", body: "Le chiffrement des échanges, le stockage protégé, le moindre privilège, les sauvegardes et la traçabilité des opérations administratives sont des exigences de base de l’architecture de production." },
      { title: "Confidentialité des preuves", body: "Les preuves peuvent contenir des informations de sécurité sensibles. Leur collecte sera limitée, leur accès restreint et leur conservation clairement contrôlée avant le lancement de l’espace de preuves." },
      { title: "Limites de l’IA", body: "Les fonctions IA seront optionnelles lorsque nécessaire, séparées des décisions finales et conçues pour ne pas transmettre aux fournisseurs de modèles le texte des publications ISO ni des preuves confidentielles inutiles." },
      { title: "Signalement responsable", body: "Un canal de signalement des vulnérabilités et un processus de réponse seront publiés avant le lancement public." },
    ],
    primaryLabel: "Lire la notice sur l’IA",
    primaryHref: "/ai-usage",
  },
};

export default function SecurityPage() {
  return <PublicInfoPage content={content} />;
}
