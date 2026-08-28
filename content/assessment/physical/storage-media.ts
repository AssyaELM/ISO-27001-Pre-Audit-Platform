import type { ContextDecision } from "./physical-security-perimeters";

export type StorageMediaQuestionId =
  | "p7_10_001"
  | "p7_10_002"
  | "p7_10_003"
  | "p7_10_004_removable_media";

export type A710AssessmentContext = {
  usesRemovableOrPortableStorageMedia?: ContextDecision;
};

export const A7_10_STORAGE_MEDIA_LIFECYCLE_PLAN = "A7_10_STORAGE_MEDIA_LIFECYCLE_PLAN";

export const A7_10_STORAGE_MEDIA_GAP_CODES = {
  // p7_10_001
  A7_10_MEDIA_LIFECYCLE_PARTIAL: "A7_10_MEDIA_LIFECYCLE_PARTIAL",
  A7_10_MEDIA_LIFECYCLE_ABSENT: "A7_10_MEDIA_LIFECYCLE_ABSENT",
  // p7_10_002
  A7_10_MEDIA_PROTECTION_PARTIAL: "A7_10_MEDIA_PROTECTION_PARTIAL",
  A7_10_MEDIA_PROTECTION_ABSENT: "A7_10_MEDIA_PROTECTION_ABSENT",
  // p7_10_003
  A7_10_MEDIA_TRACEABILITY_PARTIAL: "A7_10_MEDIA_TRACEABILITY_PARTIAL",
  A7_10_MEDIA_TRACEABILITY_ABSENT: "A7_10_MEDIA_TRACEABILITY_ABSENT",
  // p7_10_004_removable_media
  A7_10_REMOVABLE_MEDIA_PARTIAL: "A7_10_REMOVABLE_MEDIA_PARTIAL",
  A7_10_REMOVABLE_MEDIA_ABSENT: "A7_10_REMOVABLE_MEDIA_ABSENT",
} as const;

export type StorageMediaQuestion = {
  id: StorageMediaQuestionId;
  type: "policy_process" | "application" | "proof_traceability" | "conditional";
  status: "main" | "conditional";
  conditionKey?: keyof A710AssessmentContext;
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  helpText: { fr: string; en: string };
  suggestedEvidence: { fr: string; en: string };
  legalWarning?: { fr: string; en: string };
};

const legalWarningContent = {
  fr: "Les règles relatives aux supports de stockage, à leur transport, leur sanitization, leur destruction et leur traitement par des tiers peuvent varier selon le pays, la protection des données, les obligations de conservation, les exigences contractuelles, les règles environnementales, les exigences sectorielles et la nature des informations concernées. Les méthodes et preuves retenues doivent être proportionnées aux risques et validées par les fonctions juridique, vie privée, IT, Records Management, achats/fournisseurs et sécurité de l’information compétentes lorsque nécessaire.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Rules governing storage media, transportation, sanitization, destruction, and third-party processing may vary by country, data-protection requirements, retention obligations, contractual requirements, environmental requirements, sector-specific obligations, and the nature of the information involved. Selected methods and evidence should be proportionate to risk and reviewed by competent Legal, Privacy, IT, Records Management, Procurement/Supplier Management, and Information Security functions where necessary.\n\nNormCore does not provide personalized legal advice."
};

