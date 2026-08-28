import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A79QuestionResolution,
  type SecurityOfAssetsOffPremisesQuestionId,
  A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN,
  securityOfAssetsOffPremisesQuestions,
  A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES,
  resolveSecurityOfAssetsOffPremisesQuestions,
  type A79AssessmentContext,
} from "../../content/assessment/physical/security-of-assets-off-premises.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A79PlanOwnership =
  | "IT"
  | "Information Security"
  | "Asset Owner"
  | "Operations"
  | "User Manager"
  | "Asset Management"
  | "HR"
  | "Privacy"
  | "Legal";

export type A79SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A79SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: SecurityOfAssetsOffPremisesQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A79PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A79ResponseInput = {
  questionId: SecurityOfAssetsOffPremisesQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A79DerivedSubAction = A79SubActionDefinition & {
  status: A79SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A79RemediationPlanResult = {
  planCode: typeof A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN;
  title: LocalizedText;
  controlApplicability: A79QuestionResolution["controlApplicability"];
  controlReviewState: A79QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A79QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: SecurityOfAssetsOffPremisesQuestionId[];
  hiddenQuestionIds: SecurityOfAssetsOffPremisesQuestionId[];
  activeActions: ReadonlyArray<A79DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: SecurityOfAssetsOffPremisesQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A79_ACTIONS: Record<string, A79SubActionDefinition> = {
  "P7.9-A01": {
    actionCode: "P7.9-A01",
    sourceQuestionId: "p7_9_001",
    title: {
      fr: "Règles concernant les actifs hors site incomplètes",
      en: "Incomplete off-premises asset rules",
    },
    partialGap: {
      fr: "Règles concernant les actifs hors site incomplètes",
      en: "Incomplete off-premises asset rules",
    },
    fullGap: {
      fr: "Absence de règles concernant les actifs hors site",
      en: "No off-premises asset rules",
    },
    partialDescription: {
      fr: "Des règles existent, mais certaines catégories d’actifs, situations d’utilisation hors site, responsabilités, conditions de garde, risques ou exceptions ne sont pas correctement couvertes.",
      en: "Rules exist, but certain asset categories, off-premises usage scenarios, responsibilities, custody arrangements, risks, or exceptions are not properly covered.",
    },
    fullDescription: {
      fr: "L’organisation utilise ou conserve des actifs hors de ses locaux sans disposer de règles définissant leur autorisation, responsabilité, garde, usage et protection.",
      en: "The organization uses or stores assets off-premises without defined rules covering their authorization, responsibility, custody, use, and protection.",
    },
    recommendedActions: {
      fr: "- identifier les catégories d’actifs utilisées hors site ;\n- identifier les informations accessibles ;\n- identifier les utilisateurs ou détenteurs concernés ;\n- déterminer les situations autorisées ;\n- définir les responsabilités ;\n- définir les règles de garde ;\n- couvrir transport, stockage et utilisation ;\n- couvrir domicile, déplacement, sites clients et espaces partagés ;\n- couvrir les installations permanentes hors site lorsqu’elles existent ;\n- définir perte, vol et dommage ;\n- définir les exceptions ;\n- définir les mesures compensatoires ;\n- communiquer les règles.",
      en: "- identify asset categories used off-premises;\n- identify accessible information;\n- identify relevant users or custodians;\n- determine permitted scenarios;\n- define responsibilities;\n- define custody rules;\n- address transportation, storage, and use;\n- address home working, travel, customer sites, and shared spaces;\n- address permanently installed off-premises equipment where present;\n- define loss, theft, and damage handling;\n- define exceptions;\n- define compensating controls;\n- communicate the rules.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["IT", "Information Security", "Asset Owner", "Operations"],
    closureEvidence: {
      fr: "Règles applicables, preuve de communication et preuve d'approbation.",
      en: "Applicable rules, communication evidence, and approval evidence.",
    },
    closureCriteria: {
      fr: "Les catégories d’actifs pertinentes disposent de règles approuvées, proportionnées au risque et connues des utilisateurs concernés.",
      en: "Relevant asset categories have approved, risk-proportionate rules known to the relevant users.",
    },
    partialGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_RULES_PARTIAL,
    fullGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_RULES_ABSENT,
  },
  "P7.9-A02": {
    actionCode: "P7.9-A02",
    sourceQuestionId: "p7_9_002",
    title: {
      fr: "Protection des actifs hors site incomplète",
      en: "Incomplete off-premises asset protection",
    },
    partialGap: {
      fr: "Protection des actifs hors site incomplète",
      en: "Incomplete off-premises asset protection",
    },
    fullGap: {
      fr: "Protection des actifs hors site absente ou insuffisante",
      en: "Absent or insufficient off-premises asset protection",
    },
    partialDescription: {
      fr: "Les actifs sont généralement protégés hors site, mais certains équipements, lieux ou scénarios présentent encore une exposition insuffisamment maîtrisée.",
      en: "Assets are generally protected off-premises, but certain equipment, locations, or scenarios remain insufficiently controlled.",
    },
    fullDescription: {
      fr: "Les actifs hors site sont utilisés, transportés ou stockés sans protection proportionnée contre les risques de perte, vol, dommage, observation ou utilisation non autorisée.",
      en: "Off-premises assets are used, transported, or stored without proportionate protection against loss, theft, damage, unauthorized observation, or unauthorized use.",
    },
    recommendedActions: {
      fr: "- identifier les scénarios d’exposition ;\n- comparer les pratiques réelles aux règles ;\n- traiter les risques de perte et vol ;\n- traiter l’observation non autorisée ;\n- traiter les accès ou usages non autorisés ;\n- protéger transport et stockage ;\n- traiter les risques liés aux véhicules, hôtels, espaces publics et coworking lorsque pertinents ;\n- traiter eau, chaleur ou choc lorsque pertinent ;\n- protéger les installations permanentes hors site ;\n- mettre en place des moyens techniques proportionnés lorsque nécessaires ;\n- documenter les exceptions ;\n- appliquer les mesures compensatoires ;\n- vérifier les corrections.",
      en: "- identify exposure scenarios;\n- compare actual practice with defined rules;\n- address loss and theft risks;\n- address unauthorized observation;\n- address unauthorized access or use;\n- protect transportation and storage;\n- address vehicle, hotel, public-space, and coworking risks where relevant;\n- address water, heat, or impact where relevant;\n- protect permanently installed off-premises equipment;\n- implement proportionate technical measures where necessary;\n- document exceptions;\n- apply compensating controls;\n- verify remediation.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["IT", "Information Security", "Asset Owner", "User Manager"],
    closureEvidence: {
      fr: "Preuves de configuration, preuve de contrôles compensatoires, rapport d'inspection.",
      en: "Configuration evidence, compensating control evidence, inspection report.",
    },
    closureCriteria: {
      fr: "Un échantillon représentatif démontre que les actifs hors site disposent de protections proportionnées et que les écarts significatifs ont été corrigés.",
      en: "A representative sample demonstrates proportionate protection of off-premises assets and remediation of significant deviations.",
    },
    partialGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_PROTECTION_PARTIAL,
    fullGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_PROTECTION_ABSENT,
  },
  "P7.9-A03": {
    actionCode: "P7.9-A03",
    sourceQuestionId: "p7_9_003",
    title: {
      fr: "Traçabilité des actifs hors site incomplète",
      en: "Incomplete off-premises asset traceability",
    },
    partialGap: {
      fr: "Traçabilité des actifs hors site incomplète",
      en: "Incomplete off-premises asset traceability",
    },
    fullGap: {
      fr: "Absence de traçabilité des actifs hors site",
      en: "No off-premises asset traceability",
    },
    partialDescription: {
      fr: "L’organisation dispose d’une partie des informations nécessaires, mais certains actifs, détenteurs, retours, incidents, exceptions ou actions correctives ne sont pas suffisamment traçables.",
      en: "The organization has some necessary information, but certain assets, custodians, returns, incidents, exceptions, or corrective actions are not sufficiently traceable.",
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer quels actifs pertinents sont utilisés hors site, qui en assume la responsabilité ou comment les pertes, vols, dommages et retours sont gérés.",
      en: "The organization cannot demonstrate which relevant assets are used off-premises, who is responsible for them, or how losses, theft, damage, and returns are handled.",
    },
    recommendedActions: {
      fr: "- identifier les actifs nécessitant une traçabilité ;\n- relier les actifs pertinents à un détenteur lorsque approprié ;\n- conserver les affectations pertinentes ;\n- conserver les prêts et retours lorsque nécessaires ;\n- documenter les installations permanentes hors site ;\n- enregistrer perte, vol et dommage ;\n- enregistrer les actions de réponse ;\n- enregistrer récupération, désactivation ou effacement lorsqu’ils existent ;\n- documenter les exceptions ;\n- attribuer les actions correctives ;\n- conserver les preuves de correction ;\n- tracer la clôture.",
      en: "- identify assets requiring traceability;\n- associate relevant assets with a custodian where appropriate;\n- retain relevant assignments;\n- retain loans and returns where necessary;\n- document permanently installed off-premises assets;\n- record loss, theft, and damage;\n- record response actions;\n- record recovery, disablement, or wiping where used;\n- document exceptions;\n- assign corrective actions;\n- retain remediation evidence;\n- trace closure.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["IT", "Asset Management", "Information Security", "Operations"],
    closureEvidence: {
      fr: "Registres d'actifs, tickets d'incidents, listes d'affectation, preuves de clôture.",
      en: "Asset registers, incident tickets, assignment lists, closure evidence.",
    },
    closureCriteria: {
      fr: "Un échantillon permet de relier un actif hors site à sa responsabilité et, le cas échéant, à son retour, incident, exception ou correction jusqu’à la clôture.",
      en: "A sample allows an off-premises asset to be linked to its responsibility and, where applicable, its return, incident, exception, or remediation through closure.",
    },
    partialGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_TRACEABILITY_PARTIAL,
    fullGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_OFFSITE_TRACEABILITY_ABSENT,
  },
  "P7.9-A04": {
    actionCode: "P7.9-A04",
    sourceQuestionId: "p7_9_004_byod",
    title: {
      fr: "Encadrement du BYOD incomplet",
      en: "Incomplete BYOD governance",
    },
    partialGap: {
      fr: "Encadrement du BYOD incomplet",
      en: "Incomplete BYOD governance",
    },
    fullGap: {
      fr: "Absence d’encadrement du BYOD professionnel",
      en: "No governance of business BYOD",
    },
    partialDescription: {
      fr: "Le BYOD est autorisé, mais certains usages, exigences de protection, responsabilités, traitements de données, incidents ou modalités de fin d’utilisation professionnelle ne sont pas suffisamment définis ou appliqués.",
      en: "BYOD is permitted, but certain uses, protection requirements, responsibilities, data-handling arrangements, incidents, or termination-of-business-use arrangements are not sufficiently defined or implemented.",
    },
    fullDescription: {
      fr: "Des équipements personnels peuvent accéder aux informations de l’organisation sans cadre défini concernant les usages, protections, responsabilités, données, incidents et fin d’utilisation professionnelle.",
      en: "Personally owned devices can access organizational information without a defined framework for permitted use, protection, responsibilities, data, incidents, and termination of business use.",
    },
    recommendedActions: {
      fr: "- identifier les appareils et usages admis ;\n- définir les informations accessibles ;\n- définir les exigences minimales proportionnées ;\n- définir les responsabilités utilisateur/organisation ;\n- gérer les mises à jour et authentification lorsque pertinent ;\n- définir stockage et traitement des données ;\n- prévoir la séparation professionnel/personnel lorsque pertinente ;\n- définir le traitement perte/vol ;\n- définir les incidents ;\n- définir le retrait des accès ;\n- définir le traitement des données lors du départ ;\n- documenter les exceptions ;\n- vérifier les exigences de vie privée et droit du travail ;\n- communiquer les règles.",
      en: "- identify permitted devices and uses;\n- define accessible information;\n- define proportionate minimum requirements;\n- define user/organization responsibilities;\n- address updates and authentication where relevant;\n- define data storage and handling;\n- provide work/personal separation where relevant;\n- define loss/theft handling;\n- define incident handling;\n- define access removal;\n- define organizational data handling on departure;\n- document exceptions;\n- verify privacy and employment-law requirements;\n- communicate the rules.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Information Security", "IT", "HR", "Privacy", "Legal"],
    closureEvidence: {
      fr: "Politique BYOD, accords utilisateurs, preuves techniques de configuration.",
      en: "BYOD policy, user agreements, technical configuration evidence.",
    },
    closureCriteria: {
      fr: "Le BYOD professionnel autorisé est couvert par des règles proportionnées, comprises, applicables et compatibles avec les exigences de vie privée et juridiques pertinentes.",
      en: "Permitted business BYOD is covered by proportionate, understood, enforceable rules compatible with relevant privacy and legal requirements.",
    },
    partialGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_BYOD_PROTECTION_PARTIAL,
    fullGapCode: A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES.A7_9_BYOD_PROTECTION_ABSENT,
  },
};

export function deriveSecurityOfAssetsOffPremisesRemediationPlan(
  responses: readonly A79ResponseInput[],
  context: A79AssessmentContext,
  controlApplicabilityJustification?: string
): A79RemediationPlanResult {
  const resolution = resolveSecurityOfAssetsOffPremisesQuestions(context);

  if (resolution.controlApplicability === "not_applicable") {
    const isJustified =
      controlApplicabilityJustification &&
      controlApplicabilityJustification.trim().length > 0;

    return {
      planCode: A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN,
      title: {
        fr: "Définir, appliquer et démontrer la sécurité des actifs utilisés hors site",
        en: "Define, apply, and demonstrate security of assets used off-premises",
      },
      controlApplicability: "not_applicable",
      controlReviewState: isJustified ? "none" : "applicability_review_required",
      requiresControlJustification: true,
      assessmentBlocked: !isJustified,
      unresolvedConditions: [],
      visibleQuestionIds: [],
      hiddenQuestionIds: resolution.hiddenQuestionIds,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: isJustified
        ? [
            {
              fr: "Justifier que l'organisation n'utilise aucun actif hors site (ni laptop, ni mobile, ni BYOD).",
              en: "Justify that the organization uses no off-premises assets (no laptop, no mobile, no BYOD).",
            },
          ]
        : [],
    };
  }

  const activeActionsMap = new Map<string, A79DerivedSubAction>();
  const clarifications: Array<{ questionId: SecurityOfAssetsOffPremisesQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];

  const responseMap = new Map<SecurityOfAssetsOffPremisesQuestionId, A79ResponseInput>();
  for (const response of responses) {
    if (!resolution.hiddenQuestionIds.includes(response.questionId)) {
      responseMap.set(response.questionId, response);
    }
  }

  for (const questionId of resolution.questionIds) {
    const response = responseMap.get(questionId);
    if (!response) continue;

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      evidenceStatus: response.evidenceStatus,
      justification: response.justification,
    });

    if (!outcome.isValid) {
      throw new Error(`Invalid response for question ${response.questionId}: ${outcome.errorCode}`);
    }

    if (outcome.reviewState === "clarification_required") {
      let clarificationText: LocalizedText;
      if (questionId === "p7_9_001") {
        clarificationText = {
          fr: "Identifier avec IT, Information Security et les propriétaires d’actifs quels actifs quittent réellement les locaux contrôlés, dans quelles circonstances et qui en assume la responsabilité.",
          en: "Identify with IT, Information Security, and asset owners which assets actually leave controlled premises, under what circumstances, and who is responsible for them.",
        };
      } else if (questionId === "p7_9_002") {
        clarificationText = {
          fr: "Examiner les principaux scénarios hors site et identifier quelles protections sont réellement utilisées contre perte, vol, dommage et accès non autorisé.",
          en: "Review the main off-premises scenarios and identify which protections are actually used against loss, theft, damage, and unauthorized access.",
        };
      } else if (questionId === "p7_9_003") {
        clarificationText = {
          fr: "Identifier quelles sources permettent actuellement de savoir quels actifs pertinents sont hors site, à qui ils sont confiés et comment les incidents ou retours sont enregistrés.",
          en: "Identify which current sources show which relevant assets are off-premises, who has custody of them, and how incidents or returns are recorded.",
        };
      } else if (questionId === "p7_9_004_byod") {
        clarificationText = {
          fr: "Identifier avec IT, HR, Privacy et Information Security si des appareils personnels accèdent réellement aux informations professionnelles et quelles règles s’appliquent actuellement.",
          en: "Identify with IT, HR, Privacy, and Information Security whether personally owned devices actually access business information and which rules currently apply.",
        };
      } else {
        clarificationText = {
          fr: "Veuillez clarifier cette réponse.",
          en: "Please clarify this response.",
        };
      }
      clarifications.push({ questionId, question: clarificationText });
      continue;
    }

    if (outcome.reviewState === "applicability_review_required") {
      const qDef = securityOfAssetsOffPremisesQuestions.find((q) => q.id === questionId);
      if (qDef) {
        applicabilityReviews.push({
          fr: `Revue d'applicabilité requise pour: ${qDef.title.fr}`,
          en: `Applicability review required for: ${qDef.title.en}`,
        });
      }
      continue;
    }

    if (outcome.gapLevel === "partial_gap" || outcome.gapLevel === "full_gap") {
      let actionCode: string | undefined;

      if (questionId === "p7_9_001") actionCode = "P7.9-A01";
      if (questionId === "p7_9_002") actionCode = "P7.9-A02";
      if (questionId === "p7_9_003") actionCode = "P7.9-A03";
      if (questionId === "p7_9_004_byod") actionCode = "P7.9-A04";

      if (actionCode) {
        const actionDef = A79_ACTIONS[actionCode];
        const gapType = outcome.gapLevel === "partial_gap" ? "partial" : "full";
        
        activeActionsMap.set(actionCode, {
          ...actionDef,
          status: "active",
          gapType,
          gapCode: gapType === "partial" ? actionDef.partialGapCode : actionDef.fullGapCode,
          priority: gapType === "partial" ? actionDef.partialPriority : actionDef.fullPriority,
        });
      }
    }
  }

  return {
    planCode: A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN,
    title: {
      fr: "Définir, appliquer et démontrer la sécurité des actifs utilisés hors site",
      en: "Define, apply, and demonstrate security of assets used off-premises",
    },
    controlApplicability: resolution.controlApplicability,
    controlReviewState: resolution.controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    assessmentBlocked: resolution.assessmentBlocked,
    unresolvedConditions: resolution.unresolvedConditions,
    visibleQuestionIds: resolution.questionIds,
    hiddenQuestionIds: resolution.hiddenQuestionIds,
    activeActions: Array.from(activeActionsMap.values()),
    clarifications,
    applicabilityReviews,
  };
}
