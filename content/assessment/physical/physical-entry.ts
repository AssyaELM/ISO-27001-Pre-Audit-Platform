import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";
import type { ContextDecision } from "./physical-security-perimeters.ts";

export type AssessmentLocale = "fr" | "en";

export type A72AnswerValue = (typeof assessmentAnswerValues)[number];

export type A72AssessmentContext = {
  hasPhysicalLocationsSupportingScope?: ContextDecision;
  receivesVisitorsOrDeliveries?: ContextDecision;
};

export type A72ConditionKey = "hasPhysicalLocationsSupportingScope" | "receivesVisitorsOrDeliveries";

export type A72QuestionCategory = "main" | "conditional_visitors";

export type A72QuestionId =
  | "p7_2_001"
  | "p7_2_002"
  | "p7_2_003"
  | "p7_2_004_visitors_deliveries";

export type A72QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: A72QuestionId[];
  hiddenQuestionIds: A72QuestionId[];
  unresolvedConditions: A72ConditionKey[];
  assessmentBlocked: boolean;
};

export type A72PhysicalEntryQuestion = {
  id: A72QuestionId;
  category: A72QuestionCategory;
  index: number;
  question: {
    fr: string;
    en: string;
  };
  helpText: {
    fr: string;
    en: string;
  };
  evidenceHints: {
    fr: string[];
    en: string[];
  };
  responseOptions: ReadonlyArray<A72AnswerValue>;
  conditionKey?: "receivesVisitorsOrDeliveries";
};

export const PHYSICAL_ENTRY_PLAN_CODE = "A7_2_PHYSICAL_ENTRY_PLAN";
export const PHYSICAL_ENTRY_PLAN_TITLE = {
  fr: "Autoriser, contrôler et démontrer les accès physiques aux zones pertinentes",
  en: "Authorize, control, and demonstrate physical access to relevant areas",
};

export const A72_ANSWER_LABELS = {
  fr: {
    implemented: "Implémenté",
    partially_implemented: "Partiellement implémenté",
    not_implemented: "Non implémenté",
    not_sure: "Je ne sais pas",
    not_applicable: "Non applicable",
  },
  en: {
    implemented: "Implemented",
    partially_implemented: "Partially implemented",
    not_implemented: "Not implemented",
    not_sure: "Not sure",
    not_applicable: "Not applicable",
  },
} as const;

export const A72QuestionIds = {
  mandatory: ["p7_2_001", "p7_2_002", "p7_2_003"] as const,
  conditionalVisitors: "p7_2_004_visitors_deliveries",
} as const;

