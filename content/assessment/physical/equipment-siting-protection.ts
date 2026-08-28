export type EquipmentSitingProtectionQuestionId =
  | "p7_8_001"
  | "p7_8_002"
  | "p7_8_003";

export const EQUIPMENT_SITING_PROTECTION_PLAN_CODE =
  "A7_8_EQUIPMENT_SITING_PROTECTION_PLAN";

export const EQUIPMENT_SITING_PROTECTION_GAP_CODES = {
  P7_8_001_PARTIAL: "A7_8_SITING_REQUIREMENTS_PARTIAL",
  P7_8_001_FULL: "A7_8_SITING_REQUIREMENTS_ABSENT",
  P7_8_002_PARTIAL: "A7_8_EQUIPMENT_PROTECTION_PARTIAL",
  P7_8_002_FULL: "A7_8_EQUIPMENT_PROTECTION_ABSENT",
  P7_8_003_PARTIAL: "A7_8_EQUIPMENT_ASSURANCE_PARTIAL",
  P7_8_003_FULL: "A7_8_EQUIPMENT_ASSURANCE_ABSENT",
} as const;

export type EquipmentSitingProtectionQuestion = {
  id: EquipmentSitingProtectionQuestionId;
  type: "policy_process" | "application" | "proof_traceability";
  status: "main";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  help: { fr: string; en: string };
  suggestedEvidence: { fr: string[]; en: string[] };
};

