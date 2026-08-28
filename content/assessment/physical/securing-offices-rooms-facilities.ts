import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A73AssessmentContext = {
  hasPhysicalLocationsSupportingScope?: ContextDecision;
  hasRestrictedOrSecureAreas?: ContextDecision;
  usesThirdPartyManagedPremises?: ContextDecision;
};

export type SecureOfficesFacilitiesQuestionCategory =
  | "main"
  | "conditional";

export type SecureOfficesFacilitiesQuestionId =
  | "p7_3_001"
  | "p7_3_002"
  | "p7_3_003"
  | "p7_3_004_restricted_areas"
  | "p7_3_005_shared_premises";

export type A73ConditionKey = "hasPhysicalLocationsSupportingScope" | "hasRestrictedOrSecureAreas" | "usesThirdPartyManagedPremises";

export type A73QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: SecureOfficesFacilitiesQuestionId[];
  hiddenQuestionIds: SecureOfficesFacilitiesQuestionId[];
  unresolvedConditions: A73ConditionKey[];
  assessmentBlocked: boolean;
};

export type SecureOfficesFacilitiesQuestion = {
  id: SecureOfficesFacilitiesQuestionId;
  category: SecureOfficesFacilitiesQuestionCategory;
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
  conditionKey?: A73ConditionKey;
};

export const SECURING_OFFICES_FACILITIES_PLAN_CODE = "A7_3_SECURE_OFFICES_FACILITIES_PLAN";

export const SECURING_OFFICES_FACILITIES_ANSWER_VALUES: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const a73QuestionIds = {
  main: ["p7_3_001", "p7_3_002", "p7_3_003"] as const,
  restrictedAreas: "p7_3_004_restricted_areas" as const,
  sharedPremises: "p7_3_005_shared_premises" as const,
} as const;

