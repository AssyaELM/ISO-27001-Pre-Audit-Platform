import { deriveAssessmentOutcome } from "./outcomes.ts";
import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A68AssessmentContext,
  type A68QuestionResolution,
  type EventReportingQuestionId,
  EVENT_REPORTING_GAP_CODES,
  A6_8_EVENT_REPORTING_PLAN_CODE,
  eventReportingQuestions,
  resolveEventReportingQuestions,
  eventReportingLegalNotice,
} from "../../content/assessment/people/event-reporting.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type EventReportingRemediationActionStatus = "none" | "active" | "resolved";

export type EventReportingSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: EventReportingQuestionId;
  title: LocalizedText;
  partialGapTitle: LocalizedText;
  fullGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: "low" | "medium" | "high";
  fullPriority: "low" | "medium" | "high";
  owners: ReadonlyArray<string>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  clarification: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type EventReportingResponseInput = {
  questionId: EventReportingQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type EventReportingRemediationAction = EventReportingSubActionDefinition & {
  status: EventReportingRemediationActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type DeriveEventReportingRemediationPlanResult = {
  planCode: typeof A6_8_EVENT_REPORTING_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<EventReportingRemediationAction>;
  clarifications: ReadonlyArray<{
    questionId: EventReportingQuestionId;
    question: LocalizedText;
    questionFr: string;
    questionEn: string;
  }>;
  applicabilityReviews: ReadonlyArray<EventReportingQuestionId | "control.hasRelevantExternalParties">;
  unresolvedConditions: A68QuestionResolution["unresolvedConditions"];
  legalNotice: LocalizedText;
};

const questionMap = new Map(eventReportingQuestions.map((question) => [question.id, question] as const));

export const EVENT_REPORTING_ACTIONS: Record<string, EventReportingSubActionDefinition> = {
  "P6.8-A01": {
    actionCode: "P6.8-A01",
    sourceQuestionId: "p6_8_001",
    title: {
      fr: "Mécanisme de signalement",
      en: "Reporting mechanism",
    },
    partialGapTitle: {
      fr: "Mécanisme de signalement incomplet",
      en: "Incomplete information security reporting mechanism",
    },
    fullGapTitle: {
      fr: "Absence de mécanisme de signalement",
      en: "No information security reporting mechanism",
    },
    partialGapDescription: {
      fr: "Un mécanisme existe, mais les événements concernés, canaux, niveaux d’urgence, responsabilités, informations minimales, règles de transfert ou populations couvertes ne sont pas entièrement définis.",
      en: "A mechanism exists, but covered events, channels, urgency levels, responsibilities, minimum information, handover rules, or populations are not fully defined.",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose d’aucun mécanisme clair et accessible permettant aux personnes concernées de signaler les événements ou faiblesses de sécurité.",
      en: "The organization has no clear and accessible mechanism enabling relevant people to report information security events or weaknesses.",
    },
    recommendedActions: {
      fr: "Identifier les événements et faiblesses à signaler; définir des exemples compréhensibles; choisir les canaux adaptés; définir les situations urgentes; définir le point de contact; définir les informations minimales; attribuer les responsabilités; définir le routage et le transfert vers A.5.25; prévoir le traitement des canaux indisponibles; publier la procédure; communiquer les changements; enregistrer les exceptions; vérifier le fonctionnement du mécanisme.",
      en: "Identify events and weaknesses to be reported, define understandable examples, select appropriate channels, define urgent situations, define the contact point, define minimum information, assign responsibilities, define routing and handover to A.5.25, address unavailable channels, publish the procedure, communicate changes, record exceptions, verify operation of the mechanism.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Information Security", "IT Service Desk", "Incident Manager"],
    closureEvidence: {
      fr: "Un mécanisme publié et fonctionnel définit quoi signaler, comment le signaler, à qui et avec quel niveau d’urgence.",
      en: "A published and operational mechanism defines what to report, how to report it, to whom, and with what level of urgency.",
    },
    closureCriteria: {
      fr: "Un mécanisme publié et fonctionnel définit quoi signaler, comment le signaler, à qui et avec quel niveau d’urgence.",
      en: "A published and operational mechanism defines what to report, how to report it, to whom, and with what level of urgency.",
    },
    clarification: {
      fr: "Demander au responsable des incidents quel canal officiel est utilisé, quels événements doivent y être signalés et comment ils sont transmis à l’équipe responsable.",
      en: "Ask the incident owner which official channel is used, which events should be reported, and how reports are handed to the responsible team.",
    },
    partialGapCode: EVENT_REPORTING_GAP_CODES.p6_8_001.partial,
    fullGapCode: EVENT_REPORTING_GAP_CODES.p6_8_001.full,
  },
  "P6.8-A02": {
    actionCode: "P6.8-A02",
    sourceQuestionId: "p6_8_002",
    title: {
      fr: "Connaissance et utilisation du mécanisme",
      en: "Awareness and use of the reporting mechanism",
    },
    partialGapTitle: {
      fr: "Connaissance ou utilisation irrégulière du mécanisme",
      en: "Inconsistent awareness or use of the reporting mechanism",
    },
    fullGapTitle: {
      fr: "Personnes non informées du mécanisme de signalement",
      en: "Relevant people are not informed about event reporting",
    },
    partialGapDescription: {
      fr: "Le mécanisme est communiqué à certaines personnes, mais certaines populations ne savent pas quoi signaler, quel canal utiliser, quel niveau d’urgence appliquer ou qu’elles ne doivent pas confirmer l’incident elles-mêmes.",
      en: "The mechanism is communicated to some people, but certain populations do not know what to report, which channel to use, which urgency level applies, or that they are not expected to confirm the incident themselves.",
    },
    fullGapDescription: {
      fr: "Les personnes concernées ne savent pas reconnaître ni signaler rapidement un événement ou une faiblesse suspectée.",
      en: "Relevant people do not know how to recognize or promptly report a suspected event or weakness.",
    },
    recommendedActions: {
      fr: "Identifier les populations concernées; intégrer le signalement à la sensibilisation; fournir des exemples concrets; expliquer les canaux et niveaux d’urgence; expliquer que le déclarant n’a pas à confirmer l’incident; expliquer de ne pas tester une faiblesse sans autorisation; expliquer les premières précautions; rappeler régulièrement le mécanisme selon le besoin; former les managers à orienter les signalements; encourager les signalements de bonne foi; vérifier la compréhension d’un échantillon; traiter les écarts identifiés.",
      en: "Identify relevant populations; include reporting in awareness activities; provide concrete examples; explain channels and urgency levels; explain that the reporter does not need to confirm the incident; explain not to test a weakness without authorization; explain initial precautions; provide reminders as needed; train managers to direct reports appropriately; encourage good-faith reporting; check understanding across a sample; address identified gaps.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Security Awareness", "HR", "Managers"],
    closureEvidence: {
      fr: "Un échantillon de personnes sait reconnaître une situation suspecte, identifier le canal approprié et effectuer rapidement un signalement.",
      en: "A sample of relevant people can recognize a suspicious situation, identify the appropriate channel, and promptly submit a report.",
    },
    closureCriteria: {
      fr: "Un échantillon de personnes sait reconnaître une situation suspecte, identifier le canal approprié et effectuer rapidement un signalement.",
      en: "A sample of relevant people can recognize a suspicious situation, identify the appropriate channel, and promptly submit a report.",
    },
    clarification: {
      fr: "Interroger un échantillon de personnes sur la manière de signaler un email suspect, une perte d’appareil, une divulgation accidentelle ou une faiblesse observée.",
      en: "Ask a sample of people how they would report a suspicious email, device loss, accidental disclosure, or observed weakness.",
    },
    partialGapCode: EVENT_REPORTING_GAP_CODES.p6_8_002.partial,
    fullGapCode: EVENT_REPORTING_GAP_CODES.p6_8_002.full,
  },
  "P6.8-A03": {
    actionCode: "P6.8-A03",
    sourceQuestionId: "p6_8_003",
    title: {
      fr: "Traçabilité et fonctionnement du mécanisme",
      en: "Traceability and operation of the reporting mechanism",
    },
    partialGapTitle: {
      fr: "Traçabilité ou vérification du mécanisme incomplètes",
      en: "Incomplete traceability or verification of the reporting mechanism",
    },
    fullGapTitle: {
      fr: "Signalements non enregistrés ou non transmis",
      en: "Reports are not recorded or handed over",
    },
    partialGapDescription: {
      fr: "Certains signalements sont enregistrés, mais les horodatages, accusés de réception, responsables, transferts, problèmes de routage, tests ou actions d’amélioration ne sont pas entièrement traçables.",
      en: "Some reports are recorded, but timestamps, acknowledgements, owners, handovers, routing issues, tests, or improvement actions are not fully traceable.",
    },
    fullGapDescription: {
      fr: "L’organisation ne peut pas démontrer la réception, l’enregistrement, l’accusé de réception ou le transfert des signalements vers les responsables appropriés.",
      en: "The organization cannot demonstrate receipt, recording, acknowledgement, or handover of reports to appropriate owners.",
    },
    recommendedActions: {
      fr: "Définir les métadonnées minimales; créer ou compléter le registre ou workflow; horodater les signalements; enregistrer le canal et la source; accuser réception lorsque cela est approprié; attribuer le responsable initial; définir les règles de routage et d’escalade; enregistrer la date de transfert; enregistrer les échecs ou retards de routage; inclure les faux positifs et quasi-incidents lorsque pertinent; tester le mécanisme; enregistrer les actions d’amélioration; protéger et conserver les informations; vérifier un échantillon de signalements.",
      en: "Define minimum metadata; create or complete the register or workflow; timestamp reports; record channel and source; acknowledge receipt where appropriate; assign the initial owner; define routing and escalation rules; record handover date; record routing failures or delays; include false positives and near misses where relevant; test the mechanism; record improvement actions; protect and retain information; review a sample of reports.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Incident Manager", "Security Operations", "ITSM Owner"],
    closureEvidence: {
      fr: "Un signalement peut être retracé depuis sa réception jusqu’à son transfert vers le responsable ou processus approprié.",
      en: "A report can be traced from receipt through handover to the appropriate owner or process.",
    },
    closureCriteria: {
      fr: "Un signalement peut être retracé depuis sa réception jusqu’à son transfert vers le responsable ou processus approprié.",
      en: "A report can be traced from receipt through handover to the appropriate owner or process.",
    },
    clarification: {
      fr: "Examiner un signalement récent et vérifier son horodatage, son enregistrement, son accusé de réception, son responsable et son transfert.",
      en: "Review a recent report and verify its timestamp, recording, acknowledgement, owner, and handover.",
    },
    partialGapCode: EVENT_REPORTING_GAP_CODES.p6_8_003.partial,
    fullGapCode: EVENT_REPORTING_GAP_CODES.p6_8_003.full,
  },
  "P6.8-A04": {
    actionCode: "P6.8-A04",
    sourceQuestionId: "p6_8_004_external",
    title: {
      fr: "Couverture externe du signalement",
      en: "External-party reporting",
    },
    partialGapTitle: {
      fr: "Couverture externe du signalement incomplète",
      en: "Incomplete external-party reporting coverage",
    },
    fullGapTitle: {
      fr: "Absence de canal pour les parties externes",
      en: "No reporting channel for relevant external parties",
    },
    partialGapDescription: {
      fr: "Certaines parties externes disposent d’un canal, mais certaines catégories, relations, obligations contractuelles, urgences, contacts ou règles de routage ne sont pas entièrement couvertes.",
      en: "Some external parties have a channel, but certain categories, relationships, contractual obligations, urgent situations, contacts, or routing rules are not fully covered.",
    },
    fullGapDescription: {
      fr: "Les fournisseurs, consultants, partenaires ou autres parties externes pertinentes ne disposent d’aucun moyen défini pour signaler rapidement les événements ou faiblesses liées au périmètre.",
      en: "Relevant suppliers, consultants, partners, or other external parties have no defined method for promptly reporting events or weaknesses related to the scope.",
    },
    recommendedActions: {
      fr: "Identifier les parties externes pertinentes; identifier les contrats et relations concernés; définir les événements à signaler; choisir les canaux adaptés; définir les contacts et urgences; intégrer les obligations dans les contrats ou procédures; définir le routage interne; attribuer les responsabilités; communiquer les changements; traiter les contrats historiques; enregistrer les exceptions; conserver les preuves; tester la joignabilité ou le fonctionnement lorsque pertinent.",
      en: "Identify relevant external parties; identify applicable contracts and relationships; define events to be reported; select appropriate channels; define contacts and urgent situations; include obligations in contracts or procedures; define internal routing; assign responsibilities; communicate changes; address legacy contracts; record exceptions; retain evidence; test reachability or operation where relevant.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Supplier Management", "Information Security", "Contract Owner"],
    closureEvidence: {
      fr: "Les parties externes pertinentes disposent d’un canal démontrable et adapté, relié à un propriétaire et à un processus de routage interne.",
      en: "Relevant external parties have a demonstrable and appropriate channel linked to an owner and internal routing process.",
    },
    closureCriteria: {
      fr: "Les parties externes pertinentes disposent d’un canal démontrable et adapté, relié à un propriétaire et à un processus de routage interne.",
      en: "Relevant external parties have a demonstrable and appropriate channel linked to an owner and internal routing process.",
    },
    clarification: {
      fr: "Vérifier dans les contrats, portails et procédures fournisseurs comment une partie externe doit signaler un événement ou une faiblesse et qui reçoit le rapport.",
      en: "Check contracts, supplier portals, and procedures to determine how an external party reports an event or weakness and who receives the report.",
    },
    partialGapCode: EVENT_REPORTING_GAP_CODES.p6_8_004_external.partial,
    fullGapCode: EVENT_REPORTING_GAP_CODES.p6_8_004_external.full,
  },
};

const actionByQuestionId = Object.values(EVENT_REPORTING_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<EventReportingQuestionId, EventReportingSubActionDefinition>,
);

function resolveLatestResponses<T extends { questionId: EventReportingQuestionId; answer: ScreeningAnswerValue }>(
  responses: readonly T[],
) {
  const latest = new Map<EventReportingQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
}

function getQuestionText(questionId: EventReportingQuestionId) {
  const question = questionMap.get(questionId);
  if (!question) return null;
  return {
    questionFr: question.question.fr,
    questionEn: question.question.en,
  };
}

const clarificationLookup: Record<EventReportingQuestionId, { fr: string; en: string }> = {
  "p6_8_001": EVENT_REPORTING_ACTIONS["P6.8-A01"].clarification,
  "p6_8_002": EVENT_REPORTING_ACTIONS["P6.8-A02"].clarification,
  "p6_8_003": EVENT_REPORTING_ACTIONS["P6.8-A03"].clarification,
  "p6_8_004_external": EVENT_REPORTING_ACTIONS["P6.8-A04"].clarification,
};

export function deriveEventReportingRemediationPlan(
  responses: ReadonlyArray<EventReportingResponseInput>,
  context: A68AssessmentContext = {},
): DeriveEventReportingRemediationPlanResult {
  const resolved = resolveEventReportingQuestions(context);
  const visibleSet = new Set<EventReportingQuestionId>(resolved.questionIds);
  const hiddenSet = new Set<EventReportingQuestionId>(resolved.hiddenQuestionIds);
  const latest = resolveLatestResponses(responses);
  const activeActions = new Map<string, EventReportingRemediationAction>();
  const clarifications: Array<{
    questionId: EventReportingQuestionId;
    question: LocalizedText;
    questionFr: string;
    questionEn: string;
  }> = [];
  const applicabilityReviews: Array<EventReportingQuestionId | "control.hasRelevantExternalParties"> = [];

  for (const hiddenQuestionId of hiddenSet) {
    if (latest.has(hiddenQuestionId)) {
      latest.delete(hiddenQuestionId);
    }
  }

  for (const conditionQuestionId of resolved.unresolvedConditionQuestions) {
    const questionText = getQuestionText(conditionQuestionId);
    if (!questionText) {
      continue;
    }
    const text = clarificationLookup[conditionQuestionId];
    if (!text) continue;
    clarifications.push({
      questionId: conditionQuestionId,
      question: text,
      questionFr: questionText.questionFr,
      questionEn: questionText.questionEn,
    });
  }

  for (const response of latest.values()) {
    if (!visibleSet.has(response.questionId)) {
      continue;
    }

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      evidenceStatus: response.evidenceStatus,
      justification: response.justification,
    });

    if (!outcome.isValid) {
      continue;
    }

    if (outcome.reviewState === "clarification_required") {
      const questionText = getQuestionText(response.questionId);
      if (!questionText) continue;
      clarifications.push({
        questionId: response.questionId,
        question: clarificationLookup[response.questionId],
        questionFr: questionText.questionFr,
        questionEn: questionText.questionEn,
      });
      continue;
    }

    if (outcome.reviewState === "applicability_review_required") {
      if (!applicabilityReviews.includes(response.questionId)) {
        applicabilityReviews.push(response.questionId);
      }
      continue;
    }

    if (outcome.createsGapAction === "none") {
      continue;
    }

    const action = actionByQuestionId[response.questionId];
    if (!action) continue;
    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? action.partialGapCode : action.fullGapCode;
    const existing = activeActions.get(action.actionCode);
    if (!existing || existing.gapType !== "full") {
      activeActions.set(action.actionCode, {
        ...action,
        status: "active",
        gapType,
        gapCode,
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.status = "active";
    }
  }

  const finalClarifications = Array.from(
    new Map(clarifications.map((entry) => [entry.questionId, entry])).values(),
  );

  return {
    planCode: A6_8_EVENT_REPORTING_PLAN_CODE,
    title: {
      fr: "Définir, communiquer et démontrer un mécanisme efficace de signalement des événements et faiblesses de sécurité de l’information",
      en: "Define, communicate, and demonstrate an effective mechanism for reporting information security events and weaknesses",
    },
    activeActions: [...activeActions.values()],
    clarifications: finalClarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
    legalNotice: eventReportingLegalNotice,
  };
}

export { EVENT_REPORTING_GAP_CODES as eventReportingGapCodes };
