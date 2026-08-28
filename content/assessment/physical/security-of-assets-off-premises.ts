import type { ContextDecision } from "./physical-security-perimeters.ts";

export type A79AssessmentContext = {
  usesAssetsOffPremises?: ContextDecision;
  allowsBYODForBusiness?: ContextDecision;
};

export type SecurityOfAssetsOffPremisesQuestionId =
  | "p7_9_001"
  | "p7_9_002"
  | "p7_9_003"
  | "p7_9_004_byod";

export type SecurityOfAssetsOffPremisesQuestion = {
  id: SecurityOfAssetsOffPremisesQuestionId;
  type: "policy_process" | "application" | "proof_traceability" | "conditional";
  status: "main" | "conditional";
  conditionKey?: "allowsBYODForBusiness";
  title: {
    fr: string;
    en: string;
  };
  question: {
    fr: string;
    en: string;
  };
  helpText: {
    fr: string;
    en: string;
  };
  suggestedEvidence: {
    fr: string;
    en: string;
  };
  legalWarning?: {
    fr: string;
    en: string;
  };
};

const A7_9_LEGAL_WARNING = {
  fr: "Les règles applicables aux actifs utilisés hors site et aux équipements personnels peuvent varier selon le pays, le droit du travail, la protection des données, la vie privée, les contrats, les assurances et les exigences sectorielles applicables. Les mécanismes de gestion d’appareils, de suivi de localisation, de surveillance, d’effacement à distance, de contrôle des données personnelles ou de restitution/suppression des données professionnelles doivent être proportionnés et validés par les fonctions juridique, vie privée, RH, IT et sécurité de l’information compétentes lorsque nécessaire.",
  en: "Rules applying to off-premises assets and personally owned devices may vary by country, employment law, data-protection and privacy requirements, contracts, insurance requirements, and applicable sector-specific obligations. Device management, location tracking, monitoring, remote wiping, personal-data controls, and removal or return of business data should be proportionate and reviewed by competent Legal, Privacy, HR, IT, and Information Security functions where necessary.",
};

