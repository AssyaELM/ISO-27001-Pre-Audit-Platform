import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A75AssessmentContext = {
  hasPhysicalLocationsSupportingScope?: ContextDecision;
  usesThirdPartyManagedPremises?: ContextDecision;
};

export type PhysicalEnvironmentalThreatQuestionCategory = "main" | "conditional";

export type PhysicalEnvironmentalThreatQuestionId =
  | "p7_5_001"
  | "p7_5_002"
  | "p7_5_003"
  | "p7_5_004_third_party";

export type A75ConditionKey = "hasPhysicalLocationsSupportingScope" | "usesThirdPartyManagedPremises";

export type A75QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: PhysicalEnvironmentalThreatQuestionId[];
  hiddenQuestionIds: PhysicalEnvironmentalThreatQuestionId[];
  unresolvedConditions: A75ConditionKey[];
  assessmentBlocked: boolean;
};

export type PhysicalEnvironmentalThreatQuestion = {
  id: PhysicalEnvironmentalThreatQuestionId;
  category: PhysicalEnvironmentalThreatQuestionCategory;
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
  conditionKey?: A75ConditionKey;
};

export const PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE = "A7_5_PHYSICAL_ENVIRONMENTAL_THREATS_PLAN";

export const PHYSICAL_ENVIRONMENTAL_THREATS_ANSWER_VALUES: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const a75QuestionIds = {
  main: ["p7_5_001", "p7_5_002", "p7_5_003"] as const,
  thirdParty: "p7_5_004_third_party" as const,
} as const;

