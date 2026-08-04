import type { Metadata } from "next";
import { PublicInfoPage, type PublicPageContent } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Terms of Service | NormCore" };

const operator = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME ?? "NormCore";
const content: Record<"en" | "fr", PublicPageContent> = {
  en: {
    eyebrow: "Draft · 31 July 2026",
    title: "Website Terms",
    introduction: `These draft terms apply to the public pre-launch website operated under the name ${operator}. Product subscription terms will be published before paid access begins.`,
    sections: [
      { title: "Informational purpose", body: "The website presents a product under development. Descriptions of planned capabilities are not a guarantee that every feature is currently available or will launch unchanged." },
      { title: "No certification or legal advice", body: "NormCore is not ISO, an auditor or a certification body. Website content is general information and does not replace professional, legal or certification advice." },
      { title: "Permitted use", body: "You may use this website lawfully and must not interfere with its operation, attempt unauthorized access or submit harmful or misleading content." },
      { title: "Intellectual property", body: "NormCore branding, original copy and software are protected by applicable rights. ISO and ISO/IEC 27001 names belong to their respective rights holders; no affiliation is claimed." },
      { title: "Changes", body: "These pre-launch terms may change as the product, operator details and commercial model are finalized. Material production terms will be presented before account or paid use." },
    ],
  },
  fr: {
    eyebrow: "Brouillon · 31 juillet 2026",
    title: "Conditions du site",
    introduction: `Ces conditions provisoires s’appliquent au site public de pré-lancement exploité sous le nom ${operator}. Les conditions d’abonnement seront publiées avant toute offre payante.`,
    sections: [
      { title: "Objet informatif", body: "Le site présente un produit en développement. La description des capacités prévues ne garantit pas que chaque fonction soit déjà disponible ni qu’elle sera lancée sans modification." },
      { title: "Ni certification ni conseil juridique", body: "NormCore n’est ni ISO, ni un auditeur, ni un organisme certificateur. Le contenu est général et ne remplace pas un accompagnement professionnel, juridique ou de certification." },
      { title: "Utilisation autorisée", body: "Vous devez utiliser ce site légalement, sans perturber son fonctionnement, tenter un accès non autorisé ni transmettre de contenu nuisible ou trompeur." },
      { title: "Propriété intellectuelle", body: "La marque, les contenus originaux et le logiciel NormCore sont protégés. Les noms ISO et ISO/IEC 27001 appartiennent à leurs titulaires respectifs ; aucune affiliation n’est revendiquée." },
      { title: "Évolutions", body: "Ces conditions peuvent évoluer avec le produit, l’identité de l’exploitant et le modèle commercial. Les conditions définitives seront présentées avant l’ouverture des comptes ou des paiements." },
    ],
  },
};

export default function TermsPage() {
  return <PublicInfoPage content={content} />;
}
