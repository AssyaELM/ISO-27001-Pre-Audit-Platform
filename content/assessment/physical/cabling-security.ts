export type CablingSecurityQuestionId =
  | "p7_12_001"
  | "p7_12_002"
  | "p7_12_003";

export const A7_12_CABLING_SECURITY_PLAN = "A7_12_CABLING_SECURITY_PLAN";

export const A7_12_CABLING_SECURITY_GAP_CODES = {
  A7_12_CABLING_REQUIREMENTS_PARTIAL: "A7_12_CABLING_REQUIREMENTS_PARTIAL",
  A7_12_CABLING_REQUIREMENTS_ABSENT: "A7_12_CABLING_REQUIREMENTS_ABSENT",
  A7_12_CABLING_PROTECTION_PARTIAL: "A7_12_CABLING_PROTECTION_PARTIAL",
  A7_12_CABLING_PROTECTION_ABSENT: "A7_12_CABLING_PROTECTION_ABSENT",
  A7_12_CABLING_ASSURANCE_PARTIAL: "A7_12_CABLING_ASSURANCE_PARTIAL",
  A7_12_CABLING_ASSURANCE_ABSENT: "A7_12_CABLING_ASSURANCE_ABSENT",
} as const;

export type CablingSecurityQuestion = {
  id: CablingSecurityQuestionId;
  type: "policy_process" | "application" | "proof_traceability";
  status: "main";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  helpText: { fr: string; en: string };
  suggestedEvidence: { fr: string; en: string };
};

