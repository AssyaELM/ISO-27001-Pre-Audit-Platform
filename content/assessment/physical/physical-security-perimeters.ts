import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A71AssessmentContext = {
  hasPhysicalLocationsSupportingScope?: ContextDecision;
  usesThirdPartyManagedPremises?: ContextDecision;
};

export type A71QuestionCategory =
  | "mandatory"
  | "conditional_third_party";

export type A71QuestionId =
  | "p7_1_001"
  | "p7_1_002"
  | "p7_1_003"
  | "p7_1_004_third_party";

export type A71ConditionKey = "hasPhysicalLocationsSupportingScope" | "usesThirdPartyManagedPremises";

export type A71QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: A71QuestionId[];
  hiddenQuestionIds: A71QuestionId[];
  unresolvedConditions: A71ConditionKey[];
  assessmentBlocked: boolean;
};

export type PhysicalSecurityPerimeterQuestion = {
  id: A71QuestionId;
  category: A71QuestionCategory;
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
  responseOptions: ReadonlyArray<AssessmentAnswerValue>;
  conditionKey?: "usesThirdPartyManagedPremises";
};

export const PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE = "A7_1_PHYSICAL_SECURITY_PERIMETERS_PLAN";

export const PHYSICAL_SECURITY_PERIMETERS_ANSWER_VALUES: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const A71_ANSWER_LABELS = {
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

export const a71QuestionIds = {
  mandatory: ["p7_1_001", "p7_1_002", "p7_1_003"] as const,
  conditionalThirdParty: "p7_1_004_third_party",
} as const;

export const physicalSecurityPerimeterQuestions: PhysicalSecurityPerimeterQuestion[] = [
  {
    id: "p7_1_001",
    category: "mandatory",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle identifié et documenté les périmètres physiques qui protègent les zones où se trouvent des informations ou des actifs associés relevant du périmètre du SMSI, en tenant compte de leur sensibilité et des risques ?",
      en: "Has your organization identified and documented the physical security perimeters protecting areas that contain information or associated assets within the ISMS scope, taking their sensitivity and risks into account?",
    },
    helpText: {
      fr: "Un périmètre est une limite protégeant un site, un bâtiment, une partie de bâtiment, une salle, une zone de stockage ou une autre installation pertinente.\n\nLe processus doit permettre d’identifier :\n\n- les sites et installations concernés ;\n- les informations et actifs présents ;\n- les zones publiques, partagées, contrôlées ou restreintes nécessaires ;\n- les limites physiques et points de passage ;\n- les propriétaires des zones ;\n- les dépendances envers les bailleurs ou fournisseurs ;\n- les risques justifiant le niveau de protection ;\n- les événements déclenchant une mise à jour.",
      en: "A perimeter is a boundary protecting a site, building, part of a building, room, storage area, or another relevant facility.\n\nThe process should identify:\n\n- relevant sites and facilities;\n- information and associated assets present;\n- necessary public, shared, controlled, or restricted areas;\n- physical boundaries and access points;\n- area owners;\n- dependencies on landlords or providers;\n- risks supporting the required protection level;\n- events triggering an update.\n\nNo fixed number of zones or color-coding scheme is required.",
    },
    evidenceHints: {
      fr: [
        "plans de sites ou d’étages",
        "cartographie des zones",
        "registre des sites",
        "analyse de risques physiques",
        "correspondance zones–actifs",
        "propriétaires des zones",
        "procédure de sécurité physique",
        "contrats ou responsabilités partagées",
        "historique d’approbation et de version",
      ],
      en: [
        "site or floor plans",
        "security-zone mapping",
        "site register",
        "physical risk assessment",
        "zone-to-asset mapping",
        "area owners",
        "physical security procedure",
        "agreements or shared-responsibility records",
        "approval and version history",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_PERIMETERS_ANSWER_VALUES,
  },
  {
    id: "p7_1_002",
    category: "mandatory",
    index: 2,
    question: {
      fr: "Les limites, barrières et points de passage définis sont-ils effectivement protégés et maintenus par des mesures proportionnées au risque afin de dissuader, détecter ou retarder les accès non autorisés ?",
      en: "Are the defined boundaries, barriers, and access points effectively protected and maintained through measures proportionate to risk in order to deter, detect, or delay unauthorized access?",
    },
    helpText: {
      fr: "Les mesures peuvent notamment comprendre, selon les risques :\n\n- des murs, portes ou fenêtres ;\n- des serrures ou contrôles d’accès ;\n- une réception ;\n- du gardiennage ;\n- des alarmes ;\n- une détection d’intrusion ;\n- une signalisation ;\n- une séparation entre zones ;\n- des mesures compensatoires.\n\nAucune de ces mesures n’est obligatoire isolément.\n\nLe niveau de protection doit tenir compte :\n\n- de l'information et des actifs présents ;\n- de l'exposition des limites ;\n- des heures d’occupation ;\n- des points d’entrée et de sortie ;\n- des issues de secours ;\n- des espaces partagés ;\n- des obligations de sécurité des personnes ;\n- des contrôles fournis par des tiers.",
      en: "Depending on risk, measures may include:\n\n- walls, doors, or windows;\n- locks or access controls;\n- reception arrangements;\n- guarding;\n- alarms;\n- intrusion detection;\n- signage;\n- separation between zones;\n- compensating measures.\n\nNone of these measures is universally required on its own.\n\nProtection should consider:\n\n- information and associated assets present;\n- boundary exposure;\n- occupied and unoccupied periods;\n- entry and exit points;\n- emergency exits;\n- shared premises;\n- life-safety requirements;\n- controls provided by third parties.",
    },
    evidenceHints: {
      fr: [
        "inspection des limites",
        "plans indiquant les points de passage",
        "inventaire des portes ou ouvertures pertinentes",
        "configuration ou description des protections",
        "rapport de défaut",
        "ticket de réparation",
        "test d’une alarme ou d’une barrière lorsqu’elle existe",
        "mesure compensatoire approuvée",
      ],
      en: [
        "boundary inspection",
        "plans showing access points",
        "controlled photographs",
        "inventory of relevant doors or openings",
        "protection configuration or description",
        "defect report",
        "repair ticket",
        "alarm or barrier test where applicable",
        "approved compensating measure",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_PERIMETERS_ANSWER_VALUES,
  },
  {
    id: "p7_1_003",
    category: "mandatory",
    index: 3,
    question: {
      fr: "Votre organisation conserve-t-elle des preuves à jour des périmètres et zones protégées, de leurs propriétaires, des inspections, des changements, des défauts identifiés et des éventuelles exceptions ?",
      en: "Does your organization retain current evidence of protected perimeters and zones, their owners, inspections, changes, identified defects, and any exceptions?",
    },
    helpText: {
      fr: "Les preuves doivent démontrer que la cartographie et les protections restent cohérentes avec la réalité.\n\nElles peuvent couvrir :\n\n- la version approuvée des plans ;\n- les propriétaires responsables ;\n- les inspections ;\n- les changements d’aménagement ;\n- les ouvertures nouvelles ou condamnées ;\n- les défauts de portes, fenêtres ou barrières ;\n- les réparations ;\n- les protections temporairement indisponibles ;\n- les exceptions et contrôles compensatoires ;\n- les décisions de clôture.\n\nLa fréquence des inspections doit être proportionnée aux risques et aux changements. Ne pas imposer une fréquence trimestrielle ou annuelle universelle.",
      en: "Evidence should demonstrate that documented perimeters and protections remain consistent with actual conditions.\n\nIt may cover:\n\n- approved plan versions;\n- accountable owners;\n- inspections;\n- layout changes;\n- new or removed openings;\n- door, window, or barrier defects;\n- repairs;\n- temporarily unavailable protections;\n- exceptions and compensating controls;\n- closure decisions.\n\nInspection frequency should reflect risk and change. Do not impose a universal quarterly or annual frequency.",
    },
    evidenceHints: {
      fr: [
        "plans approuvés et versionnés",
        "rapports d’inspection",
        "tickets de défaut ou réparation",
        "compte-rendu de changement",
        "photographies datées",
        "preuve de test",
        "registre des exceptions",
        "validation de clôture",
      ],
      en: [
        "approved and version-controlled plans",
        "inspection reports",
        "defect or repair tickets",
        "change records",
        "dated photographs where appropriate",
        "test evidence",
        "exception register",
        "closure approval",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_PERIMETERS_ANSWER_VALUES,
  },
  {
    id: "p7_1_004_third_party",
    category: "conditional_third_party",
    index: 4,
    question: {
      fr: "Lorsque des locaux ou installations pertinents sont gérés par un bailleur, un opérateur de site, un centre de données ou un autre fournisseur, les limites de responsabilités et les preuves de protection des périmètres sont-elles documentées et vérifiables ?",
      en: "Where relevant premises or facilities are managed by a landlord, site operator, data centre, or another provider, are responsibilities and evidence for perimeter protection documented and verifiable?",
    },
    helpText: {
      fr: "La preuve peut être fournie au moyen :\n\n- d’un bail ou contrat ;\n- d’une matrice de responsabilité ;\n- de clauses de sécurité physique ;\n- d’une certification ou attestation pertinente ;\n- d’un rapport d’audit ;\n- d’une description des contrôles du site ;\n- d’une revue fournisseur ;\n- d’une notification d’incident ;\n- d’un registre d’exceptions.\n\nUne certification ne doit pas être considérée automatiquement comme une preuve suffisante pour tous les risques. Elle doit être pertinente pour le site, le service et la responsabilité évalués.",
      en: "Evidence may be provided through:\n\n- a lease or agreement;\n- a responsibility matrix;\n- physical security clauses;\n- a relevant certification or attestation;\n- an audit report;\n- a description of site controls;\n- a supplier review;\n- incident notification arrangements;\n- an exception register.\n\nA certification should not automatically be treated as sufficient evidence for every risk. It should be relevant to the site, service, and responsibility being assessed.",
    },
    evidenceHints: {
      fr: [
        "bail ou contrat",
        "matrice de responsabilité partagée",
        "clauses de sécurité physique",
        "certification et périmètre associé",
        "rapport d’assurance",
        "revue du fournisseur",
        "description des contrôles",
        "incidents et exceptions",
        "actions de suivi",
      ],
      en: [
        "lease or contract",
        "shared-responsibility matrix",
        "physical security clauses",
        "certification and its scope",
        "assurance report",
        "supplier review",
        "control description",
        "incidents and exceptions",
        "follow-up actions",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_PERIMETERS_ANSWER_VALUES,
    conditionKey: "usesThirdPartyManagedPremises",
  },
];

const questionMap = new Map(physicalSecurityPerimeterQuestions.map((q) => [q.id, q]));

export const PHYSICAL_SECURITY_PERIMETER_GAP_CODES = {
  "p7_1_001": {
    partial: "A7_1_PERIMETER_DEFINITION_PARTIAL",
    full: "A7_1_PERIMETER_DEFINITION_ABSENT",
  },
  "p7_1_002": {
    partial: "A7_1_PERIMETER_PROTECTION_PARTIAL",
    full: "A7_1_PERIMETER_PROTECTION_ABSENT",
  },
  "p7_1_003": {
    partial: "A7_1_PERIMETER_ASSURANCE_PARTIAL",
    full: "A7_1_PERIMETER_ASSURANCE_ABSENT",
  },
  "p7_1_004_third_party": {
    partial: "A7_1_THIRD_PARTY_PERIMETER_PARTIAL",
    full: "A7_1_THIRD_PARTY_PERIMETER_ABSENT",
  },
} as const;

export function getPhysicalSecurityPerimeterQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as A71QuestionId);
  if (!question) {
    throw new Error(`Unknown A.7.1 question id: ${questionId}`);
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

export function getAllPhysicalSecurityPerimeterQuestions(locale: AssessmentLocale = "en") {
  return physicalSecurityPerimeterQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isPhysicalSecurityPerimeterQuestion(questionId: string): boolean {
  return questionMap.has(questionId as A71QuestionId);
}

export function resolvePhysicalSecurityPerimeterQuestions(
  context: A71AssessmentContext = {},
): A71QuestionResolution {
  const questionIds: A71QuestionId[] = [];
  const hiddenQuestionIds: A71QuestionId[] = [];
  const unresolvedConditions: A71ConditionKey[] = [];
  const hasPhysicalLocations = context.hasPhysicalLocationsSupportingScope;

  if (hasPhysicalLocations === "yes") {
    questionIds.push(...a71QuestionIds.mandatory);
  } else {
    hiddenQuestionIds.push(...a71QuestionIds.mandatory);
  }

  if (hasPhysicalLocations === "yes") {
    if (context.usesThirdPartyManagedPremises === "yes") {
      questionIds.push(a71QuestionIds.conditionalThirdParty);
    } else {
      hiddenQuestionIds.push(a71QuestionIds.conditionalThirdParty);
      if (context.usesThirdPartyManagedPremises !== "no") {
        unresolvedConditions.push("usesThirdPartyManagedPremises");
      }
    }
  } else if (hasPhysicalLocations === "no") {
    hiddenQuestionIds.push(a71QuestionIds.conditionalThirdParty);
  } else {
    hiddenQuestionIds.push(a71QuestionIds.conditionalThirdParty);
    if (!unresolvedConditions.includes("hasPhysicalLocationsSupportingScope")) {
      unresolvedConditions.push("hasPhysicalLocationsSupportingScope");
    }
    if (!unresolvedConditions.includes("usesThirdPartyManagedPremises")) {
      unresolvedConditions.push("usesThirdPartyManagedPremises");
    }
  }

  const unique = (values: A71QuestionId[]) => [...new Set(values)] as A71QuestionId[];

  if (hasPhysicalLocations === "yes") {
    return {
      controlApplicability: "applicable",
      controlReviewState: unresolvedConditions.length > 0 ? "clarification_required" : "none",
      requiresControlJustification: false,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions,
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
      unresolvedConditions: [],
      assessmentBlocked: true,
    };
  }

  return {
    controlApplicability: "unresolved",
      controlReviewState: "clarification_required",
      requiresControlJustification: false,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions,
      assessmentBlocked: true,
    };
  }

export const physicalSecurityPerimetersLegalNotice = {
  fr: "Les périmètres physiques, restrictions d’accès, inspections, photographies de sites, dispositifs de détection, issues de secours et responsabilités des bailleurs dépendent du pays, des règles de sécurité des personnes, du droit du travail, de la protection des données, des règlements incendie, des accords immobiliers et des obligations sectorielles. Les mesures concernées doivent être validées par les fonctions Facilities, juridique, vie privée, santé et sécurité et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Physical perimeters, access restrictions, inspections, site photographs, detection arrangements, emergency exits, and landlord responsibilities depend on the country, life-safety rules, employment law, data protection law, fire regulations, property agreements, and sector-specific obligations. Relevant measures should be reviewed by competent Facilities, Legal, Privacy, Health and Safety, and Information Security functions.\n\nNormCore does not provide personalized legal advice.",
};