export const equipmentSitingProtectionQuestions: EquipmentSitingProtectionQuestion[] =
  [
    {
      id: "p7_8_001",
      type: "policy_process",
      status: "main",
      title: {
        fr: "Exigences d'implantation et de protection des équipements",
        en: "Equipment siting and protection requirements",
      },
      question: {
        fr: "Votre organisation a-t-elle défini comment les équipements traitant ou supportant les informations du SMSI doivent être implantés et protégés en fonction de leur sensibilité, criticité et exposition aux risques physiques ?",
        en: "Has your organization determined how equipment processing or supporting ISMS information should be sited and protected according to its sensitivity, criticality, and exposure to physical risks?",
      },
      help: {
        fr: "Les critères doivent être proportionnés aux équipements et risques réellement présents.\n\nSelon le contexte, considérer notamment :\n- la sensibilité des informations traitées ;\n- la criticité de l'équipement ;\n- les personnes pouvant accéder physiquement à l'emplacement ;\n- l'observation possible d'informations ;\n- le risque de vol ;\n- le risque de manipulation non autorisée ;\n- les chocs ou dommages accidentels ;\n- l'eau ou les liquides ;\n- la chaleur ou le froid ;\n- l'humidité lorsque pertinente ;\n- la poussière lorsque pertinente ;\n- les vibrations lorsque pertinentes ;\n- les interférences lorsque pertinentes ;\n- l'exposition à des espaces publics ou partagés ;\n- les recommandations du constructeur lorsque pertinentes ;\n- les responsabilités lorsque l'équipement se trouve dans un site tiers ;\n- les exceptions et mesures compensatoires.\n\nL'objectif est de définir les résultats de protection nécessaires, pas d'imposer une technologie particulière.",
        en: "Criteria should be proportionate to the equipment and actual risks involved.\n\nDepending on context, consider:\n- sensitivity of processed information;\n- equipment criticality;\n- people who may physically access the location;\n- possible visual observation of information;\n- theft risk;\n- unauthorized handling risk;\n- accidental impact or damage;\n- water or liquids;\n- heat or cold;\n- humidity where relevant;\n- dust where relevant;\n- vibration where relevant;\n- interference where relevant;\n- exposure to public or shared spaces;\n- manufacturer guidance where relevant;\n- responsibilities where equipment is located at a third-party site;\n- exceptions and compensating controls.\n\nThe objective is to define necessary protection outcomes, not to mandate a particular technology.",
      },
      suggestedEvidence: {
        fr: [
          "critères d'implantation",
          "procédure de déploiement ou installation",
          "évaluation de risque",
          "inventaire ou liste d'équipements pertinents",
          "plan ou description d'emplacement",
          "standard de protection physique",
          "procédure Facilities",
          "recommandations constructeur pertinentes",
          "contrat ou responsabilité fournisseur lorsque pertinent",
          "décision d'exception",
          "mesure compensatoire",
        ],
        en: [
          "siting criteria",
          "deployment or installation procedure",
          "risk assessment",
          "inventory or list of relevant equipment",
          "location plan or description",
          "physical protection standard",
          "Facilities procedure",
          "relevant manufacturer guidance",
          "supplier contract or responsibility where relevant",
          "exception decision",
          "compensating control",
        ],
      },
    },
    {
      id: "p7_8_002",
      type: "application",
      status: "main",
      title: {
        fr: "Protection effective des équipements",
        en: "Effective equipment protection",
      },
      question: {
        fr: "Les équipements sont-ils effectivement positionnés et protégés de manière proportionnée afin de réduire les risques d'accès ou d'observation non autorisés, de vol, de dommage, d'interférence ou de conditions environnementales nuisibles ?",
        en: "Is equipment effectively positioned and protected in a proportionate manner to reduce risks of unauthorized access or observation, theft, damage, interference, or harmful environmental conditions?",
      },
      help: {
        fr: "Évaluer l'exposition réelle des équipements plutôt que rechercher un dispositif technique précis.\n\nSelon le contexte, vérifier notamment :\n- emplacement par rapport aux personnes non autorisées ;\n- visibilité des écrans ou informations ;\n- risque de vol ou déplacement non autorisé ;\n- possibilité de manipulation ;\n- risques de choc ou chute ;\n- exposition à l'eau ou liquides ;\n- exposition excessive à chaleur ou froid ;\n- poussière, humidité ou vibration lorsque pertinentes ;\n- risques d'interférence lorsque pertinents ;\n- protection contre des dommages accidentels ;\n- conditions réellement fournies par un site ou fournisseur tiers ;\n- adéquation des mesures compensatoires.\n\nLes moyens possibles peuvent notamment être :\n- repositionnement ;\n- restriction physique d'accès ;\n- fixation ou protection physique ;\n- séparation ;\n- protection visuelle ;\n- contrôle environnemental ;\n- capteur ;\n- alarme ;\n- protection contre les liquides ;\n- protection contre les chocs ;\n- autre mesure adaptée.\n\nCes exemples ne sont pas des obligations universelles.",
        en: "Assess actual equipment exposure rather than looking for a specific technical control.\n\nDepending on context, consider:\n- location relative to unauthorized people;\n- visibility of screens or information;\n- theft or unauthorized movement risk;\n- potential unauthorized handling;\n- impact or fall risk;\n- exposure to water or liquids;\n- excessive heat or cold;\n- dust, humidity, or vibration where relevant;\n- interference risks where relevant;\n- protection from accidental damage;\n- conditions actually provided by a third-party location or supplier;\n- adequacy of compensating controls.\n\nPossible measures may include:\n- repositioning;\n- physical access restriction;\n- physical securing or protection;\n- separation;\n- visual protection;\n- environmental control;\n- sensors;\n- alarms;\n- liquid protection;\n- impact protection;\n- another appropriate measure.\n\nThese examples are not universal requirements.",
      },
      suggestedEvidence: {
        fr: [
          "inspection d'un emplacement",
          "photographie lorsqu'appropriée et autorisée",
          "plan d'implantation",
          "rapport Facilities",
          "observation",
          "rapport d'évaluation de risque",
          "mesure de protection mise en œuvre",
          "relevé environnemental lorsque pertinent",
          "ticket de correction",
          "exception approuvée",
          "incident",
          "preuve fournisseur",
          "mesure compensatoire",
        ],
        en: [
          "location inspection",
          "photograph where appropriate and permitted",
          "siting plan",
          "Facilities report",
          "observation",
          "risk assessment",
          "implemented protection measure",
          "environmental record where relevant",
          "remediation ticket",
          "approved exception",
          "incident",
          "supplier evidence",
          "compensating control",
        ],
      },
    },
    {
      id: "p7_8_003",
      type: "proof_traceability",
      status: "main",
      title: {
        fr: "Assurance et traçabilité de la protection des équipements",
        en: "Equipment protection assurance and traceability",
      },
      question: {
        fr: "Les inspections, défauts, déplacements d'équipements, changements d'aménagement, incidents, exceptions et, lorsqu'elles existent, responsabilités de tiers susceptibles d'affecter la protection des équipements sont-ils documentés et suivis ?",
        en: "Are inspections, defects, equipment moves, layout changes, incidents, exceptions, and, where applicable, third-party responsibilities that may affect equipment protection documented and tracked?",
      },
      help: {
        fr: "La traçabilité doit être proportionnée à la criticité des équipements et aux risques.\n\nSelon le contexte, elle peut couvrir :\n- inspection initiale ;\n- revue après installation ;\n- déplacement ;\n- modification d'aménagement ;\n- changement d'usage d'une salle ;\n- défaut de protection ;\n- incident physique ;\n- problème environnemental ;\n- exception ;\n- mesure compensatoire ;\n- action corrective ;\n- vérification de correction ;\n- changement significatif ;\n- responsabilité d'un bailleur, hébergeur ou autre fournisseur ;\n- contrôle fourni par un tiers ;\n- notification d'un changement affectant un site tiers ;\n- clôture d'une action.\n\nAucun registre, cadence ou format particulier n'est universellement requis.",
        en: "Traceability should be proportionate to equipment criticality and risk.\n\nDepending on context, it may cover:\n- initial inspection;\n- post-installation review;\n- equipment move;\n- layout change;\n- change in room use;\n- protection defect;\n- physical incident;\n- environmental issue;\n- exception;\n- compensating control;\n- corrective action;\n- remediation verification;\n- significant change;\n- responsibility of a landlord, hosting provider, or other supplier;\n- third-party supplied control;\n- notification of a change affecting a third-party site;\n- action closure.\n\nNo particular register, frequency, or format is universally required.",
      },
      suggestedEvidence: {
        fr: [
          "rapport d'inspection",
          "changement d'emplacement",
          "ticket Facilities",
          "ticket IT",
          "incident",
          "exception",
          "action corrective",
          "preuve de correction",
          "revue de changement",
          "contrat fournisseur",
          "matrice de responsabilités",
          "attestation ou rapport fournisseur pertinent",
          "validation de clôture",
        ],
        en: [
          "inspection report",
          "location change record",
          "Facilities ticket",
          "IT ticket",
          "incident",
          "exception",
          "corrective action",
          "remediation evidence",
          "change review",
          "supplier contract",
          "responsibility matrix",
          "relevant supplier attestation or report",
          "closure approval",
        ],
      },
    },
  ];