export const securityOfAssetsOffPremisesQuestions: SecurityOfAssetsOffPremisesQuestion[] = [
  {
    id: "p7_9_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Règles de sécurité des actifs hors site",
      en: "Off-premises asset security rules",
    },
    question: {
      fr: "Votre organisation a-t-elle défini les règles applicables aux actifs utilisés ou conservés hors de ses locaux, couvrant leur autorisation, responsabilité, garde, usage et protection selon les risques et les informations concernées ?",
      en: "Has your organization defined rules for assets used or stored off-premises, covering authorization, responsibility, custody, use, and protection according to the associated risks and information?",
    },
    helpText: {
      fr: "Les règles doivent être proportionnées aux actifs, informations et contextes réellement concernés.\n\nSelon le contexte, elles peuvent traiter :\n\n- les catégories d’actifs autorisées hors site ;\n- les personnes autorisées à les utiliser ;\n- les responsabilités du détenteur ;\n- les situations d’utilisation admises ;\n- la garde de l’équipement ;\n- les déplacements ;\n- le transport ;\n- le stockage temporaire ;\n- le travail à domicile ;\n- les espaces publics ou partagés ;\n- les hôtels ;\n- les véhicules lorsque pertinent ;\n- les sites clients ;\n- les équipements prêtés ;\n- les actifs installés durablement hors site ;\n- la perte ou le vol ;\n- les dommages ;\n- les exceptions ;\n- mesures compensatoires.\n\nLes règles doivent être fondées sur le risque. Ne pas imposer universellement : un appareil obligatoirement propriété de l'entreprise (le BYOD est autorisé si encadré) ; l'interdiction universelle du BYOD ; un formulaire d'autorisation pour chaque déplacement courant. Ne pas exiger un modèle de sécurité périmétrique classique dans un environnement remote-first ou cloud-first sans serveur local.",
      en: "Rules should be proportionate to the assets, information, and actual situations involved.\n\nDepending on context, they may address:\n\n- categories of assets permitted off-premises;\n- authorized users;\n- custodian responsibilities;\n- permitted usage scenarios;\n- equipment custody;\n- travel;\n- transportation;\n- temporary storage;\n- home working;\n- public or shared spaces;\n- hotels;\n- vehicles where relevant;\n- customer sites;\n- loaned equipment;\n- equipment permanently installed off-premises;\n- loss or theft;\n- damage;\n- exceptions;\n- compensating controls.\n\nRules should be risk-based.",
    },
    suggestedEvidence: {
      fr: "- politique actifs mobiles/hors site ;\n- politique télétravail pertinente ;\n- règles de déplacement ;\n- acceptable use policy ;\n- règles de garde ;\n- responsabilités utilisateur ;\n- asset register lorsqu’utilisé ;\n- procédure de prêt ;\n- procédure perte/vol ;\n- règles pour installations permanentes hors site ;\n- communication aux utilisateurs ;\n- acknowledgment lorsqu’utilisé ;\n- exception approuvée.",
      en: "- mobile/off-premises asset policy;\n- relevant remote-working policy;\n- travel rules;\n- acceptable use policy;\n- custody rules;\n- user responsibilities;\n- asset register where used;\n- loan procedure;\n- loss/theft procedure;\n- rules for permanently installed off-premises equipment;\n- user communication;\n- acknowledgement where used;\n- approved exception.",
    },
    legalWarning: A7_9_LEGAL_WARNING,
  },
  {
    id: "p7_9_002",
    type: "application",
    status: "main",
    title: {
      fr: "Protection effective des actifs hors site",
      en: "Effective protection of off-premises assets",
    },
    question: {
      fr: "Les actifs hors site sont-ils effectivement protégés contre la perte, le vol, le dommage, l’observation ou l’utilisation non autorisée pendant leur transport, leur utilisation et leur stockage ?",
      en: "Are off-premises assets effectively protected against loss, theft, damage, unauthorized observation, or unauthorized use during transport, use, and storage?",
    },
    helpText: {
      fr: "Évaluer le résultat de protection obtenu et non la présence d’une technologie particulière.\n\nSelon le risque, considérer notamment :\n\n- garde physique ;\n- transport ;\n- stockage temporaire ;\n- exposition dans un véhicule ;\n- exposition dans un hôtel ;\n- exposition dans un espace public ;\n- espace de coworking ;\n- domicile ;\n- site client ;\n- protection contre l’observation ;\n- perte ;\n- vol ;\n- dommage ;\n- eau, chaleur ou choc lorsque pertinent ;\n- accès non autorisé ;\n- protection d’un équipement installé durablement hors site.\n\nDes mesures possibles peuvent inclure selon le risque :\n\n- authentification ;\n- verrouillage ;\n- chiffrement ;\n- gestion centralisée d’un appareil ;\n- effacement distant ;\n- protection physique ;\n- protection visuelle ;\n- séparation des données ;\n- contrôle d’accès ;\n- mesure compensatoire.\n\nAucune de ces technologies n’est individuellement obligatoire de manière universelle pour A.7.9. L'utilisation de services tiers (ex: coworking sécurisé, coffre-fort distant) est acceptable. L'organisation n'est pas tenue d'opérer directement les contrôles du tiers. Ne pas imposer universellement : un type spécifique de chiffrement (ex: BitLocker, FileVault, FDE) ; une biométrie ; un câble antivol ; un coffre d'hôtel ; des règles techniques fixes pour les véhicules.",
      en: "Assess the protection outcome rather than the presence of a particular technology.\n\nDepending on risk, consider:\n\n- physical custody;\n- transportation;\n- temporary storage;\n- exposure in vehicles;\n- hotels;\n- public spaces;\n- coworking environments;\n- home environments;\n- customer sites;\n- visual observation;\n- loss;\n- theft;\n- damage;\n- water, heat, or impact where relevant;\n- unauthorized access;\n- protection of equipment permanently installed off-premises.\n\nPossible measures may include according to risk:\n\n- authentication;\n- locking;\n- encryption;\n- centralized device management;\n- remote wipe;\n- physical protection;\n- visual protection;\n- data separation;\n- access control;\n- compensating controls.\n\nNone of these technologies is individually a universal A.7.9 requirement.",
    },
    suggestedEvidence: {
      fr: "- configuration appareil lorsqu’elle existe ;\n- preuve de chiffrement lorsqu’utilisé ;\n- preuve de gestion centralisée lorsqu’utilisée ;\n- instruction de voyage ;\n- inspection ou observation proportionnée ;\n- procédure de transport ;\n- protection physique ;\n- rapport de conformité ;\n- incident ;\n- exception ;\n- mesure compensatoire ;\n- preuve relative à une installation hors site permanente.",
      en: "- device configuration where used;\n- encryption evidence where used;\n- centralized management evidence where used;\n- travel instruction;\n- proportionate inspection or observation;\n- transportation procedure;\n- physical protection;\n- compliance report;\n- incident;\n- exception;\n- compensating control;\n- evidence related to permanently installed off-premises equipment.",
    },
    legalWarning: A7_9_LEGAL_WARNING,
  },
  {
    id: "p7_9_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Garde, incidents et traçabilité des actifs hors site",
      en: "Custody, incidents, and traceability of off-premises assets",
    },
    question: {
      fr: "Votre organisation peut-elle démontrer quels actifs pertinents sont utilisés hors site, qui en est responsable et comment les pertes, vols, dommages, exceptions, retours et actions correctives sont enregistrés et traités ?",
      en: "Can your organization demonstrate which relevant assets are used off-premises, who is responsible for them, and how losses, theft, damage, exceptions, returns, and corrective actions are recorded and handled?",
    },
    helpText: {
      fr: "La traçabilité doit être proportionnée à la valeur, criticité et sensibilité de l’actif.\n\nSelon le contexte, elle peut couvrir :\n\n- actif ou catégorie d’actifs ;\n- détenteur ou responsable ;\n- affectation ;\n- prêt ;\n- sortie durable ;\n- retour ;\n- changement de détenteur ;\n- perte ;\n- vol ;\n- dommage ;\n- incident ;\n- action de réponse ;\n- récupération ;\n- blocage ou effacement lorsqu’ils existent ;\n- exception ;\n- installation permanente hors site ;\n- changement de site ;\n- action corrective ;\n- clôture.\n\nNormCore ne doit pas exiger un formulaire individuel pour chaque déplacement banal si le risque ne le justifie pas. Ne pas imposer universellement : une déclaration formelle à la police dans tous les cas ; un tracking individuel permanent ; une durée fixe universelle de signalement. Les mesures de traçabilité doivent être proportionnées aux risques. Pas de tracking individuel universel pour des actifs banals non sensibles.",
      en: "Traceability should be proportionate to asset value, criticality, and sensitivity.\n\nDepending on context, it may cover:\n\n- asset or asset category;\n- custodian or responsible person;\n- assignment;\n- loan;\n- long-term off-premises use;\n- return;\n- change of custodian;\n- loss;\n- theft;\n- damage;\n- incident;\n- response action;\n- recovery;\n- blocking or wiping where used;\n- exception;\n- permanently installed off-premises equipment;\n- location change;\n- corrective action;\n- closure.\n\nNormCore should not require an individual form for every routine movement when risk does not justify it.",
    },
    suggestedEvidence: {
      fr: "- asset register ;\n- liste d’affectation ;\n- registre de prêt lorsqu’utilisé ;\n- preuve de responsabilité ;\n- ticket de retour ;\n- incident perte/vol ;\n- ticket support ;\n- action corrective ;\n- preuve de récupération ;\n- preuve de désactivation ou effacement lorsqu’utilisée ;\n- exception ;\n- preuve d’installation permanente hors site ;\n- clôture.",
      en: "- asset register;\n- assignment list;\n- loan register where used;\n- custody evidence;\n- return ticket;\n- loss/theft incident;\n- support ticket;\n- corrective action;\n- recovery evidence;\n- disablement or wipe evidence where used;\n- exception;\n- evidence of permanent off-premises installation;\n- closure evidence.",
    },
    legalWarning: A7_9_LEGAL_WARNING,
  },
  {
    id: "p7_9_004_byod",
    type: "conditional",
    status: "conditional",
    conditionKey: "allowsBYODForBusiness",
    title: {
      fr: "Protection des équipements personnels utilisés professionnellement",
      en: "Protection of personally owned equipment used for business",
    },
    question: {
      fr: "Lorsque des équipements personnels sont autorisés à traiter ou accéder aux informations de l’organisation, les usages permis, exigences de protection, responsabilités, gestion des données, incidents et fin d’utilisation professionnelle sont-ils définis et appliqués ?",
      en: "Where personally owned equipment is permitted to process or access organizational information, are permitted use, protection requirements, responsibilities, data handling, incidents, and termination of business use defined and implemented?",
    },
    helpText: {
      fr: "Lorsque le BYOD est autorisé, les règles doivent tenir compte à la fois de la sécurité de l’organisation et des droits de l’utilisateur.\n\nSelon le contexte, définir :\n\n- types d’appareils admis ;\n- usages professionnels autorisés ;\n- informations accessibles ;\n- stockage local permis ou interdit selon le risque ;\n- exigences minimales de sécurité ;\n- gestion des mises à jour ;\n- authentification ;\n- séparation professionnel/personnel lorsqu’elle est pertinente ;\n- support ;\n- perte ou vol ;\n- incident ;\n- retrait de l’accès ;\n- départ du collaborateur ;\n- suppression ou restitution des données professionnelles ;\n- responsabilités respectives organisation/utilisateur.\n\nNe jamais considérer MDM, tracking, remote wipe ou surveillance d’un appareil personnel comme universellement obligatoires. Ne pas imposer universellement : un MFA spécifique distinct du MFA global.",
      en: "Where BYOD is permitted, rules should address both organizational security and user rights.\n\nDepending on context, define:\n\n- permitted device types;\n- permitted business uses;\n- accessible information;\n- local storage permitted or restricted according to risk;\n- minimum security requirements;\n- update management;\n- authentication;\n- work/personal separation where relevant;\n- support;\n- loss or theft;\n- incidents;\n- access removal;\n- personnel departure;\n- removal or return of organizational data;\n- respective organization/user responsibilities.\n\nNever treat MDM, tracking, remote wipe, or monitoring of a personal device as universally mandatory.",
    },
    suggestedEvidence: {
      fr: "- politique BYOD ;\n- acceptable use policy ;\n- accord utilisateur ;\n- règles de confidentialité ;\n- exigences minimales ;\n- configuration ou conformité lorsqu’utilisée ;\n- procédure perte/vol ;\n- retrait d’accès ;\n- procédure de départ ;\n- exception ;\n- preuve de communication.",
      en: "- BYOD policy;\n- acceptable use policy;\n- user agreement;\n- privacy rules;\n- minimum requirements;\n- configuration or compliance evidence where used;\n- loss/theft procedure;\n- access removal;\n- departure procedure;\n- exception;\n- communication evidence.",
    },
    legalWarning: A7_9_LEGAL_WARNING,
  },
];

