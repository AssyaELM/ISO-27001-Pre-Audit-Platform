import type { ContextDecision } from "./physical-security-perimeters.ts";

export type WorkingInSecureAreasQuestionId = 
  | "p7_6_001"
  | "p7_6_002"
  | "p7_6_003"
  | "p7_6_004_visitors_contractors";

export const WORKING_IN_SECURE_AREAS_PLAN_CODE = "A7_6_SECURE_AREA_WORKING_PLAN";

export const WORKING_IN_SECURE_AREAS_GAP_CODES = {
  P7_6_001_PARTIAL: "A7_6_WORKING_RULES_PARTIAL",
  P7_6_001_FULL: "A7_6_WORKING_RULES_ABSENT",
  P7_6_002_PARTIAL: "A7_6_SECURE_PRACTICES_PARTIAL",
  P7_6_002_FULL: "A7_6_SECURE_PRACTICES_ABSENT",
  P7_6_003_PARTIAL: "A7_6_ASSURANCE_PARTIAL",
  P7_6_003_FULL: "A7_6_ASSURANCE_ABSENT",
  P7_6_004_PARTIAL: "A7_6_VISITOR_CONTRACTOR_PARTIAL",
  P7_6_004_FULL: "A7_6_VISITOR_CONTRACTOR_ABSENT",
} as const;

export type WorkingInSecureAreasQuestion = {
  id: WorkingInSecureAreasQuestionId;
  type: "policy_process" | "application" | "proof_traceability" | "conditional";
  status: "main";
  conditionKey?: "allowsVisitorsOrContractorsInSecureAreas";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  help: { fr: string; en: string };
  suggestedEvidence: { fr: string[]; en: string[] };
};