export const physicalEntryQuestions: A72PhysicalEntryQuestion[] = [
  {
    id: "p7_2_001",
    category: "main",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle dÃ©fini un processus d'autorisation des accÃ¨s physiques aux zones concernÃ©es, couvrant les critÃ¨res d'accÃ¨s, les approbateurs, les moyens d'accÃ¨s, les changements et la rÃ©vocation ?",
      en: "Has your organization defined a physical access authorization process covering access criteria, approvers, access credentials, changes, and revocation?",
    },
    helpText: {
      fr: "Le processus doit Ãªtre proportionnÃ© aux risques des zones et peut notamment dÃ©finir :\n\n- les zones concernÃ©es ;\n- les personnes ou rÃ´les autorisÃ©es ;\n- les propriÃ©taires de zones ;\n- les approbateurs ;\n- les critÃ¨res d'autorisation ;\n- les accÃ¨s permanents, temporaires et urgents ;\n- les clÃ©s, badges, codes ou autres moyens utilisÃ©s ;\n- les changements de fonction ou de responsabilitÃ© ;\n- les dÃ©parts et fins de contrat ;\n- les accÃ¨s exceptionnels ;\n- les dÃ©lais de validitÃ© lorsqu'ils sont nÃ©cessaires ;\n- les responsabilitÃ©s de l'organisation et des gestionnaires de site.\n\nLe processus peut Ãªtre intÃ©grÃ© Ã  une procÃ©dure de sÃ©curitÃ© physique, de gestion des accÃ¨s ou de gestion des arrivÃ©es, changements et dÃ©parts.\n\nUne politique autonome A.7.2 n'est pas obligatoire.",
      en: "The process should reflect the risks of the relevant areas and may define:\n\n- relevant areas;\n- authorized people or roles;\n- area owners;\n- approvers;\n- authorization criteria;\n- permanent, temporary, and emergency access;\n- keys, badges, codes, or other access credentials;\n- changes in role or responsibility;\n- departures and contract termination;\n- exceptional access;\n- validity periods where needed;\n- responsibilities of the organization and site operators.\n\nThe process may be incorporated into physical security, access-management, or joiner-mover-leaver procedures.\n\nA standalone A.7.2 policy is not required.",
    },
    evidenceHints: {
      fr: [
        "procÃ©dure d'accÃ¨s physique",
        "matrice rÃ´lesâ€“zones",
        "liste des zones",
        "propriÃ©taires et approbateurs",
        "demandes et approbations",
        "registre des clÃ©s, badges ou codes",
        "rÃ¨gles d'accÃ¨s temporaire ou urgent",
        "processus de changement et rÃ©vocation",
        "exceptions approuvÃ©es",
        "historique des versions",
      ],
      en: [
        "physical access procedure",
        "role-to-area matrix",
        "area list",
        "owners and approvers",
        "access requests and approvals",
        "key, badge, or code register",
        "temporary or emergency access rules",
        "change and revocation process",
        "approved exceptions",
        "version history",
      ],
    },
    responseOptions: [...assessmentAnswerValues],
  },
  {
    id: "p7_2_002",
    category: "main",
    index: 2,
    question: {
      fr: "Les autorisations sont-elles vÃ©rifiÃ©es aux points d'entrÃ©e et de sortie pertinents, et les clÃ©s, badges, codes ou autres moyens d'accÃ¨s sont-ils dÃ©livrÃ©s, protÃ©gÃ©s, rÃ©cupÃ©rÃ©s et dÃ©sactivÃ©s de maniÃ¨re contrÃ´lÃ©e ?",
      en: "Are authorizations verified at relevant entry and exit points, and are keys, badges, codes, or other access credentials issued, protected, recovered, and disabled in a controlled manner?",
    },
    helpText: {
      fr: "Les mesures doivent correspondre aux zones, aux risques et au mode d'exploitation rÃ©el.\n\nElles peuvent notamment comprendre :\n\n- une serrure mÃ©canique ou Ã©lectronique ;\n- un badge ou une carte ;\n- un code ;\n- une rÃ©ception ;\n- un contrÃ´le manuel ;\n- un gardien ;\n- une authentification renforcÃ©e pour certaines zones ;\n- une alarme sur un point d'accÃ¨s ;\n- une mesure de prÃ©vention du passage non autorisÃ© ;\n- une procÃ©dure de gestion des clÃ©s ;\n- une mÃ©thode de dÃ©sactivation ou rÃ©cupÃ©ration.\n\nAucune technologie particuliÃ¨re n'est obligatoire.\n\nLe dispositif doit notamment traiter, lorsque pertinent :\n\n- lâ€™Ã©mission du moyen d'accÃ¨s ;\n- son attribution Ã  une personne ou fonction ;\n- sa protection contre le partage ou la copie non autorisÃ©e ;\n- sa perte ou son vol ;\n- sa restitution ;\n- sa dÃ©sactivation ;\n- le changement de rÃ´le ;\n- le dÃ©part ;\n- les accÃ¨s temporaires ;\n- les accÃ¨s en situation d'urgence ;\n- les points de sortie et issues de secours.\n\nLes mesures ne doivent pas compromettre la sÃ©curitÃ© des personnes ou les rÃ¨gles d'Ã©vacuation.",
      en: "Measures should reflect the relevant areas, risks, and actual operating model.\n\nThey may include:\n\n- mechanical or electronic locks;\n- badges or cards;\n- codes;\n- reception arrangements;\n- manual checks;\n- guards;\n- enhanced authentication for certain areas;\n- access-point alarms;\n- measures addressing unauthorized passing or entry;\n- key-management procedures;\n- credential recovery or disabling.\n\nNo particular technology is universally required.\n\nWhere relevant, arrangements should address:\n\n- issuance of access credentials;\n- assignment to a person or role;\n- protection against unauthorized sharing or copying;\n- loss or theft;\n- return;\n- disabling;\n- role changes;\n- departure;\n- temporary access;\n- emergency access;\n- exit points and emergency exits.\n\nMeasures should not compromise life safety or evacuation requirements.",
    },
    evidenceHints: {
      fr: [
        "Ã©chantillon de demande et d'approbation",
        "registre des clÃ©s ou badges",
        "liste des moyens actifs",
        "preuve d'Ã©mission",
        "preuve de restitution ou dÃ©sactivation",
        "traitement d'un badge ou d'une clÃ© perdue",
        "procÃ©dure des accÃ¨s temporaires",
        "inspection des points d'entrÃ©e",
        "test d'un contrÃ´le d'entrÃ©e",
        "exception ou mesure compensatoire",
      ],
      en: [
        "sample request and approval",
        "key or badge register",
        "active-credential list",
        "issuance evidence",
        "return or disabling evidence",
        "handling of a lost key or badge",
        "temporary-access procedure",
        "entry-point inspection",
        "entry-control test",
        "exception or compensating control",
      ],
    },
    responseOptions: [...assessmentAnswerValues],
  },
  {
    id: "p7_2_003",
    category: "main",
    index: 3,
    question: {
      fr: "Les autorisations, accÃ¨s physiques, revues, retraits, exceptions et incidents sont-ils enregistrÃ©s et traÃ§ables de maniÃ¨re proportionnÃ©e aux risques des zones concernÃ©es ?",
      en: "Are physical access authorizations, access events, reviews, removals, exceptions, and incidents recorded and traceable in a manner proportionate to the risks of the relevant areas?",
    },
    helpText: {
      fr: "Le niveau de journalisation dÃ©pend du risque et des moyens rÃ©ellement utilisÃ©s.\n\nLes preuves peuvent notamment couvrir :\n\n- les demandes et approbations ;\n- les personnes ou rÃ´les autorisÃ©es ;\n- les moyens d'accÃ¨s attribuÃ©s ;\n- les accÃ¨s temporaires ;\n- les dates de validitÃ© ;\n- les retraits ou dÃ©sactivations ;\n- les changements de rÃ´le ;\n- les dÃ©parts ;\n- les accÃ¨s refusÃ©s ou anormaux ;\n- les clÃ©s ou badges perdus ;\n- les revues des autorisations ;\n- les exceptions ;\n- les incidents ;\n- les actions correctives ;\n- les dÃ©cisions de clÃ´ture.\n\nUn journal Ã©lectronique de chaque entrÃ©e n'est pas obligatoire pour toutes les zones. Une organisation peut utiliser des preuves manuelles ou compensatoires lorsque elles sont adaptÃ©es au risque.\n\nLa frÃ©quence des revues doit Ãªtre proportionnÃ©e. Ne pas imposer une frÃ©quence mensuelle, trimestrielle ou annuelle universelle.",
      en: "The level of logging should reflect risk and the access methods actually used.\n\nEvidence may cover:\n\n- requests and approvals;\n- authorized people or roles;\n- assigned access credentials;\n- temporary access;\n- validity dates;\n- removals or disabling;\n- role changes;\n- departures;\n- denied or anomalous access;\n- lost keys or badges;\n- authorization reviews;\n- exceptions;\n- incidents;\n- corrective actions;\n- closure decisions.\n\nElectronic logging of every entry is not required for every area. Manual or compensating evidence may be used where appropriate to risk.\n\nReview frequency should be proportionate. Do not impose a universal monthly, quarterly, or annual frequency.",
    },
    evidenceHints: {
      fr: [
        "matrice d'accÃ¨s",
        "listes d'autorisation",
        "journaux Ã©lectroniques lorsqu'ils existent",
        "registre manuel",
        "preuve de revue",
        "Ã©chantillon de rÃ©vocation",
        "restitution de clÃ©s ou badges",
        "accÃ¨s temporaire expirÃ©",
        "incident ou accÃ¨s refusÃ©",
        "registre des exceptions",
        "action corrective et preuve de clÃ´ture",
      ],
      en: [
        "access matrix",
        "authorization lists",
        "electronic logs where used",
        "manual register",
        "review evidence",
        "revocation sample",
        "returned keys or badges",
        "expired temporary access",
        "incident or denied access",
        "exception register",
        "corrective action and closure evidence",
      ],
    },
    responseOptions: [...assessmentAnswerValues],
  },
  {
    id: "p7_2_004_visitors_deliveries",
    category: "conditional_visitors",
    index: 4,
    question: {
      fr: "Lorsque des visiteurs, prestataires ou livreurs accÃ¨dent aux locaux, leur identitÃ©, leur autorisation, leur circulation, leurs moyens d'identification et les livraisons sont-ils contrÃ´lÃ©s et enregistrÃ©s selon le risque ?",
      en: "Where visitors, contractors, or delivery personnel access the premises, are their identity, authorization, movement, any required escort, identification credentials, and deliveries controlled and recorded according to risk?",
    },
    helpText: {
      fr: "Le dispositif peut notamment dÃ©finir :\n\n- les personnes considÃ©rÃ©es comme visiteurs ;\n- lâ€™hÃ´te ou le sponsor interne ;\n- lâ€™autorisation prÃ©alable lorsqu'elle est nÃ©cessaire ;\n- la vÃ©rification d'identitÃ© proportionnÃ©e ;\n- l'enregistrement de lâ€™entrÃ©e et de la sortie ;\n- les zones autorisÃ©es ;\n- l'accompagnement lorsqu'il est nÃ©cessaire ;\n- un badge ou autre signe distinctif lorsqu'il est utilisÃ© ;\n- les rÃ¨gles concernant les photographies ou Ã©quipements ;\n- la confidentialitÃ© des informations observÃ©es ;\n- la restitution des moyens d'accÃ¨s ;\n- les interventions de prestataires ;\n- les livraisons et zones de rÃ©ception ;\n- les situations urgentes ;\n- les exceptions.\n\nL'accompagnement permanent, le badge visiteur et la rÃ©ception physique ne sont pas obligatoires dans tous les contextes.\n\nLes donnÃ©es collectÃ©es doivent Ãªtre limitÃ©es Ã  ce qui est nÃ©cessaire et conservÃ©es selon une durÃ©e justifiÃ©e.",
      en: "Arrangements may define:\n\n- who is considered a visitor;\n- the internal host or sponsor;\n- prior authorization where needed;\n- proportionate identity verification;\n- recording of entry and exit;\n- authorized areas;\n- escort where needed;\n- a badge or other identifier where used;\n- rules for photography or equipment;\n- confidentiality of information observed;\n- return of access credentials;\n- contractor interventions;\n- deliveries and receiving areas;\n- emergency situations;\n- exceptions.\n\nPermanent escort, visitor badges, and staffed reception are not universally required.\n\nCollected data should be limited to what is necessary and retained for a justified period.",
    },
    evidenceHints: {
      fr: [
        "procÃ©dure visiteurs",
        "registre papier ou numÃ©rique",
        "Ã©chantillon d'autorisation",
        "consigne destinÃ©e aux hÃ´tes",
        "badge ou identification lorsqu'ils sont utilisÃ©s",
        "preuve de restitution",
        "rÃ¨gles d'accompagnement",
        "procÃ©dure prestataire",
        "procÃ©dure de livraison",
        "contrat de rÃ©ception ou gardiennage",
        "incident ou anomalie",
        "exception approuvÃ©e",
      ],
      en: [
        "visitor procedure",
        "paper or digital register",
        "authorization sample",
        "host instructions",
        "badge or identification where used",
        "return evidence",
        "escort rules",
        "contractor procedure",
        "delivery procedure",
        "reception or guarding agreement",
        "incident or anomaly",
        "approved exception",
      ],
    },
    responseOptions: [...assessmentAnswerValues],
    conditionKey: "receivesVisitorsOrDeliveries",
  },
];