export const cablingSecurityQuestions: CablingSecurityQuestion[] = [
  {
    id: "p7_12_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Exigences de protection du câblage",
      en: "Cabling protection requirements"
    },
    question: {
      fr: "Votre organisation a-t-elle défini des exigences proportionnées pour protéger les câbles d’alimentation, de données et de télécommunications pertinents contre l’interception, l’interférence, la manipulation et les dommages physiques ?",
      en: "Has your organization defined proportionate requirements for protecting relevant power, data, and telecommunications cabling against interception, interference, tampering, and physical damage?"
    },
    helpText: {
      fr: "Les exigences doivent être adaptées aux câbles et chemins de câblage dont une interception, une interférence, une manipulation ou un dommage pourrait affecter la sécurité de l’information.\n\nSelon le contexte, considérer notamment :\n\n- câbles d’alimentation pertinents ;\n- câbles de données ou télécommunications ;\n- chemins de câblage ;\n- points d’entrée dans les locaux ;\n- points de raccordement et de terminaison ;\n- baies et armoires de brassage ;\n- zones accessibles au public ou à des personnes non autorisées ;\n- zones exposées à des dommages accidentels ;\n- proximité de sources d’interférence lorsque pertinente ;\n- sensibilité ou criticité des informations/services supportés ;\n- responsabilités Facilities/IT ;\n- responsabilités bailleur/opérateur/installateur ;\n- règles de modification ou d’installation ;\n- exceptions ;\n- mesures compensatoires.\n\nLes exigences doivent rester proportionnées au risque.\n\nLa norme n’impose pas universellement :\n\n- une distance précise entre power et data ;\n- la fibre ;\n- du câblage blindé ;\n- des conduits métalliques ;\n- un type particulier de verrouillage ;\n- une méthode précise de routage.",
      en: "Requirements should be appropriate to cabling and cabling routes where interception, interference, tampering, or damage could affect information security.\n\nDepending on context, consider:\n\n- relevant power cabling;\n- data or telecommunications cabling;\n- cabling routes;\n- building entry points;\n- junction and termination points;\n- patch panels and network cabinets;\n- areas accessible to the public or unauthorized persons;\n- areas exposed to accidental damage;\n- proximity to sources of interference where relevant;\n- sensitivity or criticality of supported information/services;\n- Facilities/IT responsibilities;\n- landlord/operator/installer responsibilities;\n- installation or change rules;\n- exceptions;\n- compensating controls.\n\nRequirements should remain proportionate to risk.\n\nThe standard does not universally mandate:\n\n- a specific power/data separation distance;\n- fiber;\n- shielded cabling;\n- metal conduit;\n- a specific locking mechanism;\n- a particular routing method."
    },
    suggestedEvidence: {
      fr: "- règles ou standard interne de câblage ;\n- documentation Facilities/IT ;\n- schémas de câblage lorsqu’ils existent ;\n- plans d’installation ;\n- documentation d’un bailleur ou gestionnaire de bâtiment ;\n- documentation installateur/opérateur ;\n- responsabilités définies ;\n- analyse de risques ;\n- procédures de changement ;\n- photos ou observations physiques lorsqu’elles sont utiles ;\n- exceptions documentées ;\n- mesures compensatoires.",
      en: "- internal cabling rules or standards;\n- Facilities/IT documentation;\n- cabling diagrams where maintained;\n- installation plans;\n- landlord or building-management documentation;\n- installer/operator documentation;\n- defined responsibilities;\n- risk assessment;\n- change procedures;\n- photographs or physical observations where useful;\n- documented exceptions;\n- compensating controls."
    }
  },
  {
    id: "p7_12_002",
    type: "application",
    status: "main",
    title: {
      fr: "Protection effective du câblage",
      en: "Effective cabling protection"
    },
    question: {
      fr: "Les câbles, chemins de câblage et points de terminaison pertinents sont-ils effectivement protégés de manière proportionnée contre l’accès ou l’interception non autorisés, les interférences et les dommages accidentels ou malveillants ?",
      en: "Are relevant cables, cabling routes, and termination points effectively protected in a proportionate manner against unauthorized access or interception, interference, and accidental or malicious damage?"
    },
    helpText: {
      fr: "Évaluer la protection réellement obtenue.\n\nSelon l’environnement et le risque, les mesures peuvent inclure, sans être universellement obligatoires :\n\n- choix d’un routage moins exposé ;\n- protection physique de tronçons exposés ;\n- conduits, goulottes ou protections mécaniques ;\n- faux plancher ou faux plafond lorsqu’approprié ;\n- restriction d’accès aux baies ou points de raccordement ;\n- séparation des câbles lorsque l’interférence le justifie ;\n- blindage lorsque pertinent ;\n- fibre lorsqu’elle constitue une solution appropriée ;\n- protection des points d’entrée ;\n- disposition réduisant le risque d’arrachement ou de coupure ;\n- inspection d’une zone exposée ;\n- protection assurée par un bailleur ou un opérateur ;\n- autres mesures compensatoires.\n\nÉvaluer les résultats, pas la présence d’une technologie précise.\n\nExemples :\n\nabsence de fibre ≠ automatiquement non-conforme\n\nabsence de conduit métallique ≠ automatiquement non-conforme\n\nabsence d’une distance fixe entre alimentation et données ≠ automatiquement non-conforme\n\nabsence de biométrie sur une baie ≠ automatiquement non-conforme",
      en: "Assess the protection actually achieved.\n\nDepending on environment and risk, measures may include, without being universally mandatory:\n\n- selecting less exposed routing;\n- physical protection of exposed sections;\n- conduit, trunking, or mechanical protection;\n- raised floors or suspended ceilings where appropriate;\n- restricted access to cabinets or junction points;\n- cable segregation where interference warrants it;\n- shielding where relevant;\n- fiber where it is an appropriate solution;\n- protection of entry points;\n- arrangements reducing accidental disconnection or cutting;\n- inspection of exposed areas;\n- protection provided by a landlord or operator;\n- other compensating controls.\n\nAssess outcomes, not the presence of a particular technology.\n\nExamples:\n\nno fiber ≠ automatically non-compliant\n\nno metal conduit ≠ automatically non-compliant\n\nno fixed power/data separation distance ≠ automatically non-compliant\n\nno biometric cabinet access ≠ automatically non-compliant"
    },
    suggestedEvidence: {
      fr: "- observation physique ;\n- photos lorsque pertinentes ;\n- chemins ou conduits protégés ;\n- schémas ou plans de routage ;\n- protection de baies/armoires ;\n- contrôle d’accès aux zones techniques lorsqu’il existe ;\n- séparation ou blindage lorsque justifiés ;\n- registre de clés/badges lorsqu’il existe ;\n- rapport de bailleur/installateur ;\n- contrôles compensatoires ;\n- preuves de correction de zones exposées.",
      en: "- physical observation;\n- photographs where relevant;\n- protected routes or conduit;\n- routing diagrams or plans;\n- cabinet/rack protection;\n- technical-area access control where used;\n- segregation or shielding where justified;\n- key/badge records where maintained;\n- landlord/installer reports;\n- compensating controls;\n- evidence of correction of exposed areas."
    }
  },
  {
    id: "p7_12_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Assurance et traçabilité du câblage",
      en: "Cabling assurance and traceability"
    },
    question: {
      fr: "Les installations, modifications, inspections, défauts, incidents et responsabilités de tiers susceptibles d’affecter la sécurité du câblage sont-ils documentés et suivis lorsque cela est nécessaire ?",
      en: "Are installations, changes, inspections, defects, incidents, and third-party responsibilities that may affect cabling security documented and tracked where necessary?"
    },
    helpText: {
      fr: "La traçabilité doit être proportionnée au risque et à la complexité de l’environnement.\n\nSelon le contexte, elle peut inclure :\n\n- plans ou schémas pertinents ;\n- changements apportés au câblage ;\n- travaux ou nouvelles installations ;\n- inspections lorsque nécessaires ;\n- anomalies et défauts ;\n- câbles endommagés ;\n- raccordements inattendus ;\n- incidents ;\n- exceptions ;\n- responsabilités du bailleur ;\n- responsabilités de l’installateur ;\n- responsabilités de l’opérateur télécom ;\n- rapports d’intervention ;\n- actions correctives ;\n- responsables ;\n- clôtures ;\n- étiquetage lorsqu’il est utile au contrôle et à la maintenance sûre ;\n- mise à jour de documentation lorsque nécessaire.\n\nL’étiquetage, un code couleur, un DCIM ou un registre d’accès peuvent constituer des éléments utiles, mais ne sont pas des obligations universelles d’A.7.12.",
      en: "Traceability should be proportionate to risk and environmental complexity.\n\nDepending on context, it may include:\n\n- relevant plans or diagrams;\n- cabling changes;\n- installation work;\n- inspections where needed;\n- anomalies and defects;\n- damaged cables;\n- unexpected connections;\n- incidents;\n- exceptions;\n- landlord responsibilities;\n- installer responsibilities;\n- telecommunications-operator responsibilities;\n- intervention reports;\n- corrective actions;\n- owners;\n- closure;\n- labeling where useful for control and safe maintenance;\n- documentation updates where necessary.\n\nLabeling, color coding, a DCIM tool, or an access register may be useful evidence, but are not universal A.7.12 requirements."
    },
    suggestedEvidence: {
      fr: "- schéma/plan de câblage lorsque maintenu ;\n- dossiers d’installation ;\n- demandes/changements Facilities ou IT ;\n- photos ou rapports d’inspection ;\n- historique d’anomalies ;\n- tickets relatifs aux dommages ;\n- rapports de travaux ;\n- documentation bailleur ;\n- documentation installateur ;\n- documentation opérateur ;\n- preuves d’actions correctives ;\n- clôtures ;\n- étiquetage lorsque utilisé.",
      en: "- cabling diagram/plan where maintained;\n- installation records;\n- Facilities or IT change requests;\n- photographs or inspection reports;\n- anomaly history;\n- damage-related tickets;\n- work reports;\n- landlord documentation;\n- installer documentation;\n- operator documentation;\n- corrective-action evidence;\n- closures;\n- labeling where used."
    }
  }
];