export const A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN = "A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN";

export const A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES = {
  A7_9_OFFSITE_RULES_PARTIAL: "A7_9_OFFSITE_RULES_PARTIAL",
  A7_9_OFFSITE_RULES_ABSENT: "A7_9_OFFSITE_RULES_ABSENT",
  A7_9_OFFSITE_PROTECTION_PARTIAL: "A7_9_OFFSITE_PROTECTION_PARTIAL",
  A7_9_OFFSITE_PROTECTION_ABSENT: "A7_9_OFFSITE_PROTECTION_ABSENT",
  A7_9_OFFSITE_TRACEABILITY_PARTIAL: "A7_9_OFFSITE_TRACEABILITY_PARTIAL",
  A7_9_OFFSITE_TRACEABILITY_ABSENT: "A7_9_OFFSITE_TRACEABILITY_ABSENT",
  A7_9_BYOD_PROTECTION_PARTIAL: "A7_9_BYOD_PROTECTION_PARTIAL",
  A7_9_BYOD_PROTECTION_ABSENT: "A7_9_BYOD_PROTECTION_ABSENT",
} as const;

export type A79QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState:
    | "none"
    | "clarification_required"
    | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: SecurityOfAssetsOffPremisesQuestionId[];
  hiddenQuestionIds: SecurityOfAssetsOffPremisesQuestionId[];
  unresolvedConditions: Array<
    | "usesAssetsOffPremises"
    | "allowsBYODForBusiness"
  >;
  assessmentBlocked: boolean;
};