export const securingOfficesFacilitiesQuestions: SecureOfficesFacilitiesQuestion[] = [
  {
    id: "p7_3_001",
    category: "main",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini des exigences de conception et de sécurisation pour les bureaux, salles et installations, en fonction des informations, actifs, activités et menaces qui leur sont associés ?",
      en: "Has your organization defined security design and protection requirements for offices, rooms, and facilities based on their associated information, assets, activities, and threats?",
    },
    helpText: {
      fr: "Les exigences doivent être proportionnées aux risques et au contexte réel des locaux.\n\nElles peuvent notamment prendre en compte :\n\n- les bureaux, salles et installations concernés ;\n- les informations, équipements et autres actifs présents ;\n- les activités réalisées dans les locaux ;\n- la sensibilité et la criticité des actifs ;\n- les périodes d’occupation et d’inoccupation ;\n- l’exposition au public ou à des tiers ;\n- les espaces communs ou partagés ;\n- les risques d’accès, d’observation, d’altération ou de dommage ;\n- les responsabilités des propriétaires de zones ;\n- les responsabilités des bailleurs ou opérateurs de site ;\n- les besoins des personnes en situation de handicap ;\n- les règles d’évacuation et de sécurité des personnes ;\n- les changements d’usage ou d’aménagement ;\n- les mesures compensatoires.\n\nUne politique autonome A.7.3 n’est pas obligatoire. Les exigences peuvent être intégrées à une politique ou procédure de sécurité physique, de gestion des locaux, de sécurité des actifs ou de gestion des risques.",
      en: "Requirements should reflect risk and the actual operating context of the premises.\n\nThey may consider:\n\n- relevant offices, rooms, and facilities;\n- information, equipment, and other assets present;\n- activities performed in the premises;\n- asset sensitivity and criticality;\n- occupied and unoccupied periods;\n- exposure to the public or third parties;\n- common or shared areas;\n- risks of unauthorized access, observation, tampering, or damage;\n- area-owner responsibilities;\n- landlord or site-operator responsibilities;\n- accessibility needs;\n- evacuation and life-safety requirements;\n- changes in use or layout;\n- compensating controls.\n\nA standalone A.7.3 policy is not required. Requirements may be incorporated into physical security, facilities, asset-security, or risk-management documents.",
    },
    evidenceHints: {
      fr: [
        "exigences ou procédure de sécurité des locaux",
        "registre des sites, bureaux et salles",
        "plans ou cartographies des zones",
        "inventaire des actifs présents",
        "analyse de risques physiques",
        "classification ou criticité des zones",
        "propriétaires des zones",
        "exigences de fermeture ou protection",
        "responsabilités du bailleur ou opérateur",
        "compte rendu d’approbation",
        "historique des versions et changements",
      ],
      en: [
        "premises security requirements or procedure",
        "site, office, and room register",
        "plans or area maps",
        "inventory of assets present",
        "physical risk assessment",
        "area classification or criticality",
        "area owners",
        "closing or protection requirements",
        "landlord or operator responsibilities",
        "approval record",
        "version and change history",
      ],
    },
    responseOptions: SECURING_OFFICES_FACILITIES_ANSWER_VALUES,
  },
  {
    id: "p7_3_002",
    category: "main",
    index: 2,
    question: {
      fr: "Les protections physiques définies sont-elles effectivement mises en œuvre et maintenues afin d’empêcher l’accès, l’observation, l’altération ou l’endommagement non autorisés lorsque les locaux sont occupés ou inoccupés ?",
      en: "Are the defined physical protections effectively implemented and maintained to prevent unauthorized access, observation, tampering, or damage when the premises are occupied or unattended?",
    },
    helpText: {
      fr: "Les protections doivent correspondre aux risques des locaux et des actifs.\n\nElles peuvent notamment comprendre :\n\n- des portes, murs, fenêtres ou autres limites ;\n- des serrures mécaniques ou électroniques ;\n- un rangement sécurisé ;\n- une organisation appropriée de l’espace ;\n- une protection contre l’observation depuis l’extérieur ou une zone commune ;\n- une gestion de la fermeture des locaux ;\n- une limitation des informations révélant la localisation d’actifs sensibles ;\n- une signalisation appropriée ;\n- une réception, un gardiennage ou une surveillance lorsqu’ils sont justifiés ;\n- des alarmes lorsqu’elles sont justifiées ;\n- une protection temporaire pendant des travaux ou changements ;\n- des mesures compensatoires.\n\nAucune mesure particulière n’est obligatoire isolément.\n\nLe contrôle ne doit pas imposer :\n\n- des fenêtres renforcées ;\n- des vitres teintées ;\n- des murs allant obligatoirement de dalle à dalle ;\n- une alarme dans chaque pièce ;\n- un verrouillage automatique de chaque porte ;\n- un bureau serveur ou une salle serveur interne ;\n- une interdiction universelle de photographie.",
      en: "Protections should reflect the risks of the premises and assets.\n\nThey may include:\n\n- doors, walls, windows, or other boundaries;\n- mechanical or electronic locks;\n- secure storage;\n- appropriate spatial organization;\n- protection against observation from outside or common areas;\n- premises-closing arrangements;\n- limiting unnecessary disclosure of sensitive asset locations;\n- appropriate signage;\n- reception, guarding, or monitoring where justified;\n- alarms where justified;\n- temporary protection during work or changes;\n- compensating controls.\n\nNo particular measure is universally required on its own.\n\nThe control should not universally require:\n\n- reinforced windows;\n- tinted glass;\n- slab-to-slab walls;\n- an alarm in every room;\n- automatic locking of every door;\n- an internal server room;\n- a universal photography ban.",
    },
    evidenceHints: {
      fr: [
        "inspection des bureaux et salles",
        "plans indiquant les protections",
        "photographies contrôlées lorsqu’elles sont appropriées",
        "configuration ou description des serrures",
        "règles de fermeture",
        "inspection de l’exposition visuelle",
        "contrôle du rangement",
        "preuve d’une mesure compensatoire",
        "rapport de défaut",
        "ticket de réparation",
        "preuve de vérification après correction",
      ],
      en: [
        "office and room inspection",
        "plans showing protections",
        "controlled photographs where appropriate",
        "lock configuration or description",
        "closing rules",
        "visual-exposure inspection",
        "storage checks",
        "compensating-control evidence",
        "defect report",
        "repair ticket",
        "post-remediation verification",
      ],
    },
    responseOptions: SECURING_OFFICES_FACILITIES_ANSWER_VALUES,
  },
  {
    id: "p7_3_003",
    category: "main",
    index: 3,
    question: {
      fr: "Les inspections, défauts, réparations, changements d’aménagement, responsabilités et protections fournies par les contrats immobiliers ou opérateurs de site sont-ils documentés et traçables ?",
      en: "Are inspections, defects, repairs, layout changes, responsibilities, and protections provided through property agreements or site operators documented and traceable?",
    },
    helpText: {
      fr: "Les preuves doivent démontrer que les protections restent cohérentes avec l’usage réel des bureaux, salles et installations.\n\nElles peuvent notamment couvrir :\n\n- les inspections ou walkthroughs ;\n- les portes, fenêtres, serrures ou rangements défectueux ;\n- les réparations ;\n- les changements d’aménagement ;\n- les changements d’usage d’une pièce ;\n- les travaux ;\n- les occupations temporaires ;\n- le stockage temporaire d’actifs ou de documents ;\n- les interventions de prestataires ;\n- les protections momentanément indisponibles ;\n- les responsabilités du bailleur ou opérateur ;\n- les exceptions ;\n- les mesures compensatoires ;\n- les actions correctives ;\n- les validations de clôture.\n\nLa fréquence des inspections doit être proportionnée aux risques et aux changements. Ne pas imposer une fréquence mensuelle, trimestrielle ou annuelle universelle.",
      en: "Evidence should demonstrate that protection remains consistent with the actual use of offices, rooms, and facilities.\n\nIt may cover:\n\n- inspections or walkthroughs;\n- defective doors, windows, locks, or storage;\n- repairs;\n- layout changes;\n- changes in room use;\n- construction or maintenance work;\n- temporary occupancy;\n- temporary storage of assets or documents;\n- contractor interventions;\n- temporarily unavailable protections;\n- landlord or operator responsibilities;\n- exceptions;\n- compensating controls;\n- corrective actions;\n- closure approvals.\n\nInspection frequency should reflect risk and change. Do not impose a universal monthly, quarterly, or annual frequency.",
    },
    evidenceHints: {
      fr: [
        "rapports d’inspection",
        "liste de défauts",
        "tickets de réparation",
        "compte rendu de changement d’aménagement",
        "autorisation de travaux",
        "contrôle après travaux",
        "contrat ou bail",
        "rapport du gestionnaire du site",
        "registre des exceptions",
        "action corrective",
        "preuve et validation de clôture",
      ],
      en: [
        "inspection reports",
        "defect list",
        "repair tickets",
        "layout-change records",
        "work authorization",
        "post-work verification",
        "lease or property agreement",
        "site-operator report",
        "exception register",
        "corrective action",
        "closure evidence and approval",
      ],
    },
    responseOptions: SECURING_OFFICES_FACILITIES_ANSWER_VALUES,
  },
  {
    id: "p7_3_004_restricted_areas",
    category: "conditional",
    index: 4,
    question: {
      fr: "Les salles ou zones restreintes, telles que les salles serveurs, locaux réseau, archives, laboratoires ou stockages sensibles, bénéficient-elles de protections renforcées adaptées à leur criticité ?",
      en: "Do restricted rooms or areas, such as server rooms, network rooms, archives, laboratories, or sensitive storage areas, have enhanced protections appropriate to their criticality?",
    },
    helpText: {
      fr: "Une zone restreinte est une salle ou un espace pour lequel une protection supérieure à celle des locaux ordinaires est justifiée par les risques.\n\nLes protections renforcées peuvent notamment porter sur :\n\n- la séparation physique ;\n- l’autorisation d’accès ;\n- la robustesse des limites ;\n- la limitation des points d’entrée ;\n- la protection contre l’observation ;\n- la protection des clés ou moyens d’accès ;\n- la présence de visiteurs ou prestataires ;\n- les heures d’inoccupation ;\n- la confidentialité de l’emplacement ou de l’usage ;\n- la détection ou l’alerte lorsqu’elle est justifiée ;\n- les inspections ;\n- les mesures compensatoires.\n\nLe contrôle ne doit pas imposer :\n\n- une salle serveur ;\n- la biométrie ;\n- un badge ;\n- un sas ;\n- une double authentification physique ;\n- un mur dalle à dalle ;\n- une alarme ou CCTV ;\n- une technologie particulière.",
      en: "A restricted area is a room or space where protection beyond that of ordinary premises is justified by risk.\n\nEnhanced protection may address:\n\n- physical separation;\n- access authorization;\n- boundary robustness;\n- limiting access points;\n- protection against observation;\n- protection of keys or access credentials;\n- visitors or contractors;\n- unoccupied periods;\n- confidentiality of location or use;\n- detection or alerting where justified;\n- inspections;\n- compensating controls.\n\nThe control should not require:\n\n- a server room;\n- biometrics;\n- badges;\n- a mantrap;\n- dual physical authentication;\n- slab-to-slab walls;\n- alarms or CCTV;\n- any particular technology.",
    },
    evidenceHints: {
      fr: [
        "liste des zones restreintes",
        "justification de leur criticité",
        "plans ou cartographies",
        "matrice d’accès",
        "description des protections",
        "inspection",
        "liste des personnes autorisées",
        "test des protections lorsqu’il existe",
        "défauts et réparations",
        "exceptions et mesures compensatoires",
      ],
      en: [
        "restricted-area list",
        "criticality justification",
        "plans or maps",
        "access matrix",
        "protection description",
        "inspection",
        "authorized-person list",
        "protection tests where used",
        "defects and repairs",
        "exceptions and compensating controls",
      ],
    },
    responseOptions: SECURING_OFFICES_FACILITIES_ANSWER_VALUES,
    conditionKey: "hasRestrictedOrSecureAreas",
  },
  {
    id: "p7_3_005_shared_premises",
    category: "conditional",
    index: 5,
    question: {
      fr: "Dans les espaces partagés, coworking ou bâtiments multi-occupants, les limites entre zones communes, zones réservées et actifs sensibles sont-elles clairement protégées, avec des responsabilités et mesures compensatoires documentées ?",
      en: "In shared premises, coworking spaces, or multi-tenant buildings, are boundaries between common areas, restricted areas, and sensitive assets clearly protected, with documented responsibilities and compensating measures?",
    },
    helpText: {
      fr: "Le dispositif peut notamment traiter :\n\n- les zones communes et réservées ;\n- les responsabilités du locataire et du bailleur ;\n- les responsabilités de l’opérateur de coworking ;\n- les autres occupants ;\n- les accès partagés ;\n- la réception ;\n- le nettoyage ;\n- la maintenance ;\n- les travaux ;\n- les visiteurs et livraisons ;\n- la visibilité des écrans ou documents ;\n- le stockage d’actifs ;\n- les clés, badges ou moyens fournis par le gestionnaire ;\n- les notifications d’incident ;\n- les changements d’aménagement ou d’occupation ;\n- les mesures compensatoires.\n\nL’utilisation d’un coworking ou de locaux loués ne constitue pas en elle-même un gap.",
      en: "Arrangements may address:\n\n- common and restricted areas;\n- tenant and landlord responsibilities;\n- coworking-operator responsibilities;\n- other occupants;\n- shared access;\n- reception;\n- cleaning;\n- maintenance;\n- construction work;\n- visitors and deliveries;\n- visibility of screens or documents;\n- asset storage;\n- keys, badges, or credentials provided by the operator;\n- incident notifications;\n- layout or occupancy changes;\n- compensating controls.\n\nUsing coworking or leased premises is not in itself a gap.",
    },
    evidenceHints: {
      fr: [
        "bail ou contrat",
        "règles du bâtiment ou coworking",
        "matrice de responsabilités",
        "plan des zones communes et réservées",
        "clauses de sécurité",
        "procédure de nettoyage ou maintenance",
        "description des contrôles fournis",
        "rapport ou attestation du gestionnaire",
        "incident ou notification",
        "exception et mesure compensatoire",
        "revue du site ou fournisseur",
      ],
      en: [
        "lease or agreement",
        "building or coworking rules",
        "responsibility matrix",
        "common and restricted area plan",
        "security clauses",
        "cleaning or maintenance procedure",
        "description of provided controls",
        "operator report or attestation",
        "incident or notification",
        "exception and compensating control",
        "site or supplier review",
      ],
    },
    responseOptions: SECURING_OFFICES_FACILITIES_ANSWER_VALUES,
    conditionKey: "usesThirdPartyManagedPremises",
  },
];