export const storageMediaQuestions: StorageMediaQuestion[] = [
  {
    id: "p7_10_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Gouvernance du cycle de vie des supports",
      en: "Storage media lifecycle governance"
    },
    question: {
      fr: "Votre organisation a-t-elle défini des règles de gestion des supports de stockage tout au long de leur cycle de vie, couvrant leur acquisition ou autorisation, utilisation, stockage, transport, réutilisation et élimination selon la classification et les exigences de manipulation des informations ?",
      en: "Has your organization defined rules for managing storage media throughout their lifecycle, covering acquisition or authorization, use, storage, transportation, reuse, and disposal according to information classification and handling requirements?"
    },
    helpText: {
      fr: "Les règles doivent être proportionnées :\n\n- à la classification ;\n- à la sensibilité ;\n- au type de support ;\n- aux informations qu’il contient ou peut contenir ;\n- au contexte d’utilisation ;\n- aux exigences légales, contractuelles et sectorielles applicables.\n\nSelon le contexte, couvrir :\n\n- catégories de supports autorisées ;\n- acquisition ou autorisation ;\n- attribution lorsqu’elle est utile ;\n- utilisation ;\n- données qui peuvent y être stockées ;\n- stockage ;\n- déplacement ;\n- transport ;\n- transfert ;\n- retour ;\n- réutilisation ;\n- sanitization ;\n- destruction ;\n- fin de vie ;\n- incidents ;\n- exceptions ;\n- responsabilités.\n\nNe pas réduire A.7.10 aux seules clés USB.",
      en: "Rules should be proportionate to:\n\n- classification;\n- sensitivity;\n- media type;\n- information stored or potentially stored;\n- usage context;\n- applicable legal, contractual, and sector requirements.\n\nDepending on context, cover:\n\n- permitted media categories;\n- acquisition or authorization;\n- assignment where useful;\n- use;\n- information permitted on the media;\n- storage;\n- movement;\n- transportation;\n- transfer;\n- return;\n- reuse;\n- sanitization;\n- destruction;\n- end of life;\n- incidents;\n- exceptions;\n- responsibilities.\n\nDo not reduce A.7.10 to USB drives only."
    },
    suggestedEvidence: {
      fr: "- politique de gestion des supports ;\n- procédure media handling ;\n- règles de stockage ;\n- règles de transport ;\n- règles de réutilisation ;\n- règles de fin de vie ;\n- classification de l’information ;\n- procédure d’exception ;\n- responsabilités documentées ;\n- communication utilisateurs ;\n- règle d’interdiction de supports externes lorsqu’elle existe.",
      en: "- media-management policy;\n- media-handling procedure;\n- storage rules;\n- transportation rules;\n- reuse rules;\n- end-of-life rules;\n- information classification;\n- exception procedure;\n- documented responsibilities;\n- user communications;\n- prohibition of external media where used."
    },
    legalWarning: legalWarningContent
  },
  {
    id: "p7_10_002",
    type: "application",
    status: "main",
    title: {
      fr: "Protection effective des supports",
      en: "Effective protection of storage media"
    },
    question: {
      fr: "Les supports contenant ou pouvant contenir des informations sont-ils effectivement protégés pendant leur utilisation, stockage, déplacement, réutilisation et fin de vie contre l’accès, la divulgation, l’altération, la perte ou la destruction non autorisés ?",
      en: "Are media containing or capable of containing information effectively protected during use, storage, movement, reuse, and end of life against unauthorized access, disclosure, alteration, loss, or destruction?"
    },
    helpText: {
      fr: "Évaluer le résultat de protection réellement obtenu.\n\nSelon le risque, les mesures peuvent notamment porter sur :\n\n- contrôle d’accès ;\n- protection physique ;\n- stockage approprié ;\n- protection pendant le transport ;\n- chiffrement lorsque nécessaire ;\n- séparation des informations ;\n- limitation d’utilisation ;\n- prévention de l’usage de supports non autorisés ;\n- protection contre la dégradation ;\n- gestion d’un support endommagé ;\n- sanitization avant réutilisation ;\n- sanitization ou destruction en fin de vie ;\n- validation du résultat de sanitization/destruction ;\n- mesure compensatoire.\n\nAucune mesure technique particulière n’est universellement obligatoire.",
      en: "Assess the actual protection outcome.\n\nDepending on risk, measures may include:\n\n- access control;\n- physical protection;\n- appropriate storage;\n- protection during transportation;\n- encryption where necessary;\n- information separation;\n- use restrictions;\n- prevention of unauthorized-media use;\n- protection against deterioration;\n- handling of damaged media;\n- sanitization before reuse;\n- sanitization or destruction at end of life;\n- validation of sanitization/destruction results;\n- compensating controls.\n\nNo specific technical measure is universally mandatory."
    },
    suggestedEvidence: {
      fr: "- configuration de protection lorsqu’elle existe ;\n- stockage physique ;\n- procédure transport ;\n- preuve de chiffrement lorsqu’utilisé ;\n- contrôle d’accès ;\n- procédure support endommagé ;\n- sanitization record ;\n- destruction record ;\n- preuve de validation ;\n- incident ;\n- exception ;\n- mesure compensatoire.",
      en: "- protection configuration where used;\n- physical storage;\n- transportation procedure;\n- encryption evidence where used;\n- access control;\n- damaged-media procedure;\n- sanitization record;\n- destruction record;\n- validation evidence;\n- incident;\n- exception;\n- compensating control."
    },
    legalWarning: legalWarningContent
  },
  {
    id: "p7_10_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Traçabilité du cycle de vie des supports",
      en: "Storage media lifecycle traceability"
    },
    question: {
      fr: "Votre organisation conserve-t-elle des preuves proportionnées permettant de retracer, lorsque nécessaire, les autorisations, mouvements, transferts, réutilisations, incidents, sanitizations ou destructions de supports sensibles, y compris lorsqu’un tiers intervient ?",
      en: "Does your organization retain proportionate evidence for tracing, where necessary, authorizations, movements, transfers, reuse, incidents, sanitization, or destruction of sensitive media, including where a third party is involved?"
    },
    helpText: {
      fr: "La traçabilité doit être proportionnée au risque.\n\nElle peut couvrir :\n\n- support ou catégorie de support ;\n- détenteur lorsqu’approprié ;\n- autorisation ;\n- attribution ;\n- transfert ;\n- déplacement ;\n- transport ;\n- réception ;\n- retour ;\n- réutilisation ;\n- incident ;\n- perte ;\n- support endommagé ;\n- sanitization ;\n- méthode retenue ;\n- résultat de validation ;\n- destruction ;\n- preuve fournie par un tiers ;\n- chaîne de garde lorsqu’elle est nécessaire ;\n- action corrective ;\n- clôture.\n\nLorsqu’un tiers transporte, stocke, sanitizent ou détruit des supports :\n\n- responsabilités ;\n- exigences de sécurité ;\n- chaîne de garde lorsque justifiée ;\n- méthode utilisée ;\n- preuves appropriées ;\n- incidents et anomalies\n\ndoivent être définis selon le risque.\n\nNe pas imposer une traçabilité individuelle pour chaque média banal lorsque le risque ne la justifie pas.",
      en: "Traceability should be proportionate to risk.\n\nIt may cover:\n\n- media item or category;\n- custodian where appropriate;\n- authorization;\n- assignment;\n- transfer;\n- movement;\n- transportation;\n- receipt;\n- return;\n- reuse;\n- incident;\n- loss;\n- damaged media;\n- sanitization;\n- selected method;\n- validation result;\n- destruction;\n- third-party evidence;\n- chain of custody where necessary;\n- corrective action;\n- closure.\n\nWhere a third party transports, stores, sanitizes, or destroys media:\n\n- responsibilities;\n- security requirements;\n- chain of custody where justified;\n- selected method;\n- appropriate evidence;\n- incidents and anomalies\n\nshould be defined according to risk.\n\nDo not require individual traceability for every low-risk ordinary media item where risk does not justify it."
    },
    suggestedEvidence: {
      fr: "- media register lorsqu’il est nécessaire ;\n- autorisation ;\n- affectation ;\n- transfert ;\n- chaîne de garde ;\n- preuve de transport ;\n- preuve de réception ;\n- retour ;\n- sanitization record ;\n- certificat ou preuve de destruction lorsqu’il existe ;\n- preuve fournisseur ;\n- incident ;\n- action corrective ;\n- clôture.",
      en: "- media register where necessary;\n- authorization;\n- assignment;\n- transfer;\n- chain of custody;\n- transportation evidence;\n- receipt evidence;\n- return;\n- sanitization record;\n- destruction certificate or evidence where used;\n- supplier evidence;\n- incident;\n- corrective action;\n- closure."
    },
    legalWarning: legalWarningContent
  },
  {
    id: "p7_10_004_removable_media",
    type: "conditional",
    status: "conditional",
    conditionKey: "usesRemovableOrPortableStorageMedia",
    title: {
      fr: "Maîtrise des supports amovibles et portables",
      en: "Control of removable and portable storage media"
    },
    question: {
      fr: "Lorsque des supports amovibles ou portables sont autorisés, leur besoin, autorisation, attribution, contenu permis, utilisation, transport, stockage, retour et traitement de fin de vie sont-ils contrôlés selon le risque ?",
      en: "Where removable or portable storage media is permitted, are its business need, authorization, assignment, permitted content, use, transport, storage, return, and end-of-life handling controlled according to risk?"
    },
    helpText: {
      fr: "Lorsque des supports amovibles sont utilisés, considérer selon le risque :\n\n- besoin professionnel ;\n- catégories autorisées ;\n- utilisateurs autorisés ;\n- attribution lorsqu’utile ;\n- données admises ;\n- restrictions ;\n- protection ;\n- transport ;\n- stockage ;\n- perte ;\n- incident ;\n- retour ;\n- réutilisation ;\n- sanitization ;\n- destruction ;\n- exception.\n\nUne organisation peut :\n\n- interdire certains supports ;\n- limiter leur utilisation ;\n- n’autoriser que certains supports ;\n- autoriser des supports sous conditions.\n\nAucune politique unique n’est imposée.",
      en: "Where removable media is used, consider according to risk:\n\n- business need;\n- permitted categories;\n- authorized users;\n- assignment where useful;\n- permitted data;\n- restrictions;\n- protection;\n- transportation;\n- storage;\n- loss;\n- incident;\n- return;\n- reuse;\n- sanitization;\n- destruction;\n- exception.\n\nAn organization may:\n\n- prohibit certain media;\n- restrict its use;\n- permit only selected media;\n- permit media subject to controls.\n\nNo single policy approach is mandated."
    },
    suggestedEvidence: {
      fr: "- removable media policy ;\n- liste de catégories autorisées ;\n- justification métier ;\n- autorisation ;\n- affectation lorsqu’utilisée ;\n- configuration de restriction lorsqu’elle existe ;\n- exception ;\n- incident ;\n- retour ;\n- sanitization/destruction.",
      en: "- removable-media policy;\n- list of permitted categories;\n- business justification;\n- authorization;\n- assignment where used;\n- restriction configuration where used;\n- exception;\n- incident;\n- return;\n- sanitization/destruction."
    },
    legalWarning: legalWarningContent
  }
];