export const physicalEnvironmentalThreatQuestions: PhysicalEnvironmentalThreatQuestion[] = [
  {
    id: "p7_5_001",
    category: "main",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle évalué, pour chaque site ou dépendance physique pertinente, les menaces physiques et environnementales susceptibles d’affecter les informations, équipements, personnes et services, y compris les évolutions du site, de son usage et des conditions climatiques lorsqu’elles sont pertinentes ?",
      en: "Has your organization assessed, for each relevant site or physical dependency, the physical and environmental threats that could affect information, equipment, people, and services, including changes in the site, its use, and climate-related conditions where relevant?",
    },
    helpText: {
      fr: "L’évaluation doit couvrir les sites et dépendances physiques qui contribuent aux activités du SMSI, qu’ils soient :\n\n- détenus par l’organisation ;\n- loués ;\n- partagés ;\n- exploités en coworking ;\n- gérés par un bailleur ;\n- exploités par un centre de données ;\n- fournis par un prestataire ;\n- utilisés temporairement.\n\nLes menaces doivent être déterminées selon le contexte réel de chaque site.\n\nElles peuvent notamment comprendre, lorsque pertinentes :\n\n- incendie, fumée ou chaleur ;\n- eau, fuite, infiltration ou inondation ;\n- événements météorologiques extrêmes ;\n- tempête, vent, neige ou glace ;\n- température ou humidité anormales ;\n- séisme, mouvement de terrain ou instabilité structurelle ;\n- pollution ou contamination ;\n- accident industriel à proximité ;\n- chute d’objet ou collision ;\n- explosion ;\n- troubles civils ;\n- vandalisme ou attaque physique ;\n- activités dangereuses dans un site voisin ;\n- changement de l’environnement local ;\n- évolution climatique susceptible de modifier le niveau de risque.\n\nL’évaluation peut s’appuyer sur :\n\n- une analyse de risques ;\n- des données publiques ou professionnelles ;\n- des cartes de risques ;\n- des rapports du bailleur ou de l’opérateur ;\n- des inspections ;\n- des incidents antérieurs ;\n- les plans d’urgence ;\n- les exigences des assurances ;\n- les fonctions Facilities, santé-sécurité et continuité d’activité.\n\nIl ne faut pas imposer une liste universelle de menaces ou une mesure climatique particulière.\n\nLa profondeur de l’évaluation doit être proportionnée à la criticité des actifs, services et sites concernés.",
      en: "The assessment should cover physical sites and dependencies supporting the ISMS, whether they are:\n\n- owned by the organization;\n- leased;\n- shared;\n- used as coworking premises;\n- managed by a landlord;\n- operated by a data centre;\n- provided by another supplier;\n- used temporarily.\n\nThreats should be determined according to the actual context of each site.\n\nWhere relevant, they may include:\n\n- fire, smoke, or heat;\n- water, leaks, ingress, or flooding;\n- extreme weather;\n- storms, wind, snow, or ice;\n- abnormal temperature or humidity;\n- earthquakes, ground movement, or structural instability;\n- pollution or contamination;\n- nearby industrial accidents;\n- falling objects or collision;\n- explosion;\n- civil unrest;\n- vandalism or physical attack;\n- hazardous activities at neighboring sites;\n- changes in the local environment;\n- climate-related changes capable of altering the level of risk.\n\nThe assessment may use:\n\n- risk assessments;\n- public or professional data;\n- risk maps;\n- landlord or operator reports;\n- inspections;\n- previous incidents;\n- emergency plans;\n- insurance requirements;\n- Facilities, Health and Safety, and Business Continuity expertise.\n\nDo not impose a universal threat list or any particular climate-related measure.\n\nThe depth of assessment should reflect the criticality of the relevant assets, services, and sites.",
    },
    evidenceHints: {
      fr: [
        "évaluation des risques physiques par site",
        "registre des sites et dépendances",
        "cartes ou données de risques",
        "analyse incendie, inondation ou environnementale",
        "inspection du site",
        "données météorologiques ou climatiques pertinentes",
        "rapport du bailleur ou opérateur",
        "historique d’incidents et quasi-incidents",
        "exigences d’assurance",
        "analyse des activités voisines",
        "propriétaires des risques",
        "décision d’acceptation ou de traitement",
        "historique des changements et revues",
      ],
      en: [
        "site-specific physical risk assessment",
        "site and dependency register",
        "risk maps or data",
        "fire, flood, or environmental analysis",
        "site inspection",
        "relevant weather or climate information",
        "landlord or operator report",
        "incident and near-miss history",
        "insurance requirements",
        "analysis of neighboring activities",
        "risk owners",
        "risk acceptance or treatment decision",
        "change and review history",
      ],
    },
    responseOptions: PHYSICAL_ENVIRONMENTAL_THREATS_ANSWER_VALUES,
  },
  {
    id: "p7_5_002",
    category: "main",
    index: 2,
    question: {
      fr: "Des mesures proportionnées sont-elles mises en œuvre pour prévenir, détecter, traiter et permettre la récupération après les menaces identifiées, en coordination avec la sécurité des personnes, les urgences et la continuité d’activité ?",
      en: "Are proportionate measures implemented to prevent, detect, respond to, and recover from identified threats, in coordination with life safety, emergency, and business continuity arrangements?",
    },
    helpText: {
      fr: "Les mesures doivent répondre aux risques identifiés pour le site et les actifs concernés.\n\nElles peuvent combiner, lorsque cela est justifié :\n\n- prévention ;\n- réduction de l’exposition ;\n- détection ;\n- alerte ;\n- limitation des dommages ;\n- intervention ;\n- évacuation ;\n- mise en sécurité des équipements ;\n- récupération ;\n- continuité ou relocalisation ;\n- mesures compensatoires.\n\nSelon le risque, les mesures peuvent notamment comprendre :\n\n- des exigences de conception ou d’aménagement ;\n- des systèmes de détection ou d’alarme ;\n- des moyens de protection incendie ;\n- des protections contre l’eau ou les infiltrations ;\n- une séparation ou un rangement approprié des actifs ;\n- une protection contre les températures ou conditions environnementales dommageables ;\n- des procédures d’arrêt ou de mise en sécurité ;\n- des moyens d’urgence ;\n- des itinéraires ou zones d’évacuation ;\n- une coordination avec les services du bâtiment ;\n- une coordination avec les secours ;\n- une continuité des activités ;\n- une récupération sur un autre site ou par un autre moyen ;\n- une mesure fournie par un bailleur ou prestataire.\n\nAucune technologie ou mesure particulière n’est obligatoire universellement.\n\nLes mesures techniques ne doivent pas compromettre :\n\n- la sécurité des personnes ;\n- les issues de secours ;\n- les règles incendie ;\n- l’accessibilité ;\n- les obligations réglementaires ;\n- les responsabilités contractuelles.\n\nLa protection de l’information ne doit jamais être mise en œuvre au détriment de la sécurité des personnes.",
      en: "Measures should address the risks identified for the relevant site and assets.\n\nWhere justified, they may combine:\n\n- prevention;\n- exposure reduction;\n- detection;\n- alerting;\n- damage limitation;\n- response;\n- evacuation;\n- equipment shutdown or safeguarding;\n- recovery;\n- continuity or relocation;\n- compensating controls.\n\nDepending on risk, measures may include:\n\n- design or layout requirements;\n- detection or alarm systems;\n- fire-protection arrangements;\n- protection against water or ingress;\n- appropriate separation or storage of assets;\n- protection against harmful temperatures or environmental conditions;\n- shutdown or safeguarding procedures;\n- emergency arrangements;\n- evacuation routes or areas;\n- coordination with building services;\n- coordination with emergency responders;\n- business continuity arrangements;\n- recovery at another site or through another method;\n- measures provided by a landlord or supplier.\n\nNo technology or particular measure is universally required.\n\nTechnical measures should not compromise:\n\n- life safety;\n- emergency exits;\n- fire requirements;\n- accessibility;\n- regulatory obligations;\n- contractual responsibilities.\n\nInformation protection should never be implemented at the expense of human safety.",
    },
    evidenceHints: {
      fr: [
        "plan de traitement des risques",
        "description des protections",
        "plans d’urgence et d’évacuation",
        "inspection des protections",
        "test d’une alarme ou détection",
        "consignes de réponse",
        "procédures de mise en sécurité",
        "plans de continuité et reprise",
        "mesure compensatoire approuvée",
        "rapport d’un bailleur ou fournisseur",
        "vérification après correction",
        "preuve de coordination avec santé-sécurité ou Facilities",
      ],
      en: [
        "risk treatment plan",
        "description of protective measures",
        "emergency and evacuation plans",
        "protection inspection",
        "alarm or detection test",
        "response instructions",
        "safeguarding procedures",
        "continuity and recovery plans",
        "approved compensating control",
        "landlord or supplier report",
        "post-remediation verification",
        "evidence of coordination with Health and Safety or Facilities",
      ],
    },
    responseOptions: PHYSICAL_ENVIRONMENTAL_THREATS_ANSWER_VALUES,
  },
  {
    id: "p7_5_003",
    category: "main",
    index: 3,
    question: {
      fr: "Les inspections, tests, maintenances, exercices, incidents, exceptions, enseignements et actions correctives liés aux menaces physiques et environnementales sont-ils documentés et suivis ?",
      en: "Are inspections, tests, maintenance activities, exercises, incidents, exceptions, lessons learned, and corrective actions relating to physical and environmental threats documented and tracked?",
    },
    helpText: {
      fr: "Les preuves doivent démontrer que les protections restent adaptées, opérationnelles et cohérentes avec l’évolution des risques.\n\nElles peuvent notamment couvrir :\n\n- inspections des locaux ;\n- tests des moyens de détection ou d’alerte ;\n- maintenances ;\n- contrôles réglementaires ou professionnels ;\n- exercices d’urgence ou de continuité ;\n- incidents ;\n- quasi-incidents ;\n- pannes ou indisponibilités ;\n- fausses alertes significatives ;\n- changements du site ou de son usage ;\n- changements de l’environnement local ;\n- exceptions ;\n- mesures compensatoires ;\n- leçons apprises ;\n- actions correctives ;\n- propriétaires et échéances ;\n- preuves de correction ;\n- validations de clôture.\n\nLa fréquence des inspections, tests, maintenances et exercices doit être proportionnée :\n\n- au niveau de risque ;\n- à la criticité du site ;\n- au type de protection ;\n- aux recommandations applicables ;\n- aux exigences réglementaires ou contractuelles ;\n- aux changements ;\n- aux incidents précédents.\n\nNe pas imposer une fréquence mensuelle, trimestrielle ou annuelle universelle.",
      en: "Evidence should demonstrate that protections remain appropriate, operational, and consistent with changes in risk.\n\nIt may cover:\n\n- premises inspections;\n- detection or alert tests;\n- maintenance;\n- regulatory or professional checks;\n- emergency or continuity exercises;\n- incidents;\n- near misses;\n- failures or unavailability;\n- significant false alarms;\n- site or use changes;\n- changes in the local environment;\n- exceptions;\n- compensating controls;\n- lessons learned;\n- corrective actions;\n- owners and due dates;\n- remediation evidence;\n- closure approvals.\n\nInspection, testing, maintenance, and exercise frequency should reflect:\n\n- risk level;\n- site criticality;\n- protection type;\n- applicable recommendations;\n- regulatory or contractual requirements;\n- changes;\n- previous incidents.\n\nDo not impose a universal monthly, quarterly, or annual frequency.",
    },
    evidenceHints: {
      fr: [
        "rapports d’inspection",
        "rapports de tests",
        "tickets de maintenance",
        "certificats ou contrôles applicables",
        "rapports d’exercice",
        "incidents et quasi-incidents",
        "preuve d’une panne et de sa restauration",
        "registre des exceptions",
        "leçons apprises",
        "actions correctives",
        "preuve de correction",
        "validation de clôture",
        "lien vers les plans de continuité et reprise",
      ],
      en: [
        "inspection reports",
        "test reports",
        "maintenance tickets",
        "applicable certificates or checks",
        "exercise reports",
        "incidents and near misses",
        "outage and restoration evidence",
        "exception register",
        "lessons learned",
        "corrective actions",
        "remediation evidence",
        "closure approval",
        "linkage to continuity and recovery plans",
      ],
    },
    responseOptions: PHYSICAL_ENVIRONMENTAL_THREATS_ANSWER_VALUES,
  },
  {
    id: "p7_5_004_third_party",
    category: "conditional",
    index: 4,
    question: {
      fr: "Lorsque les locaux ou installations sont gérés par un bailleur, un centre de données ou un autre fournisseur, les responsabilités, protections environnementales, tests, notifications d’incident et preuves de résilience sont-ils documentés et revus ?",
      en: "Where premises or facilities are managed by a landlord, data centre, or another provider, are responsibilities, environmental protections, testing, incident notification, and resilience evidence documented and reviewed?",
    },
    helpText: {
      fr: "Le dispositif peut notamment couvrir :\n\n- les sites ou installations concernés ;\n- les services et actifs qui en dépendent ;\n- les responsabilités de l’organisation ;\n- les responsabilités du bailleur, opérateur ou fournisseur ;\n- les risques couverts par le fournisseur ;\n- les mesures de prévention et détection ;\n- les plans d’urgence ;\n- les tests et maintenances ;\n- les notifications d’incident ;\n- les pannes ou indisponibilités ;\n- l’accès aux rapports et preuves ;\n- les obligations de continuité et récupération ;\n- les sous-traitants ;\n- les changements de site ou de service ;\n- les exceptions ;\n- les mesures compensatoires ;\n- les actions de suivi.\n\nLes preuves peuvent prendre la forme de :\n\n- contrats ;\n- baux ;\n- matrices de responsabilités ;\n- certifications avec périmètre pertinent ;\n- rapports d’assurance ;\n- rapports de tests ;\n- attestations ;\n- comptes rendus de revue ;\n- notifications d’incident.\n\nUne certification ou un contrat ne constitue pas automatiquement une preuve suffisante.\n\nLes preuves doivent être pertinentes pour :\n\n- le site concerné ;\n- le service utilisé ;\n- la période évaluée ;\n- les responsabilités réellement confiées au fournisseur.",
      en: "Arrangements may cover:\n\n- relevant sites or facilities;\n- dependent services and assets;\n- organizational responsibilities;\n- landlord, operator, or supplier responsibilities;\n- risks addressed by the provider;\n- prevention and detection measures;\n- emergency plans;\n- testing and maintenance;\n- incident notification;\n- failures or unavailability;\n- access to reports and evidence;\n- continuity and recovery obligations;\n- subcontractors;\n- site or service changes;\n- exceptions;\n- compensating controls;\n- follow-up actions.\n\nEvidence may include:\n\n- agreements;\n- leases;\n- responsibility matrices;\n- certifications with relevant scope;\n- assurance reports;\n- test reports;\n- attestations;\n- review records;\n- incident notifications.\n\nA certification or agreement is not automatically sufficient evidence.\n\nEvidence should be relevant to:\n\n- the site concerned;\n- the service used;\n- the assessed period;\n- the responsibilities actually assigned to the provider.",
    },
    evidenceHints: {
      fr: [
        "bail ou contrat",
        "matrice de responsabilités",
        "description des protections environnementales",
        "analyse de risques du fournisseur",
        "certification et périmètre associé",
        "rapport d’assurance",
        "rapport de test ou maintenance",
        "plan d’urgence",
        "notification d’incident",
        "rapport de continuité ou reprise",
        "revue du fournisseur",
        "exception et action de suivi",
      ],
      en: [
        "lease or agreement",
        "responsibility matrix",
        "description of environmental protections",
        "supplier risk assessment",
        "certification and associated scope",
        "assurance report",
        "test or maintenance report",
        "emergency plan",
        "incident notification",
        "continuity or recovery report",
        "supplier review",
        "exception and follow-up action",
      ],
    },
    responseOptions: PHYSICAL_ENVIRONMENTAL_THREATS_ANSWER_VALUES,
    conditionKey: "usesThirdPartyManagedPremises",
  },
];