export function resolveSecurityOfAssetsOffPremisesQuestions(
  context: A79AssessmentContext
): A79QuestionResolution {
  if (context.usesAssetsOffPremises === "no") {
    return {
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      questionIds: [],
      hiddenQuestionIds: [
        "p7_9_001",
        "p7_9_002",
        "p7_9_003",
        "p7_9_004_byod",
      ],
      unresolvedConditions: [],
      assessmentBlocked: false,
    };
  }

  if (
    !context.usesAssetsOffPremises ||
    context.usesAssetsOffPremises === "not_sure"
  ) {
    return {
      controlApplicability: "unresolved",
      controlReviewState: "clarification_required",
      requiresControlJustification: false,
      questionIds: [],
      hiddenQuestionIds: [
        "p7_9_001",
        "p7_9_002",
        "p7_9_003",
        "p7_9_004_byod",
      ],
      unresolvedConditions: ["usesAssetsOffPremises"],
      assessmentBlocked: true,
    };
  }

  const questionIds: SecurityOfAssetsOffPremisesQuestionId[] = [
    "p7_9_001",
    "p7_9_002",
    "p7_9_003",
  ];
  const hiddenQuestionIds: SecurityOfAssetsOffPremisesQuestionId[] = [];
  const unresolvedConditions: A79QuestionResolution["unresolvedConditions"] = [];
  let assessmentBlocked = false;

  if (context.allowsBYODForBusiness === "yes") {
    questionIds.push("p7_9_004_byod");
  } else if (context.allowsBYODForBusiness === "no") {
    hiddenQuestionIds.push("p7_9_004_byod");
  } else {
    hiddenQuestionIds.push("p7_9_004_byod");
    unresolvedConditions.push("allowsBYODForBusiness");
    assessmentBlocked = true;
  }

  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds,
    hiddenQuestionIds,
    unresolvedConditions,
    assessmentBlocked,
  };
}