export const EQUIPMENT_SITING_PROTECTION_LEGAL_WARNING = {
  fr: "Les mesures relatives à l'implantation et à la protection des équipements peuvent dépendre du pays, des règles de santé-sécurité, des exigences des bâtiments, des baux, des contrats fournisseurs, des recommandations des fabricants, des assurances, des exigences environnementales et des obligations sectorielles applicables. Les mesures concernées doivent être proportionnées aux risques et validées par les fonctions Facilities, IT, juridique, santé-sécurité, achats/fournisseurs et sécurité de l'information compétentes lorsque nécessaire.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Equipment siting and protection measures may depend on the country, health and safety requirements, building requirements, leases, supplier contracts, manufacturer guidance, insurance requirements, environmental requirements, and applicable sector-specific obligations. Relevant measures should be proportionate to risk and reviewed by competent Facilities, IT, Legal, Health and Safety, Procurement/Supplier Management, and Information Security functions where necessary.\n\nNormCore does not provide personalized legal advice.",
} as const;

export type EquipmentSitingProtectionQuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: EquipmentSitingProtectionQuestionId[];
  hiddenQuestionIds: EquipmentSitingProtectionQuestionId[];
  unresolvedConditions: never[];
  assessmentBlocked: boolean;
};

export function resolveEquipmentSitingProtectionQuestions(): EquipmentSitingProtectionQuestionResolution {
  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds: ["p7_8_001", "p7_8_002", "p7_8_003"],
    hiddenQuestionIds: [],
    unresolvedConditions: [],
    assessmentBlocked: false,
  };
}
