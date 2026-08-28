export type ClearDeskClearScreenQuestionId = 
  | "p7_7_001"
  | "p7_7_002"
  | "p7_7_003";

export const CLEAR_DESK_CLEAR_SCREEN_PLAN_CODE = "A7_7_CLEAR_DESK_SCREEN_PLAN";

export const CLEAR_DESK_CLEAR_SCREEN_GAP_CODES = {
  P7_7_001_PARTIAL: "A7_7_RULES_PARTIAL",
  P7_7_001_FULL: "A7_7_RULES_ABSENT",
  P7_7_002_PARTIAL: "A7_7_PRACTICES_PARTIAL",
  P7_7_002_FULL: "A7_7_PRACTICES_ABSENT",
  P7_7_003_PARTIAL: "A7_7_ASSURANCE_PARTIAL",
  P7_7_003_FULL: "A7_7_ASSURANCE_ABSENT",
} as const;

export type ClearDeskClearScreenQuestion = {
  id: ClearDeskClearScreenQuestionId;
  type: "policy_process" | "application" | "proof_traceability";
  status: "main";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  help: { fr: string; en: string };
  suggestedEvidence: { fr: string[]; en: string[] };
};

export const clearDeskClearScreenQuestions: ClearDeskClearScreenQuestion[] = [
  {
    id: "p7_7_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Règles de bureau et d’écran dégagés",
      en: "Clear desk and clear screen rules"
    },
    question: {
      fr: "Votre organisation a-t-elle défini et communiqué des règles de bureau et d’écran dégagés, proportionnées à la sensibilité des informations et adaptées aux différents contextes de travail, notamment bureaux, salles de réunion, espaces partagés et travail à distance ?",
      en: "Has your organization defined and communicated clear desk and clear screen rules proportionate to information sensitivity and appropriate to different working contexts, including offices, meeting rooms, shared spaces, and remote work?"
    },
    help: {
      fr: "Les règles doivent être adaptées aux informations, activités et environnements réels de l’organisation.\n\nSelon le contexte, elles peuvent notamment préciser :\n- quand protéger ou verrouiller un écran ;\n- comment protéger une session laissée sans surveillance ;\n- comment traiter les documents papier lorsqu’ils existent ;\n- comment gérer les impressions sensibles ;\n- comment traiter les informations inscrites sur tableaux ou affichages ;\n- comment ranger les supports physiques lorsqu’ils existent ;\n- les règles applicables aux salles de réunion ;\n- les règles applicables aux espaces partagés ;\n- les règles applicables au coworking ;\n- les règles applicables au télétravail ;\n- les situations nécessitant une protection contre l’observation ;\n- les exceptions et mesures compensatoires.\n\nLes exigences doivent être proportionnées à :\n- la sensibilité de l’information ;\n- le risque d’observation ou d’accès non autorisé ;\n- le contexte de travail ;\n- la durée d’absence ;\n- les personnes susceptibles d’accéder à l’espace.\n\nNe pas imposer un délai universel de verrouillage.",
      en: "Rules should reflect the organization’s actual information, activities, and working environments.\n\nDepending on context, they may define:\n- when a screen should be protected or locked;\n- how to protect an unattended session;\n- how paper documents are handled where they exist;\n- how sensitive printouts are handled;\n- how information on whiteboards or displays is handled;\n- how physical media is stored where it exists;\n- rules for meeting rooms;\n- rules for shared workspaces;\n- rules for coworking environments;\n- rules for remote work;\n- situations requiring protection against visual observation;\n- exceptions and compensating controls.\n\nRequirements should be proportionate to:\n- information sensitivity;\n- risk of unauthorized observation or access;\n- working context;\n- duration of absence;\n- people who may gain access to the workspace.\n\nDo not impose a universal screen-lock timeout."
    },
    suggestedEvidence: {
      fr: [
        "politique ou règles clear desk / clear screen",
        "politique de sécurité de l’information contenant ces règles",
        "acceptable use policy",
        "règles de télétravail",
        "communication aux utilisateurs",
        "formation ou sensibilisation",
        "acknowledgment lorsqu’il existe",
        "configuration de verrouillage lorsqu’elle est utilisée",
        "règles relatives aux impressions",
        "règles relatives aux salles de réunion",
        "procédure d’exception"
      ],
      en: [
        "clear desk / clear screen policy or rules",
        "information security policy containing these rules",
        "acceptable use policy",
        "remote-working rules",
        "user communications",
        "training or awareness",
        "acknowledgement where used",
        "screen-lock configuration where used",
        "printing rules",
        "meeting-room rules",
        "exception procedure"
      ]
    }
  },
  {
    id: "p7_7_002",
    type: "application",
    status: "main",
    title: {
      fr: "Application des pratiques clear desk et clear screen",
      en: "Application of clear desk and clear screen practices"
    },
    question: {
      fr: "Les règles sont-elles effectivement appliquées afin que les informations sensibles ne restent pas inutilement visibles ou accessibles sur les écrans, bureaux, imprimantes, tableaux ou supports physiques lorsqu’ils sont laissés sans surveillance ?",
      en: "Are the rules effectively applied so that sensitive information is not unnecessarily left visible or accessible on screens, desks, printers, whiteboards, or physical media when unattended?"
    },
    help: {
      fr: "Évaluer le résultat réel plutôt que la présence d’une technologie particulière.\n\nSelon le contexte, cela peut comprendre :\n- verrouillage manuel ou automatique de session ;\n- protection d’un écran lorsqu’un utilisateur s’absente ;\n- orientation appropriée d’un écran ;\n- filtre de confidentialité lorsqu’il est réellement justifié ;\n- récupération des impressions sensibles ;\n- absence de documents sensibles inutilement exposés ;\n- rangement approprié lorsqu’un support physique existe ;\n- effacement d’un tableau après une réunion sensible ;\n- retrait d’informations laissées dans une salle de réunion ;\n- comportement adapté en open space ;\n- comportement adapté en coworking ;\n- comportement adapté en télétravail.\n\nUne organisation sans papier ou sans support amovible :\n- ne doit pas être pénalisée pour l’absence de rangement papier ;\n- ne doit pas générer de gap lié aux supports qu’elle n’utilise pas ;\n- reste évaluée sur les écrans et autres informations réellement accessibles.\n\nNe pas exiger automatiquement :\n- auto-lock à 5 minutes ;\n- auto-lock à 10 minutes ;\n- auto-lock à 15 minutes ;\n- auto-lock à 30 minutes ;\n- MDM ;\n- GPO ;\n- pull-print ;\n- coffre ;\n- armoire verrouillée ;\n- privacy filter.\n\nCes mesures peuvent être adaptées au risque mais ne sont pas universelles.",
      en: "Assess the actual security outcome rather than the presence of a particular technology.\n\nDepending on context, this may include:\n- manual or automatic session locking;\n- protecting a screen when a user steps away;\n- appropriate screen orientation;\n- privacy filters where genuinely justified;\n- collecting sensitive printouts;\n- avoiding unnecessary exposure of sensitive documents;\n- appropriate storage where physical media exists;\n- clearing whiteboards after sensitive meetings;\n- removing information left in meeting rooms;\n- appropriate behavior in open-plan offices;\n- appropriate behavior in coworking environments;\n- appropriate behavior during remote work.\n\nAn organization that does not use paper or removable media:\n- should not be penalized for lacking paper-storage facilities;\n- should not receive gaps for media it does not use;\n- remains assessed for screens and other information actually exposed.\n\nDo not automatically require:\n- a 5-minute auto-lock;\n- a 10-minute auto-lock;\n- a 15-minute auto-lock;\n- a 30-minute auto-lock;\n- MDM;\n- GPO;\n- pull-print;\n- a safe;\n- a lockable cabinet;\n- a privacy filter.\n\nSuch measures may be appropriate according to risk but are not universal."
    },
    suggestedEvidence: {
      fr: [
        "configuration technique lorsqu’elle existe",
        "observation ou walkthrough proportionné",
        "contrôle d’un échantillon de postes",
        "preuve de récupération d’impressions lorsque pertinent",
        "règles de salle de réunion",
        "photos ou constats lorsque appropriés",
        "ticket de correction",
        "exception approuvée",
        "incident pertinent",
        "mesure compensatoire"
      ],
      en: [
        "technical configuration where used",
        "proportionate observation or walkthrough",
        "sample workstation check",
        "evidence of print collection where relevant",
        "meeting-room rules",
        "photos or observations where appropriate",
        "remediation ticket",
        "approved exception",
        "relevant incident",
        "compensating control"
      ]
    }
  },
  {
    id: "p7_7_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Preuves et assurance clear desk / clear screen",
      en: "Clear desk / clear screen assurance evidence"
    },
    question: {
      fr: "Votre organisation dispose-t-elle de preuves permettant de démontrer que les règles clear desk et clear screen sont communiquées et appliquées, et que les exceptions, écarts, incidents et corrections sont suivis ?",
      en: "Does your organization retain evidence demonstrating that clear desk and clear screen rules are communicated and applied, and that exceptions, deviations, incidents, and corrective actions are tracked?"
    },
    help: {
      fr: "La preuve doit rester proportionnée au risque.\n\nElle peut notamment comprendre :\n- règles approuvées et versionnées ;\n- communications ou sensibilisations ;\n- acknowledgments lorsqu’ils sont utilisés ;\n- configurations techniques ;\n- inspections ou walkthroughs lorsqu’ils sont justifiés ;\n- contrôles ponctuels ;\n- exceptions ;\n- incidents ;\n- violations constatées ;\n- actions correctives ;\n- vérification de correction ;\n- tendances ou enseignements lorsqu’ils sont pertinents ;\n- validation de clôture.\n\nAucune fréquence fixe d’inspection n’est exigée.\n\nIl n’est pas nécessaire d’effectuer des inspections invasives ou disproportionnées des espaces privés de télétravail.",
      en: "Evidence should remain proportionate to risk.\n\nIt may include:\n- approved and versioned rules;\n- communications or awareness activities;\n- acknowledgements where used;\n- technical configurations;\n- inspections or walkthroughs where justified;\n- spot checks;\n- exceptions;\n- incidents;\n- identified violations;\n- corrective actions;\n- remediation verification;\n- trends or lessons where relevant;\n- closure approval.\n\nNo fixed inspection frequency is required.\n\nThere is no requirement to perform invasive or disproportionate inspections of private remote-working spaces."
    },
    suggestedEvidence: {
      fr: [
        "politique versionnée",
        "diffusion ou formation",
        "rapport de configuration",
        "contrôle ponctuel",
        "inspection proportionnée",
        "exception approuvée",
        "incident",
        "action corrective",
        "preuve de résolution",
        "revue du contrôle"
      ],
      en: [
        "versioned policy",
        "communication or training",
        "configuration report",
        "spot check",
        "proportionate inspection",
        "approved exception",
        "incident",
        "corrective action",
        "remediation evidence",
        "control review"
      ]
    }
  }
];

