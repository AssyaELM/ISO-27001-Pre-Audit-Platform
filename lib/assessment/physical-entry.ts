import type { ScreeningAnswerValue } from "./outcomes.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";
import type { ScreeningEvidenceStatus } from "./outcomes.ts";
import {
  type A72AssessmentContext,
  type A72QuestionId,
  type A72QuestionResolution,
  type A72PhysicalEntryQuestion,
  A72QuestionIds,
  physicalEntryQuestions,
  PHYSICAL_ENTRY_PLAN_CODE,
  PHYSICAL_ENTRY_PLAN_TITLE,
  PHYSICAL_ENTRY_GAP_CODES,
  resolvePhysicalEntryQuestions,
} from "../../content/assessment/physical/physical-entry.ts";

export type LocalizedText = { fr: string; en: string };
type Priority = "low" | "medium" | "high";

export type A72PlanOwnership =
  | "Facilities"
  | "Information Security"
  | "Site Owners"
  | "Physical Security"
  | "GRC"
  | "Supplier Manager"
  | "Procurement"
  | "Legal"
  | "Privacy"
  | "Health and Safety"
  | "HR"
  | "Reception";

export type A72ResponseInput = {
  questionId: A72QuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: ScreeningEvidenceStatus;
};

export type A72QuestionRemediation = {
  actionCode: string;
  sourceQuestionId: A72QuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  priority: Priority;
  owners: ReadonlyArray<A72PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A72SubActionStatus = "active" | "resolved";

export type A72DerivedSubAction = A72QuestionRemediation & {
  status: A72SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type A72RemediationPlanResult = {
  planCode: typeof PHYSICAL_ENTRY_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A72QuestionResolution["controlApplicability"];
  controlReviewState: A72QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A72QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: A72QuestionId[];
  hiddenQuestionIds: A72QuestionId[];
  activeActions: ReadonlyArray<A72DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: A72QuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A72_ACTIONS: Record<string, A72QuestionRemediation> = {
  "P7.2-A01": {
    actionCode: "P7.2-A01",
    sourceQuestionId: "p7_2_001",
    title: {
      fr: "Mettre en place un processus formel d'autorisation des accès physiques",
      en: "Implement a complete and proportioned personnel screening process",
    },
    partialGap: {
      fr: "Processus d'autorisation des accès physiques incomplet",
      en: "Incomplete physical access authorization process",
    },
    fullGap: {
      fr: "Absence de processus d'autorisation des accès physiques",
      en: "No physical access authorization process",
    },
    partialDescription: {
      fr: "Un processus existe, mais certaines zones, catégories d'accès, responsabilités, approbateurs, changements de rôle, accès temporaires, révocations ou exceptions ne sont pas complètement définis.",
      en: "A process exists, but certain areas, access categories, responsibilities, approvers, role changes, temporary access, revocations, or exceptions are not fully defined.",
    },
    fullDescription: {
      fr: "L'organisation ne dispose d'aucun processus documenté permettant de déterminer qui peut accéder aux zones physiques concernées, selon quelles conditions et avec quelle approbation.",
      en: "The organization has no documented process for determining who may access relevant physical areas, under which conditions and with whose approval.",
    },
    recommendedActions: {
      fr: "Inventorier les zones concernÃ©es ; identifier leurs propriÃ©taires ; dÃ©finir les personnes ou rÃ´les autorisÃ©es ; dÃ©finir les critÃ¨res d'accÃ¨s ; attribuer les approbateurs ; dÃ©finir les accÃ¨s permanents, temporaires et urgents ; intÃ©grer les changements de rÃ´le et dÃ©parts ; dÃ©finir les rÃ¨gles de rÃ©vocation ; formaliser les exceptions ; faire approuver et communiquer le processus ; versionner les rÃ¨gles.",
      en: "Inventory relevant areas; identify owners; define authorized people or roles; define access criteria; assign approvers; define permanent, temporary, and emergency access; incorporate role changes and departures; define revocation rules; formalize exceptions; approve and communicate the process; version the requirements.",
    },
    priority: "medium",
    owners: ["Facilities", "HR", "Information Security", "Site Owners"],
    closureEvidence: {
      fr: "Une procÃ©dure approuvÃ©e permet de relier chaque type d'accÃ¨s physique Ã  une zone, un besoin, un approbateur et une rÃ¨gle de rÃ©vocation.",
      en: "An approved procedure links each physical access type to an area, business need, approver, and revocation rule.",
    },
    closureCriteria: {
      fr: "Une procÃ©dure approuvÃ©e permet de relier chaque type d'accÃ¨s physique Ã  une zone, un besoin, un approbateur et une rÃ¨gle de rÃ©vocation.",
      en: "An approved procedure links each physical access type to an area, business need, approver, and revocation rule.",
    },
    partialGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_001"].partial,
    fullGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_001"].full,
  },
  "P7.2-A02": {
    actionCode: "P7.2-A02",
    sourceQuestionId: "p7_2_002",
    title: {
      fr: "Assurer la gestion des points d'entrée et des moyens d'accÃ¨s",
      en: "Ensure entry-point and access credential management",
    },
    partialGap: {
      fr: "ContrÃ´le des entrÃ©es ou moyens d'accÃ¨s incomplet",
      en: "Incomplete entry control or access credential management",
    },
    fullGap: {
      fr: "EntrÃ©es physiques non contrÃ´lÃ©es",
      en: "Physical entry is not controlled",
    },
    partialDescription: {
      fr: "Des contrÃ´les existent, mais certains points d'entrÃ©e, moyens d'accÃ¨s, utilisateurs, accÃ¨s temporaires, pertes, restitutions ou dÃ©sactivations ne sont pas gÃ©rÃ©s de maniÃ¨re cohÃ©rente.",
      en: "Controls exist, but certain entry points, credentials, users, temporary access, losses, returns or disabling activities are not managed consistently.",
    },
    fullDescription: {
      fr: "Des zones pertinentes sont accessibles sans vÃ©rification appropriÃ©e des autorisations ni gestion contrÃ´lÃ©e des clÃ©s, badges, codes ou autres moyens d'accÃ¨s.",
      en: "Relevant areas can be accessed without appropriate authorization checks or controlled management of keys, badges, codes, or other access credentials.",
    },
    recommendedActions: {
      fr: "Inventorier les points d'entrÃ©e et de sortie ; inventorier les moyens d'accÃ¨s ; comparer les contrÃ´les aux risques ; sÃ©curiser lâ€™Ã©mission et lâ€™attribution ; traiter le partage, la copie ou l'utilisation non autorisÃ©e ; dÃ©finir le traitement des pertes et vols ; organiser la restitution et la dÃ©sactivation ; couvrir les accÃ¨s temporaires et urgents ; intÃ©grer les dÃ©parts et changements de rÃ´le ; vÃ©rifier les issues de secours avec fonctions santÃ©-sÃ©curitÃ© ; corriger les points non contrÃ´lÃ©s ; documenter les mesures compensatoires ; tester un Ã©chantillon.",
      en: "Inventory entry and exit points; inventory access credentials; compare controls with risk; secure issuance and assignment; address unauthorized sharing, copying, or use; define handling of loss and theft; arrange return and disabling; cover temporary and emergency access; incorporate departures and role changes; review emergency exits with health and safety functions; remediate uncontrolled points; document compensating controls; test a sample.",
    },
    priority: "high",
    owners: ["Facilities", "Physical Security", "Site Owners"],
    closureEvidence: {
      fr: "Un Ã©chantillon dÃ©montre qu’un moyen d’accÃ¨s est autorisÃ©, attribuÃ©, utilisÃ©, rÃ©cupÃ©rÃ© ou dÃ©sactivÃ© selon le processus dÃ©fini.",
      en: "A sample demonstrates that an access credential is authorized, assigned, used, returned, or disabled according to the defined process.",
    },
    closureCriteria: {
      fr: "Un Ã©chantillon montre qu’un moyen d'accÃ¨s est autorisÃ©, attribuÃ©, utilisÃ©, rÃ©cupÃ©rÃ© ou dÃ©sactivÃ© selon le processus dÃ©fini.",
      en: "A sample demonstrates that an access credential is authorized, assigned, used, returned, or disabled according to the defined process.",
    },
    partialGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_002"].partial,
    fullGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_002"].full,
  },
  "P7.2-A03": {
    actionCode: "P7.2-A03",
    sourceQuestionId: "p7_2_003",
    title: {
      fr: "Mettre en place la tracÃ©abilitÃ© et la revue",
      en: "Implement physical access traceability and review",
    },
    partialGap: {
      fr: "TraÃ§abilitÃ© ou revue des accÃ¨s physiques incomplÃ¨te",
      en: "Incomplete physical access traceability or review",
    },
    fullGap: {
      fr: "Absence de preuve des autorisations et retraits d'accÃ¨s",
      en: "No evidence of physical access authorization and removal",
    },
    partialDescription: {
      fr: "Certaines autorisations ou activitÃ©s sont enregistrÃ©es, mais les revues, retraits, accÃ¨s temporaires, anomalies, exceptions, incidents ou dÃ©cisions de cloture ne sont pas entiÃ¨rement traÃ§ables.",
      en: "Some authorizations or activities are recorded, but reviews, removals, temporary access, anomalies, exceptions, incidents, or closure decisions are not fully traceable.",
    },
    fullDescription: {
      fr: "L'organisation ne peut pas dÃ©montrer qui est autorisÃ© Ã  accÃ©der aux zones concernÃ©es, quels moyens ont Ã©tÃ© attribuÃ©s ou si les accÃ¨s devenus inutiles ont Ã©tÃ© retirÃ©s.",
      en: "The organization cannot demonstrate who is authorized to access relevant areas, which credentials have been assigned, or whether unnecessary access has been removed.",
    },
    recommendedActions: {
      fr: "DÃ©finir les preuves minimales attendues ; centraliser les autorisations ; relier les moyens d'accÃ¨s aux personnes ou rÃ´les ; enregistrer les accÃ¨s temporaires et leur expiration ; conserver les retraits et dÃ©sactivations ; rapprocher les accÃ¨s avec les changements RH lorsque pertinent ; dÃ©finir des revues proportionnÃ©es au risque ; enregistrer les anomalies et accÃ¨s refusÃ©s ; enregistrer les pertes ou vols ; gÃ©rer les exceptions ; attribuer les actions correctives ; suivre les Ã©carts jusqu'Ã  cloture.",
      en: "Define minimum expected evidence; centralize authorizations; link credentials to people or roles; record temporary access and expiry; retain removals and disabling evidence; reconcile access with HR changes where relevant; define risk-based reviews; record anomalies and denied access; record loss or theft; manage exceptions; assign corrective actions; track gaps to closure.",
    },
    priority: "medium",
    owners: ["Facilities", "GRC", "Information Security", "HR"],
    closureEvidence: {
      fr: "Un Ã©chantillon permet de retracer une autorisation depuis sa demande jusqu'Ã  sa revue, son expiration, sa restitution ou sa rÃ©vocation.",
      en: "A sample traces an authorization from request through review, expiry, return, or revocation.",
    },
    closureCriteria: {
      fr: "Un Ã©chantillon permet de retracer une autorisation depuis sa demande jusqu’Ã  sa revue, son expiration, sa restitution ou sa rÃ©vocation.",
      en: "A sample traces an authorization from request through review, expiry, return, or revocation.",
    },
    partialGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_003"].partial,
    fullGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_003"].full,
  },
  "P7.2-A04": {
    actionCode: "P7.2-A04",
    sourceQuestionId: "p7_2_004_visitors_deliveries",
    title: {
      fr: "ContrÃ´ler les visiteurs, prestataires et livraisons selon le risque",
      en: "Control visitors, contractors, or delivery management",
    },
    partialGap: {
      fr: "Gestion des visiteurs, prestataires ou livraisons incomplÃ¨te",
      en: "Incomplete visitor, contractor, or delivery management",
    },
    fullGap: {
      fr: "Absence de contrÃ´le des visiteurs et livraisons",
      en: "No visitor or delivery control",
    },
    partialDescription: {
      fr: "Un dispositif existe, mais certaines catÃ©gories de visiteurs, zones, autorisations, identifications, accompagnements, restitutions, interventions de prestataires ou livraisons ne sont pas couvertes de maniÃ¨re cohÃ©rente.",
      en: "Arrangements exist, but certain visitor categories, areas, authorizations, identifications, escort, credentials return, contractor interventions, or deliveries are not consistently covered.",
    },
    fullDescription: {
      fr: "Des visiteurs, prestataires ou livreurs peuvent accÃ©der aux locaux sans processus dÃ©fini d'autorisation, d'identification, de limitation des zones et de traÃ§abilitÃ© proportionnÃ©e.",
      en: "Visitors, contractors, or delivery personnel may access premises without a defined process for authorization, identification, area limitation, and proportionate traceability.",
    },
    recommendedActions: {
      fr: "Identifier les catÃ©gories de visiteurs et prestataires ; dÃ©finir les rÃ´les des hÃ´tes ou sponsors ; dÃ©finir les autorisations nÃ©cessaires ; choisir une mÃ©thode proportionnÃ©e de vÃ©rification ; dÃ©finir les zones accessibles ; dÃ©finir les rÃ¨gles d'accompagnement selon le risque ; dÃ©finir lâ€™identification lorsqu'elle est nÃ©cessaire ; organiser la restitution des moyens d'accÃ¨s ; traiter les interventions techniques ; sÃ©curiser les zones de livraison ou rÃ©ception ; limiter les donnÃ©es collectÃ©es ; dÃ©finir une conservation justifiÃ©e ; enregistrer les incidents et exceptions ; communiquer les rÃ¨gles aux personnes concernÃ©es ; vÃ©rifier un Ã©chantillon.",
      en: "Identify visitor and contractor categories; define host roles; define required authorizations; select proportionate verification methods; define accessible areas; define risk-based escort rules; define identification where needed; arrange return of access credentials; address technical interventions; secure delivery/receiving areas; limit collected data; define justified retention; record incidents and exceptions; communicate rules; review a sample.",
    },
    priority: "medium",
    owners: ["Reception", "Facilities", "Procurement", "Physical Security", "Site Owners"],
    closureEvidence: {
      fr: "Un visiteur, prestataire ou livreur peut Ãªtre retracÃ© depuis son autorisation jusqu'Ã  sa sortie ou la fin de son intervention, selon un niveau de contrÃ´le adaptÃ© au risque.",
      en: "A visitor, contractor, or delivery person can be traced from authorization through departure or completion of the intervention, using controls appropriate to risk.",
    },
    closureCriteria: {
      fr: "Un visiteur, prestataire ou livreur peut Ãªtre retracÃ© depuis son autorisation jusqu'Ã  sa sortie ou la fin de son intervention, selon un niveau de contrÃ´le adaptÃ© au risque.",
      en: "A visitor, contractor, or delivery person can be traced from authorization through departure or completion of intervention, using controls appropriate to risk.",
    },
    partialGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_004_visitors_deliveries"].partial,
    fullGapCode: PHYSICAL_ENTRY_GAP_CODES["p7_2_004_visitors_deliveries"].full,
  },
};

const actionByQuestionId = new Map<A72QuestionId, A72QuestionRemediation>(
  Object.values(A72_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<A72QuestionId, LocalizedText> = {
  "p7_2_001": {
    fr: "Confirmer avec Facilities, RH et aux propriÃ©taires de zones qui autorise actuellement les accÃ¨s, selon quels critÃ¨res et comment les changements ou dÃ©parts sont traitÃ©s.",
    en: "Ask Facilities, HR, and area owners who currently authorizes access, according to which criteria and how role changes or departures are handled.",
  },
  "p7_2_002": {
    fr: "Examiner un point d'entrÃ©e et un moyen d'accÃ¨s rÃ©cent afin de vÃ©rifier l'autorisation, l'attribution, la protection et la rÃ©vocation.",
    en: "Review a recent entry point and access credential to verify authorization, assignment, protection, and revocation.",
  },
  "p7_2_003": {
    fr: "Identifier oÃ¹ sont conservÃ©es les autorisations, listes d'accÃ¨s, restitutions, dÃ©sactivations, revues, incidents et exceptions.",
    en: "Identify where authorizations, access lists, returns, disabling records, reviews, incidents, and exceptions are retained.",
  },
  "p7_2_004_visitors_deliveries": {
    fr: "Examiner avec la rÃ©ception, Facilities ou le gestionnaire du site comment un visiteur ou prestataire rÃ©cent a Ã©tÃ© autorisÃ©, identifiÃ©, orientÃ© et enregistrÃ©.",
    en: "Review with Reception, Facilities, or site operator how a recent visitor or contractor was authorized, identified, directed, and recorded.",
  },
};

const questionQuestionMap = new Map<A72QuestionId, A72PhysicalEntryQuestion>(
  physicalEntryQuestions.map((q) => [q.id, q]),
);

export function derivePhysicalEntryRemediationPlan(
  responses: A72ResponseInput[],
  context: A72AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A72RemediationPlanResult {
  const resolution = resolvePhysicalEntryQuestions(context);
  const latestResponses = new Map<A72QuestionId, A72ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) {
      continue;
    }
    latestResponses.set(response.questionId, response);
  }

  if (resolution.controlApplicability === "not_applicable") {
    const isBlocked = !Boolean(controlApplicabilityJustification && controlApplicabilityJustification.trim());
    return {
      planCode: PHYSICAL_ENTRY_PLAN_CODE,
      title: PHYSICAL_ENTRY_PLAN_TITLE,
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
        : [{ fr: controlApplicabilityJustification || "", en: controlApplicabilityJustification || "" }],
    };
  }

  if (resolution.controlApplicability === "unresolved") {
    return {
      planCode: PHYSICAL_ENTRY_PLAN_CODE,
      title: PHYSICAL_ENTRY_PLAN_TITLE,
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

  const activeActionsByCode = new Map<string, A72DerivedSubAction>();
  const clarifications: Array<{ questionId: A72QuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<A72QuestionId>(resolution.questionIds);

  for (const response of latestResponses.values()) {
    if (!visibleIds.has(response.questionId)) {
      continue;
    }

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
    const existing = activeActionsByCode.get(subAction.actionCode);
    if (!existing) {
      activeActionsByCode.set(subAction.actionCode, {
        ...subAction,
        status: "active",
        gapType,
        gapCode,
      });
      continue;
    }

    existing.gapType = gapType;
    existing.gapCode = gapCode;
  }

  return {
    planCode: PHYSICAL_ENTRY_PLAN_CODE,
    title: PHYSICAL_ENTRY_PLAN_TITLE,
    controlApplicability: "applicable",
    controlReviewState: resolution.controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    assessmentBlocked: resolution.assessmentBlocked,
    unresolvedConditions: resolution.unresolvedConditions,
    visibleQuestionIds: [...resolution.questionIds],
    hiddenQuestionIds: [...resolution.hiddenQuestionIds],
    activeActions: [...activeActionsByCode.values()],
    clarifications,
    applicabilityReviews,
  };
}

export {
  A72_ACTIONS as physicalEntryActions,
  PHYSICAL_ENTRY_GAP_CODES as physicalEntryGapCodes,
  type A72ResponseInput as PhysicalEntryResponseInput,
  A72QuestionIds as physicalEntryQuestionIds,
};