export const workingInSecureAreasQuestions: WorkingInSecureAreasQuestion[] = [
  {
    id: "p7_6_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Règles de travail en zones sécurisées",
      en: "Secure-area working rules"
    },
    question: {
      fr: "Votre organisation a-t-elle défini et communiqué, pour chaque zone restreinte ou sécurisée pertinente, des règles de travail proportionnées aux risques précisant les activités autorisées, les responsabilités et les restrictions nécessaires pour protéger les informations et actifs présents ?",
      en: "Has your organization defined and communicated risk-proportionate working rules for each relevant restricted or secure area, specifying permitted activities, responsibilities, and necessary restrictions to protect the information and assets present?"
    },
    help: {
      fr: "Les règles doivent être adaptées aux activités, informations, équipements et risques réels de chaque zone.\n\nSelon le contexte, elles peuvent traiter :\n- les activités autorisées ;\n- les responsabilités des utilisateurs ;\n- la protection des informations visibles ;\n- les appareils ou outils admis ;\n- la photographie, vidéo ou enregistrement lorsqu’ils présentent un risque ;\n- les supports physiques ;\n- les travaux techniques ;\n- la confidentialité de l’existence ou de la fonction de certaines zones lorsqu’elle est nécessaire ;\n- les périodes d’inoccupation ;\n- les incidents ;\n- les exceptions ;\n- les mesures compensatoires ;\n- les consignes de sécurité des personnes et d’urgence pertinentes.\n\nNe pas imposer universellement :\n- l’interdiction des téléphones ;\n- l’interdiction des photographies ;\n- le travail à deux ;\n- une présence humaine permanente ;\n- un type particulier de badge ou clé ;\n- une salle serveur.",
      en: "Rules should reflect the actual activities, information, equipment, and risks of each area.\n\nDepending on context, they may address:\n- permitted activities;\n- user responsibilities;\n- protection of visible information;\n- permitted devices or tools;\n- photography, video, or recording where these create risk;\n- physical media;\n- technical work;\n- confidentiality regarding the existence or purpose of certain areas where necessary;\n- unattended periods;\n- incidents;\n- exceptions;\n- compensating controls;\n- relevant life-safety and emergency instructions.\n\nDo not universally require:\n- banning mobile phones;\n- banning photography;\n- two-person working;\n- permanent human supervision;\n- any particular badge or key;\n- a server room."
    },
    suggestedEvidence: {
      fr: [
        "procédure de travail en zone sécurisée",
        "règles propres à une zone",
        "instructions de sécurité",
        "matrice zones / activités / responsabilités",
        "communication au personnel autorisé",
        "acknowledgment lorsqu’utilisé",
        "procédure d’exception",
        "preuve de revue ou changement",
        "compte rendu d’incident pertinent"
      ],
      en: [
        "secure-area working procedure",
        "area-specific rules",
        "security instructions",
        "area/activity/responsibility matrix",
        "communication to authorized personnel",
        "acknowledgement where used",
        "exception procedure",
        "review or change evidence",
        "relevant incident record"
      ]
    }
  },
  {
    id: "p7_6_002",
    type: "application",
    status: "main",
    title: {
      fr: "Application des pratiques de travail sécurisées",
      en: "Application of secure working practices"
    },
    question: {
      fr: "Les règles définies sont-elles effectivement appliquées lorsque des personnes travaillent dans les zones sécurisées, afin de protéger les informations, équipements et activités contre l’observation, l’enregistrement, la manipulation ou l’accès non autorisés ?",
      en: "Are the defined rules effectively applied when people work in secure areas to protect information, equipment, and activities against unauthorized observation, recording, handling, or access?"
    },
    help: {
      fr: "Évaluer la réalité opérationnelle des règles retenues.\n\nSelon le risque, vérifier notamment :\n- que les activités effectuées correspondent aux activités autorisées ;\n- que les informations sensibles ne sont pas inutilement exposées ;\n- que les appareils, supports ou outils sont utilisés conformément aux règles ;\n- que les travaux de maintenance ou techniques suivent les conditions prévues ;\n- que les restrictions réellement nécessaires sont appliquées ;\n- que les exceptions sont autorisées et maîtrisées ;\n- que les problèmes constatés sont corrigées.\n\nLa supervision, le travail à deux ou l’interdiction d’un appareil peuvent être appropriés dans certains contextes, mais ne sont jamais des exigences universelles de NormCore.",
      en: "Assess whether the selected rules operate in practice.\n\nDepending on risk, this may include checking:\n- activities are consistent with what is permitted;\n- sensitive information is not unnecessarily exposed;\n- devices, media, or tools are used according to the rules;\n- maintenance or technical work follows approved arrangements;\n- necessary restrictions are actually applied;\n- exceptions are authorized and controlled;\n- identified problems are corrected.\n\nSupervision, two-person working, or banning a device may be appropriate in particular contexts but are not universal NormCore requirements."
    },
    suggestedEvidence: {
      fr: [
        "observation ou inspection proportionnée",
        "rapport de contrôle",
        "preuve d’une activité autorisée",
        "autorisation exceptionnelle",
        "ticket ou compte rendu de défaut",
        "incident",
        "action corrective",
        "validation après correction"
      ],
      en: [
        "proportionate observation or inspection",
        "check report",
        "evidence of an authorized activity",
        "exception authorization",
        "defect ticket or record",
        "incident",
        "corrective action",
        "post-remediation validation"
      ]
    }
  },
  {
    id: "p7_6_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Preuves et assurance des pratiques en zones sécurisées",
      en: "Evidence and assurance for secure-area working"
    },
    question: {
      fr: "Votre organisation conserve-t-elle des preuves permettant de démontrer que les règles de travail en zones sécurisées sont communiquées, respectées, vérifiées et corrigées lorsque des exceptions, incidents ou changements sont identifiés ?",
      en: "Does your organization retain evidence demonstrating that secure-area working rules are communicated, followed, checked, and corrected when exceptions, incidents, or changes are identified?"
    },
    help: {
      fr: "Les preuves doivent rester proportionnées au niveau de risque.\n\nElles peuvent notamment inclure :\n- approbation et version des règles ;\n- communication aux personnes concernées ;\n- formations ou briefings lorsqu’ils existent ;\n- inspections ou vérifications ;\n- exceptions ;\n- incidents ;\n- travaux particuliers ;\n- changements d’activité ou de zone ;\n- actions correctives ;\n- vérification de correction ;\n- validation de clôture.\n\nAucun registre, fréquence ou format particulier n’est universellement requis.",
      en: "Evidence should remain proportionate to risk.\n\nIt may include:\n- approval and version history of rules;\n- communication to relevant people;\n- training or briefings where used;\n- inspections or checks;\n- exceptions;\n- incidents;\n- particular work activities;\n- activity or area changes;\n- corrective actions;\n- remediation verification;\n- closure approval.\n\nNo particular register, frequency, or format is universally required."
    },
    suggestedEvidence: {
      fr: [
        "règle versionnée",
        "diffusion ou acknowledgment",
        "briefing",
        "inspection",
        "exception approuvée",
        "incident",
        "action corrective",
        "preuve de clôture"
      ],
      en: [
        "versioned rule",
        "communication or acknowledgement",
        "briefing",
        "inspection",
        "approved exception",
        "incident",
        "corrective action",
        "closure evidence"
      ]
    }
  },
  {
    id: "p7_6_004_visitors_contractors",
    type: "conditional",
    status: "main",
    conditionKey: "allowsVisitorsOrContractorsInSecureAreas",
    title: {
      fr: "Interventions de visiteurs et prestataires en zones sécurisées",
      en: "Visitor and contractor work in secure areas"
    },
    question: {
      fr: "Lorsque des visiteurs ou prestataires interviennent dans une zone sécurisée, leurs activités, autorisations, éventuelles restrictions ou supervisions, équipements utilisés et obligations de confidentialité sont-ils contrôlés selon le risque ?",
      en: "Where visitors or contractors work in a secure area, are their activities, authorization, any necessary restrictions or supervision, equipment use, and confidentiality obligations controlled according to risk?"
    },
    help: {
      fr: "Le contrôle doit être adapté à l’intervention et au niveau de risque.\n\nIl peut notamment préciser :\n- l’hôte ou responsable de l’intervention ;\n- les zones autorisées ;\n- la nature des travaux ;\n- les horaires ou périodes autorisés ;\n- les équipements ou outils utilisés ;\n- les informations auxquelles le tiers peut être exposé ;\n- les obligations de confidentialité ;\n- les restrictions nécessaires ;\n- une supervision ou escorte lorsqu’elle est justifiée ;\n- les exceptions ;\n- les incidents ;\n- la fin de l’intervention ;\n- la restitution des moyens d’accès temporaires lorsqu’ils existent.\n\nNe pas imposer l’escorte permanente de tous les visiteurs ou prestataires.",
      en: "Controls should reflect the intervention and associated level of risk.\n\nThey may define:\n- the host or accountable person;\n- permitted areas;\n- the nature of the work;\n- permitted times;\n- devices or tools used;\n- information to which the third party may be exposed;\n- confidentiality obligations;\n- necessary restrictions;\n- supervision or escort where justified;\n- exceptions;\n- incidents;\n- completion of work;\n- return of temporary access means where used.\n\nDo not universally require permanent escort of every visitor or contractor."
    },
    suggestedEvidence: {
      fr: [
        "autorisation d’intervention",
        "responsable/hôte identifié",
        "ordre de travail",
        "obligations de confidentialité",
        "consignes remises au prestataire",
        "exception approuvée",
        "preuve de fin d’intervention",
        "incident ou action corrective"
      ],
      en: [
        "work authorization",
        "identified host or owner",
        "work order",
        "confidentiality obligations",
        "instructions provided to the contractor",
        "approved exception",
        "evidence of work completion",
        "incident or corrective action"
      ]
    }
  }
];