const questionMap = new Map(securingOfficesFacilitiesQuestions.map((q) => [q.id, q]));

export const SECURING_OFFICES_FACILITIES_GAP_CODES = {
  "p7_3_001": {
    partial: "A7_3_SECURITY_DESIGN_PARTIAL",
    full: "A7_3_SECURITY_DESIGN_ABSENT",
  },
  "p7_3_002": {
    partial: "A7_3_FACILITY_PROTECTION_PARTIAL",
    full: "A7_3_FACILITY_PROTECTION_ABSENT",
  },
  "p7_3_003": {
    partial: "A7_3_FACILITY_ASSURANCE_PARTIAL",
    full: "A7_3_FACILITY_ASSURANCE_ABSENT",
  },
  "p7_3_004_restricted_areas": {
    partial: "A7_3_RESTRICTED_AREAS_PARTIAL",
    full: "A7_3_RESTRICTED_AREAS_ABSENT",
  },
  "p7_3_005_shared_premises": {
    partial: "A7_3_SHARED_PREMISES_PARTIAL",
    full: "A7_3_SHARED_PREMISES_ABSENT",
  },
} as const;

export function resolveSecureOfficesFacilitiesQuestions(
  context: A73AssessmentContext = {},
): A73QuestionResolution {
  const questionIds: SecureOfficesFacilitiesQuestionId[] = [];
  const hiddenQuestionIds: SecureOfficesFacilitiesQuestionId[] = [];
  const unresolvedConditions: A73ConditionKey[] = [];
  const hasPhysicalLocations = context.hasPhysicalLocationsSupportingScope;

  if (hasPhysicalLocations === "yes") {
    questionIds.push(...a73QuestionIds.main);
  } else {
    hiddenQuestionIds.push(...a73QuestionIds.main);
  }

  if (hasPhysicalLocations === "yes") {
    if (context.hasRestrictedOrSecureAreas === "yes") {
      questionIds.push(a73QuestionIds.restrictedAreas);
    } else {
      hiddenQuestionIds.push(a73QuestionIds.restrictedAreas);
      if (context.hasRestrictedOrSecureAreas !== "no") {
        unresolvedConditions.push("hasRestrictedOrSecureAreas");
      }
    }

    if (context.usesThirdPartyManagedPremises === "yes") {
      questionIds.push(a73QuestionIds.sharedPremises);
    } else {
      hiddenQuestionIds.push(a73QuestionIds.sharedPremises);
      if (context.usesThirdPartyManagedPremises !== "no") {
        unresolvedConditions.push("usesThirdPartyManagedPremises");
      }
    }
  } else if (hasPhysicalLocations === "no") {
    hiddenQuestionIds.push(a73QuestionIds.restrictedAreas, a73QuestionIds.sharedPremises);
  } else {
    hiddenQuestionIds.push(a73QuestionIds.restrictedAreas, a73QuestionIds.sharedPremises);
    if (!unresolvedConditions.includes("hasPhysicalLocationsSupportingScope")) {
      unresolvedConditions.push("hasPhysicalLocationsSupportingScope");
    }
  }

  const unique = (values: SecureOfficesFacilitiesQuestionId[]) => [...new Set(values)] as SecureOfficesFacilitiesQuestionId[];

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

export function getSecureOfficesFacilitiesQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as SecureOfficesFacilitiesQuestionId);
  if (!question) {
    throw new Error(`Unknown A.7.3 question id: ${questionId}`);
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

export function getAllSecureOfficesFacilitiesQuestions(locale: AssessmentLocale = "en") {
  return securingOfficesFacilitiesQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isSecureOfficesFacilitiesQuestion(questionId: string): boolean {
  return questionMap.has(questionId as SecureOfficesFacilitiesQuestionId);
}

export const securingOfficesFacilitiesLegalNotice = {
  fr: "La conception et la sécurisation des bureaux, salles et installations, les serrures, alarmes, photographies, inspections, règles applicables aux visiteurs, restrictions d’usage, travaux, surveillance, accessibilité, évacuation et responsabilités des bailleurs dépendent du pays, du droit du travail, de la protection des données, des règles de sécurité des personnes, des exigences incendie, des règles d’accessibilité, des contrats immobiliers et des obligations sectorielles applicables. Les dispositifs concernés doivent être validés par les fonctions Facilities, juridique, vie privée, santé-sécurité, accessibilité et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "The design and protection of offices, rooms, and facilities, including locks, alarms, photographs, inspections, visitor rules, use restrictions, construction work, monitoring, accessibility, evacuation, and landlord responsibilities, depend on the country, employment law, data protection law, life-safety requirements, fire regulations, accessibility rules, property agreements, and applicable sector-specific obligations. Relevant arrangements should be reviewed by competent Facilities, Legal, Privacy, Health and Safety, Accessibility, and Information Security functions.\n\nNormCore does not provide personalized legal advice.",
};