export type A710QuestionResolution = {
  controlApplicability: "applicable";
  controlReviewState: "none";
  requiresControlJustification: false;
  questionIds: StorageMediaQuestionId[];
  hiddenQuestionIds: StorageMediaQuestionId[];
  unresolvedConditions: Array<"usesRemovableOrPortableStorageMedia">;
  assessmentBlocked: boolean;
};

export function resolveStorageMediaQuestions(
  context: A710AssessmentContext
): A710QuestionResolution {
  const unresolved: Array<"usesRemovableOrPortableStorageMedia"> = [];
  const hidden: StorageMediaQuestionId[] = [];
  const visible: StorageMediaQuestionId[] = ["p7_10_001", "p7_10_002", "p7_10_003"];
  let blocked = false;

  const removableCtx = context.usesRemovableOrPortableStorageMedia;
  if (!removableCtx || removableCtx === "not_sure") {
    unresolved.push("usesRemovableOrPortableStorageMedia");
    hidden.push("p7_10_004_removable_media");
    blocked = true;
  } else if (removableCtx === "no") {
    hidden.push("p7_10_004_removable_media");
  } else {
    visible.push("p7_10_004_removable_media");
  }

  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds: visible,
    hiddenQuestionIds: hidden,
    unresolvedConditions: unresolved,
    assessmentBlocked: blocked
  };
}
