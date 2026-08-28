export type PhysicalContextDecision = "yes" | "no" | "not_sure";

export const physicalQuickContextKeys = [
  "hasPhysicalLocationsSupportingScope",
  "usesThirdPartyManagedPremises",
  "receivesVisitorsOrDeliveries",
  "hasRestrictedOrSecureAreas",
  "usesIdentifiablePhysicalMonitoring",
  "allowsVisitorsOrContractorsInSecureAreas",
] as const;

export type PhysicalQuickContextKey = (typeof physicalQuickContextKeys)[number];
export type PhysicalQuickContextSource = "persisted_context" | "onboarding" | "shared_context" | "unknown";
export type PhysicalQuickContextQuestion = { contextKey: PhysicalQuickContextKey; fr: string; en: string };
export type PhysicalQuickContextResolution = { value: PhysicalContextDecision | undefined; source: PhysicalQuickContextSource; quickContextRequired: boolean; quickContextQuestion: PhysicalQuickContextQuestion };
export type PhysicalQuickContextInputs = {
  /** Explicit values persisted for Physical; only yes/no is a reliable resolved value. */
  persistedContext?: Partial<Record<PhysicalQuickContextKey, PhysicalContextDecision>>;
  /** Only pass onboarding facts that establish precisely the matching context key. */
  onboarding?: Partial<Record<PhysicalQuickContextKey, "yes" | "no">>;
  /** Only pass facts learned elsewhere when semantically identical to the context key. */
  sharedContext?: Partial<Record<PhysicalQuickContextKey, "yes" | "no">>;
};

export const physicalQuickContextQuestions: Record<PhysicalQuickContextKey, PhysicalQuickContextQuestion> = {
  hasPhysicalLocationsSupportingScope: { contextKey: "hasPhysicalLocationsSupportingScope", fr: "Votre organisation exploite-t-elle des locaux, installations ou espaces physiques dans lesquels des informations ou actifs relevant du périmètre sont stockés, traités ou accessibles ?", en: "Does your organization operate premises, facilities, or physical spaces where in-scope information or assets are stored, processed, or accessed?" },
  usesThirdPartyManagedPremises: { contextKey: "usesThirdPartyManagedPremises", fr: "Votre organisation utilise-t-elle des locaux ou installations pertinents gérés par un bailleur, un opérateur de site, un centre de données ou un autre tiers ?", en: "Does your organization use relevant premises or facilities managed by a landlord, site operator, data center, or another third party?" },
  receivesVisitorsOrDeliveries: { contextKey: "receivesVisitorsOrDeliveries", fr: "Vos locaux ou installations pertinents reçoivent-ils des visiteurs, prestataires ou livraisons nécessitant une gestion d’entrée ?", en: "Do your relevant premises or facilities receive visitors, contractors, or deliveries requiring entry management?" },
  hasRestrictedOrSecureAreas: { contextKey: "hasRestrictedOrSecureAreas", fr: "Votre organisation dispose-t-elle de zones physiques restreintes ou sécurisées nécessitant des règles de protection particulières ?", en: "Does your organization have restricted or secure physical areas requiring specific protection rules?" },
  usesIdentifiablePhysicalMonitoring: { contextKey: "usesIdentifiablePhysicalMonitoring", fr: "Votre organisation utilise-t-elle une surveillance physique permettant d’identifier des personnes, par exemple par vidéo, images ou enregistrements nominaux ?", en: "Does your organization use physical monitoring that can identify people, for example through video, images, or named records?" },
  allowsVisitorsOrContractorsInSecureAreas: { contextKey: "allowsVisitorsOrContractorsInSecureAreas", fr: "Des visiteurs ou prestataires sont-ils autorisés à entrer dans des zones sécurisées pertinentes ?", en: "Are visitors or contractors permitted to enter relevant secure areas?" },
};

function reliable(value: PhysicalContextDecision | undefined): value is "yes" | "no" { return value === "yes" || value === "no"; }

export function resolvePhysicalQuickContext(key: PhysicalQuickContextKey, inputs: PhysicalQuickContextInputs = {}): PhysicalQuickContextResolution {
  const persisted = inputs.persistedContext?.[key];
  if (reliable(persisted)) return { value: persisted, source: "persisted_context", quickContextRequired: false, quickContextQuestion: physicalQuickContextQuestions[key] };
  const onboarding = inputs.onboarding?.[key];
  if (reliable(onboarding)) return { value: onboarding, source: "onboarding", quickContextRequired: false, quickContextQuestion: physicalQuickContextQuestions[key] };
  const shared = inputs.sharedContext?.[key];
  if (reliable(shared)) return { value: shared, source: "shared_context", quickContextRequired: false, quickContextQuestion: physicalQuickContextQuestions[key] };
  return { value: persisted === "not_sure" ? "not_sure" : undefined, source: "unknown", quickContextRequired: true, quickContextQuestion: physicalQuickContextQuestions[key] };
}