const questionMap = new Map(physicalEntryQuestions.map((question) => [question.id, question]));

export const PHYSICAL_ENTRY_GAP_CODES = {
  "p7_2_001": {
    partial: "A7_2_AUTHORIZATION_PARTIAL",
    full: "A7_2_AUTHORIZATION_ABSENT",
  },
  "p7_2_002": {
    partial: "A7_2_ENTRY_CONTROL_PARTIAL",
    full: "A7_2_ENTRY_CONTROL_ABSENT",
  },
  "p7_2_003": {
    partial: "A7_2_ACCESS_TRACEABILITY_PARTIAL",
    full: "A7_2_ACCESS_TRACEABILITY_ABSENT",
  },
  "p7_2_004_visitors_deliveries": {
    partial: "A7_2_VISITOR_DELIVERY_PARTIAL",
    full: "A7_2_VISITOR_DELIVERY_ABSENT",
  },
} as const;

export function getPhysicalEntryQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as A72QuestionId);
  if (!question) {
    throw new Error(`Unknown A.7.2 question id: ${questionId}`);
  }
  return {
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
  };
}

export function getAllPhysicalEntryQuestions(locale: AssessmentLocale = "en") {
  return physicalEntryQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isPhysicalEntryQuestion(questionId: string): boolean {
  return questionMap.has(questionId as A72QuestionId);
}

export function resolvePhysicalEntryQuestions(context: A72AssessmentContext = {}): A72QuestionResolution {
  const questionIds: A72QuestionId[] = [];
  const hiddenQuestionIds: A72QuestionId[] = [];
  const unresolvedConditions: A72ConditionKey[] = [];
  const hasPhysicalLocations = context.hasPhysicalLocationsSupportingScope;
  const hasVisitors = context.receivesVisitorsOrDeliveries;

  if (hasPhysicalLocations === "yes") {
    questionIds.push(...A72QuestionIds.mandatory);
  } else {
    hiddenQuestionIds.push(...A72QuestionIds.mandatory);
  }

  if (hasPhysicalLocations === "yes") {
    if (hasVisitors === "yes") {
      questionIds.push(A72QuestionIds.conditionalVisitors);
    } else {
      hiddenQuestionIds.push(A72QuestionIds.conditionalVisitors);
      if (hasVisitors !== "no") {
        unresolvedConditions.push("receivesVisitorsOrDeliveries");
      }
    }
  } else if (hasPhysicalLocations === "no") {
    hiddenQuestionIds.push(A72QuestionIds.conditionalVisitors);
  } else {
    hiddenQuestionIds.push(A72QuestionIds.conditionalVisitors);
    if (!unresolvedConditions.includes("hasPhysicalLocationsSupportingScope")) {
      unresolvedConditions.push("hasPhysicalLocationsSupportingScope");
    }
    if (!unresolvedConditions.includes("receivesVisitorsOrDeliveries")) {
      unresolvedConditions.push("receivesVisitorsOrDeliveries");
    }
  }

  const unique = <T,>(values: T[]): T[] => [...new Set(values)];

  if (hasPhysicalLocations === "yes") {
    return {
      controlApplicability: "applicable",
      controlReviewState: unresolvedConditions.length > 0 ? "clarification_required" : "none",
      requiresControlJustification: false,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions: unique(unresolvedConditions),
      assessmentBlocked: unresolvedConditions.length > 0,
    };
  }

  if (hasPhysicalLocations === "no") {
    return {
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions: unique(unresolvedConditions),
      assessmentBlocked: true,
    };
  }

  return {
    controlApplicability: "unresolved",
    controlReviewState: "clarification_required",
    requiresControlJustification: false,
    questionIds: unique(questionIds),
    hiddenQuestionIds: unique(hiddenQuestionIds),
    unresolvedConditions: unique(unresolvedConditions),
    assessmentBlocked: true,
  };
}

export const physicalEntryLegalNotice = {
  fr: "Les contrôles d\u2019accès physique, v\u00e9rifications d\u2019identit\u00e9, registres de visiteurs, moyens biom\u00e9triques, journaux de passage, photographies, r\u00e8gles d\u2019accompagnement, dur\u00e9es de conservation, issues de secours et interventions de prestataires d\u00e9pendent du pays, du droit du travail, de la protection des donn\u00e9es, des exigences de s\u00e9curit\u00e9 des personnes, des exigences incendie, des conventions collectives et des contrats immobiliers applicables. Les dispositifs concern\u00e9s doivent \u00eatre valid\u00e9s par les fonctions Facilities, juridique, vie priv\u00e9e, sant\u00e9\u2011s\u00e9curit\u00e9, et s\u00e9curit\u00e9 de l\u2019information comp\u00e9tentes.\n\nNormCore ne fournit aucun conseil juridique personnalis\u00e9.",
  en: "Physical access controls, identity checks, visitor registers, biometric credentials, entry logs, photographs, escort rules, retention periods, emergency exits, and contractor interventions depend on the country, employment law, data protection law, life-safety requirements, fire regulations, collective agreements, and applicable property contracts. Relevant arrangements should be reviewed by competent Facilities, Legal, Privacy, Health and Safety, and Information Security functions.\n\nNormCore does not provide personalized legal advice."
};