export const CLEAR_DESK_CLEAR_SCREEN_LEGAL_WARNING = {
  fr: "Les règles de bureau et d’écran dégagés, les mécanismes de verrouillage, les inspections d’espaces de travail, les contrôles des postes, le traitement des documents papier, les impressions, les espaces partagés et les vérifications liées au télétravail peuvent dépendre du pays, du droit du travail, de la protection des données, de la vie privée, des règles de santé-sécurité, des contrats et des conventions collectives applicables. Les mesures concernées doivent être proportionnées et validées par les fonctions RH, juridique, vie privée, Facilities, IT et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Clear desk and clear screen rules, locking mechanisms, workspace inspections, workstation controls, paper-document handling, printing, shared workspaces, and remote-working checks may depend on the country, employment law, data protection, privacy requirements, health and safety rules, contracts, and applicable collective agreements. Relevant measures should be proportionate and reviewed by competent HR, Legal, Privacy, Facilities, IT, and Information Security functions.\n\nNormCore does not provide personalized legal advice."
} as const;

export type ClearDeskClearScreenQuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: ClearDeskClearScreenQuestionId[];
  hiddenQuestionIds: ClearDeskClearScreenQuestionId[];
  unresolvedConditions: never[];
  assessmentBlocked: boolean;
};

export function resolveClearDeskScreenQuestions(): ClearDeskClearScreenQuestionResolution {
  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds: [
      "p7_7_001",
      "p7_7_002",
      "p7_7_003"
    ],
    hiddenQuestionIds: [],
    unresolvedConditions: [],
    assessmentBlocked: false
  };
}