export const WORKING_IN_SECURE_AREAS_LEGAL_WARNING = {
  fr: "Les règles applicables au travail en zones sécurisées, aux visiteurs et prestataires, à la supervision, au travail isolé, à l’utilisation d’appareils, aux photographies ou enregistrements, à la confidentialité et aux contrôles physiques peuvent varier selon le pays, le droit du travail, la protection des données, les règles de santé-sécurité, les contrats, les conventions collectives et les obligations sectorielles applicables. Les mesures concernées doivent être validées par les fonctions Facilities, juridique, vie privée, RH, santé-sécurité et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Rules governing work in secure areas, visitors and contractors, supervision, lone working, device use, photography or recording, confidentiality, and physical controls may vary by country, employment law, data-protection law, health and safety requirements, contracts, collective agreements, and applicable sector-specific obligations. Relevant measures should be reviewed by competent Facilities, Legal, Privacy, HR, Health and Safety, and Information Security functions.\n\nNormCore does not provide personalized legal advice."
} as const;

export type A76AssessmentContext = {
  hasRestrictedOrSecureAreas?: ContextDecision;
  allowsVisitorsOrContractorsInSecureAreas?: ContextDecision;
};

export type A76QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: WorkingInSecureAreasQuestionId[];
  hiddenQuestionIds: WorkingInSecureAreasQuestionId[];
  unresolvedConditions: Array<"hasRestrictedOrSecureAreas" | "allowsVisitorsOrContractorsInSecureAreas">;
  assessmentBlocked: boolean;
};

export function resolveWorkingInSecureAreasQuestions(
  context: A76AssessmentContext = {}
): A76QuestionResolution {
  const unresolvedConditions: Array<"hasRestrictedOrSecureAreas" | "allowsVisitorsOrContractorsInSecureAreas"> = [];
  const questionIds: WorkingInSecureAreasQuestionId[] = [];
  const hiddenQuestionIds: WorkingInSecureAreasQuestionId[] = [];
  let assessmentBlocked = false;

  if (context.hasRestrictedOrSecureAreas === "no") {
    hiddenQuestionIds.push("p7_6_001", "p7_6_002", "p7_6_003", "p7_6_004_visitors_contractors");
    return {
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      questionIds,
      hiddenQuestionIds,
      unresolvedConditions,
      assessmentBlocked: true
    };
  }

  if (context.hasRestrictedOrSecureAreas !== "yes") {
    unresolvedConditions.push("hasRestrictedOrSecureAreas");
    hiddenQuestionIds.push("p7_6_001", "p7_6_002", "p7_6_003", "p7_6_004_visitors_contractors");
    return {
      controlApplicability: "unresolved",
      controlReviewState: "clarification_required",
      requiresControlJustification: false,
      questionIds,
      hiddenQuestionIds,
      unresolvedConditions,
      assessmentBlocked: true
    };
  }

  questionIds.push("p7_6_001", "p7_6_002", "p7_6_003");

  if (context.allowsVisitorsOrContractorsInSecureAreas === "yes") {
    questionIds.push("p7_6_004_visitors_contractors");
  } else if (context.allowsVisitorsOrContractorsInSecureAreas === "no") {
    hiddenQuestionIds.push("p7_6_004_visitors_contractors");
  } else {
    unresolvedConditions.push("allowsVisitorsOrContractorsInSecureAreas");
    hiddenQuestionIds.push("p7_6_004_visitors_contractors");
    assessmentBlocked = true;
  }

  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds,
    hiddenQuestionIds,
    unresolvedConditions,
    assessmentBlocked
  };
}
