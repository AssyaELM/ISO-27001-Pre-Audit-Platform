import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A73AssessmentContext,
  type A73QuestionResolution,
  type SecureOfficesFacilitiesQuestionId,
  SECURING_OFFICES_FACILITIES_PLAN_CODE,
  securingOfficesFacilitiesQuestions,
  type SecureOfficesFacilitiesQuestion,
  SECURING_OFFICES_FACILITIES_GAP_CODES,
  resolveSecureOfficesFacilitiesQuestions,
} from "../../content/assessment/physical/securing-offices-rooms-facilities.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A73PlanOwnership =
  | "Facilities"
  | "Information Security"
  | "Architecture"
  | "Site Owners"
  | "Physical Security"
  | "Property Manager"
  | "GRC"
  | "IT"
  | "Asset Owners"
  | "Legal"
  | "Landlord Manager"
  | "Procurement";

export type A73SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A73SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: SecureOfficesFacilitiesQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A73PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A73ResponseInput = {
  questionId: SecureOfficesFacilitiesQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A73DerivedSubAction = A73SubActionDefinition & {
  status: A73SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A73RemediationPlanResult = {
  planCode: typeof SECURING_OFFICES_FACILITIES_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A73QuestionResolution["controlApplicability"];
  controlReviewState: A73QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A73QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: SecureOfficesFacilitiesQuestionId[];
  hiddenQuestionIds: SecureOfficesFacilitiesQuestionId[];
  activeActions: ReadonlyArray<A73DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: SecureOfficesFacilitiesQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A73_ACTIONS: Record<string, A73SubActionDefinition> = {
  "P7.3-A01": {
    actionCode: "P7.3-A01",
    sourceQuestionId: "p7_3_001",
    title: {
      fr: "Exigences de sécurisation",
      en: "Security requirements",
    },
    partialGap: {
      fr: "Exigences de sécurisation des locaux incomplètes",
      en: "Incomplete premises security requirements",
    },
    fullGap: {
      fr: "Absence d’exigences de sécurisation des locaux",
      en: "No premises security requirements",
    },
    partialDescription: {
      fr: "Des exigences existent, mais certains bureaux, salles, installations, actifs, activités, menaces, propriétaires, périodes d’inoccupation, dépendances tierces ou déclencheurs de mise à jour ne sont pas complètement couverts.",
      en: "Requirements exist, but certain offices, rooms, facilities, assets, activities, threats, owners, unoccupied periods, third-party dependencies, or update triggers are not fully covered.",
    },
    fullDescription: {
      fr: "L’organisation ne dispose d’aucune exigence documentée permettant de concevoir et protéger les bureaux, salles et installations en fonction des informations, actifs et risques concernés.",
      en: "The organization has no documented requirements for designing and protecting offices, rooms, and facilities according to relevant information, assets, and risks.",
    },
    recommendedActions: {
      fr: "- inventorier les bureaux, salles et installations ;\n- identifier les informations, équipements et autres actifs présents ;\n- identifier les activités et usages ;\n- évaluer la sensibilité, la criticité et les menaces ;\n- définir des exigences de protection proportionnées ;\n- couvrir les périodes occupées et inoccupées ;\n- considérer l’exposition au public et aux espaces communs ;\n- attribuer les propriétaires de zones ;\n- clarifier les dépendances envers les bailleurs et opérateurs ;\n- intégrer les règles de sécurité des personnes et d’accessibilité ;\n- définir les changements déclenchant une revue ;\n- documenter les mesures compensatoires ;\n- approuver et versionner les exigences.",
      en: "- inventory offices, rooms, and facilities;\n- identify information, equipment, and other assets present;\n- identify activities and uses;\n- assess sensitivity, criticality, and threats;\n- define proportionate protection requirements;\n- cover occupied and unoccupied periods;\n- consider exposure to the public and common areas;\n- assign area owners;\n- clarify landlord and operator dependencies;\n- incorporate life-safety and accessibility requirements;\n- define changes triggering review;\n- document compensating controls;\n- approve and version requirements.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Information Security", "Architecture", "Site Owners"],
    closureEvidence: {
      fr: "Des exigences approuvées couvrent tous les bureaux, salles et installations pertinents et sont reliées à leurs actifs, usages et risques.",
      en: "Approved requirements cover all relevant offices, rooms, and facilities and are linked to their assets, uses, and risks.",
    },
    closureCriteria: {
      fr: "Des exigences approuvées couvrent tous les bureaux, salles et installations pertinents et sont reliées à leurs actifs, usages et risques.",
      en: "Approved requirements cover all relevant offices, rooms, and facilities and are linked to their assets, uses, and risks.",
    },
    partialGapCode: "A7_3_SECURITY_DESIGN_PARTIAL",
    fullGapCode: "A7_3_SECURITY_DESIGN_ABSENT",
  },
  "P7.3-A02": {
    actionCode: "P7.3-A02",
    sourceQuestionId: "p7_3_002",
    title: {
      fr: "Protections physiques",
      en: "Physical protections",
    },
    partialGap: {
      fr: "Protection physique des locaux incomplète",
      en: "Incomplete physical protection of premises",
    },
    fullGap: {
      fr: "Bureaux, salles ou installations non protégés",
      en: "Offices, rooms, or facilities are not protected",
    },
    partialDescription: {
      fr: "Des protections sont mises en œuvre, mais certains bureaux, salles, points faibles, périodes d’inoccupation, risques d’observation, moyens de fermeture, rangements ou mesures compensatoires ne sont pas traités de manière cohérente.",
      en: "Protections are implemented, but certain offices, rooms, weak points, unoccupied periods, observation risks, closing arrangements, storage, or compensating controls are not addressed consistently.",
    },
    fullDescription: {
      fr: "Les locaux concernés ne disposent pas de protections physiques adaptées pour empêcher l’accès, l’observation, l’altération ou l’endommagement non autorisés.",
      en: "Relevant premises do not have appropriate physical protections against unauthorized access, observation, tampering, or damage.",
    },
    recommendedActions: {
      fr: "- inspecter les bureaux, salles et installations ;\n- comparer les protections aux exigences et risques ;\n- identifier les accès et points faibles ;\n- traiter les risques d’observation depuis l’extérieur ou les zones communes ;\n- protéger les informations et actifs laissés dans les locaux ;\n- définir les modalités de fermeture lorsque nécessaires ;\n- corriger les portes, fenêtres, serrures ou rangements défectueux ;\n- protéger les locaux pendant les périodes inoccupées ;\n- intégrer les changements temporaires ou travaux ;\n- limiter la divulgation inutile de l’emplacement d’actifs sensibles ;\n- vérifier les exigences d’évacuation et de sécurité des personnes ;\n- documenter les mesures compensatoires ;\n- tester et vérifier les corrections.",
      en: "- inspect offices, rooms, and facilities;\n- compare protection with requirements and risks;\n- identify access paths and weak points;\n- address observation risks from outside or common areas;\n- protect information and assets left in premises;\n- define closing arrangements where needed;\n- remediate defective doors, windows, locks, or storage;\n- protect premises during unoccupied periods;\n- incorporate temporary changes or construction work;\n- limit unnecessary disclosure of sensitive asset locations;\n- verify evacuation and life-safety requirements;\n- document compensating controls;\n- test and verify corrections.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "Physical Security", "Site Owners"],
    closureEvidence: {
      fr: "Les protections observées correspondent aux risques documentés et les défauts prioritaires sont corrigés ou couverts par des mesures compensatoires approuvées.",
      en: "Observed protections correspond to documented risks, and priority defects are remediated or covered by approved compensating controls.",
    },
    closureCriteria: {
      fr: "Les protections observées correspondent aux risques documentés et les défauts prioritaires sont corrigés ou couverts par des mesures compensatoires approuvées.",
      en: "Observed protections correspond to documented risks, and priority defects are remediated or covered by approved compensating controls.",
    },
    partialGapCode: "A7_3_FACILITY_PROTECTION_PARTIAL",
    fullGapCode: "A7_3_FACILITY_PROTECTION_ABSENT",
  },
  "P7.3-A03": {
    actionCode: "P7.3-A03",
    sourceQuestionId: "p7_3_003",
    title: {
      fr: "Assurance et changements",
      en: "Assurance and changes",
    },
    partialGap: {
      fr: "Inspection et suivi des locaux incomplets",
      en: "Incomplete premises inspection and follow-up",
    },
    fullGap: {
      fr: "Absence de preuve de maintien des protections des locaux",
      en: "No evidence that premises protections are maintained",
    },
    partialDescription: {
      fr: "Certaines inspections ou réparations sont réalisées, mais les défauts, changements d’aménagement, travaux, occupations temporaires, protections fournies par des tiers, exceptions ou décisions de clôture ne sont pas entièrement traçables.",
      en: "Some inspections or repairs are performed, but defects, layout changes, construction work, temporary occupancy, third-party protections, exceptions, or closure decisions are not fully traceable.",
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que les protections physiques sont inspectées, réparées et adaptées lorsque l’usage ou l’aménagement des locaux change.",
      en: "The organization cannot demonstrate that physical protections are inspected, repaired, and adapted when premises use or layout changes.",
    },
    recommendedActions: {
      fr: "- définir les preuves minimales ;\n- organiser des inspections proportionnées ;\n- enregistrer les défauts ;\n- créer et attribuer les actions de réparation ;\n- vérifier les corrections ;\n- contrôler les changements d’aménagement ou d’usage ;\n- encadrer les travaux et interventions ;\n- traiter les occupations et stockages temporaires ;\n- conserver les preuves des bailleurs ou opérateurs ;\n- enregistrer les protections indisponibles ;\n- documenter les exceptions et mesures compensatoires ;\n- suivre les actions jusqu’à clôture.",
      en: "- define minimum evidence;\n- arrange proportionate inspections;\n- record defects;\n- create and assign repair actions;\n- verify corrections;\n- control layout or use changes;\n- govern construction and contractor work;\n- address temporary occupancy and storage;\n- retain landlord or operator evidence;\n- record unavailable protections;\n- document exceptions and compensating controls;\n- track actions to closure.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Property Manager", "GRC", "Site Owners"],
    closureEvidence: {
      fr: "Un échantillon démontre qu’un défaut ou changement est identifié, attribué, traité, vérifié et clôturé.",
      en: "A sample demonstrates that a defect or change is identified, assigned, addressed, verified, and closed.",
    },
    closureCriteria: {
      fr: "Un échantillon démontre qu’un défaut ou changement est identifié, attribué, traité, vérifié et clôturé.",
      en: "A sample demonstrates that a defect or change is identified, assigned, addressed, verified, and closed.",
    },
    partialGapCode: "A7_3_FACILITY_ASSURANCE_PARTIAL",
    fullGapCode: "A7_3_FACILITY_ASSURANCE_ABSENT",
  },
  "P7.3-A04": {
    actionCode: "P7.3-A04",
    sourceQuestionId: "p7_3_004_restricted_areas",
    title: {
      fr: "Zones restreintes",
      en: "Restricted areas",
    },
    partialGap: {
      fr: "Protection renforcée des zones restreintes incomplète",
      en: "Incomplete enhanced protection for restricted areas",
    },
    fullGap: {
      fr: "Zones restreintes sans protection adaptée",
      en: "Restricted areas lack appropriate protection",
    },
    partialDescription: {
      fr: "Des zones restreintes sont identifiées ou protégées, mais certaines zones, limites, autorisations, périodes d’inoccupation, visiteurs, inspections ou mesures compensatoires ne sont pas couvertes de manière cohérente.",
      en: "Restricted areas are identified or protected, but certain areas, boundaries, authorizations, unoccupied periods, visitors, inspections, or compensating controls are not covered consistently.",
    },
    fullDescription: {
      fr: "Des informations ou actifs critiques sont présents dans des zones nécessitant une protection renforcée, mais cette protection n’est ni définie ni mise en œuvre.",
      en: "Critical information or assets are located in areas requiring enhanced protection, but that protection is neither defined nor implemented.",
    },
    recommendedActions: {
      fr: "- inventorier les zones restreintes ;\n- justifier leur criticité ;\n- identifier les actifs et activités présents ;\n- définir le niveau de protection renforcé nécessaire ;\n- limiter les accès et points de passage selon le risque ;\n- protéger les limites et moyens d’accès ;\n- traiter les périodes d’inoccupation ;\n- définir les règles visiteurs et prestataires ;\n- protéger la confidentialité de l’emplacement ou de l’usage lorsque pertinent ;\n- définir les inspections et vérifications ;\n- corriger les défauts ;\n- documenter les mesures compensatoires ;\n- vérifier l’efficacité des protections.",
      en: "- inventory restricted areas;\n- justify their criticality;\n- identify assets and activities present;\n- define the required enhanced protection level;\n- limit access and access points according to risk;\n- protect boundaries and credentials;\n- address unoccupied periods;\n- define visitor and contractor rules;\n- protect confidentiality of location or use where relevant;\n- define inspections and checks;\n- remediate defects;\n- document compensating controls;\n- verify protection effectiveness.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "IT", "Information Security", "Asset Owners"],
    closureEvidence: {
      fr: "Chaque zone restreinte dispose de protections approuvées et proportionnées à sa criticité, avec une preuve de leur fonctionnement.",
      en: "Each restricted area has approved protection proportionate to its criticality, with evidence that it operates as intended.",
    },
    closureCriteria: {
      fr: "Chaque zone restreinte dispose de protections approuvées et proportionnées à sa criticité, avec une preuve de leur fonctionnement.",
      en: "Each restricted area has approved protection proportionate to its criticality, with evidence that it operates as intended.",
    },
    partialGapCode: "A7_3_RESTRICTED_AREAS_PARTIAL",
    fullGapCode: "A7_3_RESTRICTED_AREAS_ABSENT",
  },
  "P7.3-A05": {
    actionCode: "P7.3-A05",
    sourceQuestionId: "p7_3_005_shared_premises",
    title: {
      fr: "Locaux partagés",
      en: "Shared premises",
    },
    partialGap: {
      fr: "Protection des locaux partagés incomplète",
      en: "Incomplete protection of shared premises",
    },
    fullGap: {
      fr: "Risques des locaux partagés non maîtrisés",
      en: "Shared-premises risks are not controlled",
    },
    partialDescription: {
      fr: "Des protections ou responsabilités existent, mais certaines zones communes, autres occupants, prestations de nettoyage ou maintenance, visiteurs, livraisons, changements ou mesures compensatoires ne sont pas complètement couverts.",
      en: "Protections or responsibilities exist, but certain common areas, other occupants, cleaning or maintenance services, visitors, deliveries, changes, or compensating controls are not fully covered.",
    },
    fullDescription: {
      fr: "L’organisation utilise des locaux partagés ou gérés par un tiers sans délimitation suffisante des zones, responsabilités et protections nécessaires aux informations et actifs concernés.",
      en: "The organization uses shared or third-party-managed premises without sufficient definition of the areas, responsibilities, and protections needed for relevant information and assets.",
    },
    recommendedActions: {
      fr: "- inventorier les locaux partagés ou gérés par un tiers ;\n- identifier les zones communes et réservées ;\n- clarifier les responsabilités du locataire, bailleur et opérateur ;\n- évaluer l’exposition aux autres occupants ;\n- traiter les accès partagés ;\n- définir les règles de nettoyage et maintenance ;\n- encadrer les travaux et interventions ;\n- traiter les visiteurs et livraisons ;\n- protéger les écrans, documents et actifs ;\n- vérifier les contrôles fournis par le gestionnaire ;\n- définir les notifications d’incident et de changement ;\n- intégrer les exigences aux contrats ou règles du site ;\n- documenter les exceptions et mesures compensatoires ;\n- revoir périodiquement les risques selon les changements, sans cadence universelle imposée.",
      en: "- inventory shared or third-party-managed premises;\n- identify common and restricted areas;\n- clarify tenant, landlord, and operator responsibilities;\n- assess exposure to other occupants;\n- address shared access;\n- define cleaning and maintenance rules;\n- govern construction and contractor work;\n- address visitors and deliveries;\n- protect screens, documents, and assets;\n- verify controls provided by the operator;\n- define incident and change notifications;\n- incorporate requirements into agreements or site rules;\n- document exceptions and compensating controls;\n- review risks when changes occur without imposing a universal cadence.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Legal", "Landlord Manager", "Procurement", "Information Security"],
    closureEvidence: {
      fr: "Les zones, responsabilités et protections des locaux partagés sont documentées, contractuellement cohérentes et vérifiables.",
      en: "Areas, responsibilities, and protections for shared premises are documented, contractually consistent, and verifiable.",
    },
    closureCriteria: {
      fr: "Les zones, responsabilités et protections des locaux partagés sont documentées, contractuellement cohérentes et vérifiables.",
      en: "Areas, responsibilities, and protections for shared premises are documented, contractually consistent, and verifiable.",
    },
    partialGapCode: "A7_3_SHARED_PREMISES_PARTIAL",
    fullGapCode: "A7_3_SHARED_PREMISES_ABSENT",
  }
} as const;

const actionByQuestionId = new Map<SecureOfficesFacilitiesQuestionId, A73SubActionDefinition>(
  Object.values(A73_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<SecureOfficesFacilitiesQuestionId, LocalizedText> = {
  "p7_3_001": {
    fr: "Demander à Facilities, aux propriétaires de zones et à la sécurité quels locaux contiennent des actifs ou activités du SMSI et quelles protections sont attendues.",
    en: "Ask Facilities, area owners, and Information Security which premises contain ISMS assets or activities and which protections are expected.",
  },
  "p7_3_002": {
    fr: "Réaliser une inspection des locaux avec Facilities et les propriétaires de zones afin d’identifier les risques d’accès, d’observation, d’altération ou de dommage.",
    en: "Inspect the premises with Facilities and area owners to identify risks of access, observation, tampering, or damage.",
  },
  "p7_3_003": {
    fr: "Identifier où sont conservés les rapports d’inspection, changements, travaux, tickets de réparation, preuves tierces, exceptions et validations de clôture.",
    en: "Identify where inspection reports, changes, work records, repair tickets, third-party evidence, exceptions, and closure approvals are retained.",
  },
  "p7_3_004_restricted_areas": {
    fr: "Demander aux propriétaires d’actifs et à Facilities quelles zones nécessitent une protection supérieure à celle des bureaux ordinaires.",
    en: "Ask asset owners and Facilities which areas require protection beyond that of ordinary offices.",
  },
  "p7_3_005_shared_premises": {
    fr: "Demander au gestionnaire du site et au propriétaire du contrat quelles protections sont fournies et quelles responsabilités restent à la charge de l’organisation.",
    en: "Ask the site operator and contract owner which protections are provided and which responsibilities remain with the organization.",
  },
};

const questionQuestionMap = new Map<SecureOfficesFacilitiesQuestionId, SecureOfficesFacilitiesQuestion>(
  securingOfficesFacilitiesQuestions.map((question) => [question.id, question]),
);

export function deriveSecureOfficesFacilitiesRemediationPlan(
  responses: A73ResponseInput[],
  context: A73AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A73RemediationPlanResult {
  const resolution = resolveSecureOfficesFacilitiesQuestions(context);
  const latestResponses = new Map<SecureOfficesFacilitiesQuestionId, A73ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const isControlApplicableNo = resolution.controlApplicability === "not_applicable";
  const isControlUnresolved = resolution.controlApplicability === "unresolved";
  const controlJustification = controlApplicabilityJustification?.trim() ?? "";

  if (isControlApplicableNo) {
    const isBlocked = !controlJustification;
    return {
      planCode: SECURING_OFFICES_FACILITIES_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et maintenir la protection physique des bureaux, salles et installations",
        en: "Define, implement, and maintain physical protection for offices, rooms, and facilities",
      },
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      assessmentBlocked: isBlocked,
      unresolvedConditions: resolution.unresolvedConditions,
      visibleQuestionIds: resolution.questionIds,
      hiddenQuestionIds: resolution.hiddenQuestionIds,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: isBlocked
        ? []
        : [{ fr: controlApplicabilityJustification ?? "", en: controlApplicabilityJustification ?? "" }],
    };
  }

  if (isControlUnresolved) {
    return {
      planCode: SECURING_OFFICES_FACILITIES_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et maintenir la protection physique des bureaux, salles et installations",
        en: "Define, implement, and maintain physical protection for offices, rooms, and facilities",
      },
      controlApplicability: "unresolved",
      controlReviewState: "clarification_required",
      requiresControlJustification: false,
      assessmentBlocked: true,
      unresolvedConditions: resolution.unresolvedConditions,
      visibleQuestionIds: resolution.questionIds,
      hiddenQuestionIds: resolution.hiddenQuestionIds,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: [],
    };
  }

  const activeActionsByCode = new Map<string, A73DerivedSubAction>();
  const clarifications: Array<{ questionId: SecureOfficesFacilitiesQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<SecureOfficesFacilitiesQuestionId>(resolution.questionIds);

  for (const response of latestResponses.values()) {
    if (!visibleIds.has(response.questionId)) continue;

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      justification: response.justification,
      evidenceStatus: response.evidenceStatus,
    });

    if (!outcome.isValid) {
      throw new Error(`Invalid response for question ${response.questionId}: ${outcome.errorCode}`);
    }

    if (outcome.reviewState === "clarification_required") {
      clarifications.push({
        questionId: response.questionId,
        question: questionClarifications[response.questionId],
      });
    }

    if (outcome.createsGapAction === "none") continue;

    const subAction = actionByQuestionId.get(response.questionId);
    if (!subAction) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? subAction.partialGapCode : subAction.fullGapCode;
    const priority = gapType === "partial" ? subAction.partialPriority : subAction.fullPriority;
    const existing = activeActionsByCode.get(subAction.actionCode);
    if (!existing) {
      activeActionsByCode.set(subAction.actionCode, {
        ...subAction,
        status: "active",
        gapType,
        gapCode,
        priority
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.priority = priority;
    }
  }

  const activeActions = [...activeActionsByCode.values()];
  return {
    planCode: SECURING_OFFICES_FACILITIES_PLAN_CODE,
    title: {
      fr: "Définir, appliquer et maintenir la protection physique des bureaux, salles et installations",
      en: "Define, implement, and maintain physical protection for offices, rooms, and facilities",
    },
    controlApplicability: "applicable",
    controlReviewState: resolution.controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    assessmentBlocked: resolution.assessmentBlocked,
    unresolvedConditions: resolution.unresolvedConditions,
    visibleQuestionIds: [...resolution.questionIds],
    hiddenQuestionIds: [...resolution.hiddenQuestionIds],
    activeActions,
    clarifications: [...clarifications],
    applicabilityReviews,
  };
};

export {
  A73_ACTIONS as securingOfficesFacilitiesActions,
  type A73ResponseInput as securingOfficesFacilitiesResponseInput,
  SECURING_OFFICES_FACILITIES_GAP_CODES as securingOfficesFacilitiesGapCodes,
};