const questionMap = new Map(physicalEnvironmentalThreatQuestions.map((q) => [q.id, q]));

export const PHYSICAL_ENVIRONMENTAL_THREATS_GAP_CODES = {
  "p7_5_001": {
    partial: "A7_5_THREAT_ASSESSMENT_PARTIAL",
    full: "A7_5_THREAT_ASSESSMENT_ABSENT",
  },
  "p7_5_002": {
    partial: "A7_5_PROTECTIVE_MEASURES_PARTIAL",
    full: "A7_5_PROTECTIVE_MEASURES_ABSENT",
  },
  "p7_5_003": {
    partial: "A7_5_TESTING_ASSURANCE_PARTIAL",
    full: "A7_5_TESTING_ASSURANCE_ABSENT",
  },
  "p7_5_004_third_party": {
    partial: "A7_5_THIRD_PARTY_RESILIENCE_PARTIAL",
    full: "A7_5_THIRD_PARTY_RESILIENCE_ABSENT",
  },
} as const;

export function resolvePhysicalEnvironmentalThreatQuestions(
  context: A75AssessmentContext = {},
): A75QuestionResolution {
  const questionIds: PhysicalEnvironmentalThreatQuestionId[] = [];
  const hiddenQuestionIds: PhysicalEnvironmentalThreatQuestionId[] = [];
  const unresolvedConditions: A75ConditionKey[] = [];
  const hasPhysicalLocations = context.hasPhysicalLocationsSupportingScope;

  if (hasPhysicalLocations === "yes") {
    questionIds.push(...a75QuestionIds.main);
  } else {
    hiddenQuestionIds.push(...a75QuestionIds.main);
  }

  if (hasPhysicalLocations === "yes") {
    if (context.usesThirdPartyManagedPremises === "yes") {
      questionIds.push(a75QuestionIds.thirdParty);
    } else {
      hiddenQuestionIds.push(a75QuestionIds.thirdParty);
      if (context.usesThirdPartyManagedPremises !== "no") {
        unresolvedConditions.push("usesThirdPartyManagedPremises");
      }
    }
  } else if (hasPhysicalLocations === "no") {
    hiddenQuestionIds.push(a75QuestionIds.thirdParty);
  } else {
    hiddenQuestionIds.push(a75QuestionIds.thirdParty);
    if (!unresolvedConditions.includes("hasPhysicalLocationsSupportingScope")) {
      unresolvedConditions.push("hasPhysicalLocationsSupportingScope");
    }
  }

  const unique = (values: PhysicalEnvironmentalThreatQuestionId[]) => [...new Set(values)] as PhysicalEnvironmentalThreatQuestionId[];

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

export function getPhysicalEnvironmentalThreatQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as PhysicalEnvironmentalThreatQuestionId);
  if (!question) {
    throw new Error(`Unknown A.7.5 question id: ${questionId}`);
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

export function getAllPhysicalEnvironmentalThreatQuestions(locale: AssessmentLocale = "en") {
  return physicalEnvironmentalThreatQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isPhysicalEnvironmentalThreatQuestion(questionId: string): boolean {
  return questionMap.has(questionId as PhysicalEnvironmentalThreatQuestionId);
}

export const physicalEnvironmentalThreatLegalNotice = {
  fr: "Les mesures de protection contre l’incendie, l’eau, les conditions environnementales, les événements météorologiques, les risques structurels, les situations d’urgence et les autres menaces physiques dépendent du pays, de la réglementation locale, des codes du bâtiment, des règles incendie, de la sécurité des personnes, de la santé-sécurité au travail, des exigences environnementales, des règles d’accessibilité, des assurances, des contrats immobiliers et des obligations sectorielles applicables. Les inspections, tests, exercices, systèmes de détection, moyens d’extinction et plans d’évacuation concernés doivent être validés par les fonctions Facilities, juridique, santé-sécurité, continuité d’activité, gestion des risques et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Measures protecting against fire, water, environmental conditions, weather events, structural risks, emergencies, and other physical threats depend on the country, local regulations, building codes, fire requirements, life-safety rules, occupational health and safety law, environmental requirements, accessibility rules, insurance requirements, property agreements, and applicable sector-specific obligations. Relevant inspections, tests, exercises, detection systems, suppression arrangements, and evacuation plans should be reviewed by competent Facilities, Legal, Health and Safety, Business Continuity, Risk Management, and Information Security functions.\n\nNormCore does not provide personalized legal advice.",
};
