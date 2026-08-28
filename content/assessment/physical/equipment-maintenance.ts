export type EquipmentMaintenanceQuestionId =
  | "p7_13_001"
  | "p7_13_002"
  | "p7_13_003";

export const A7_13_EQUIPMENT_MAINTENANCE_PLAN = "A7_13_EQUIPMENT_MAINTENANCE_PLAN";

export const A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES = {
  A7_13_MAINTENANCE_REQUIREMENTS_PARTIAL: "A7_13_MAINTENANCE_REQUIREMENTS_PARTIAL",
  A7_13_MAINTENANCE_REQUIREMENTS_ABSENT: "A7_13_MAINTENANCE_REQUIREMENTS_ABSENT",
  A7_13_SECURE_MAINTENANCE_PARTIAL: "A7_13_SECURE_MAINTENANCE_PARTIAL",
  A7_13_SECURE_MAINTENANCE_ABSENT: "A7_13_SECURE_MAINTENANCE_ABSENT",
  A7_13_MAINTENANCE_ASSURANCE_PARTIAL: "A7_13_MAINTENANCE_ASSURANCE_PARTIAL",
  A7_13_MAINTENANCE_ASSURANCE_ABSENT: "A7_13_MAINTENANCE_ASSURANCE_ABSENT",
} as const;

export type EquipmentMaintenanceQuestion = {
  id: EquipmentMaintenanceQuestionId;
  type: "policy_process" | "application" | "proof_traceability";
  status: "main";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  helpText: { fr: string; en: string };
  suggestedEvidence: { fr: string; en: string };
};

export const equipmentMaintenanceQuestions: EquipmentMaintenanceQuestion[] = [
  {
    id: "p7_13_001", type: "policy_process", status: "main",
    title: { fr: "Exigences de maintenance des équipements", en: "Equipment maintenance requirements" },
    question: {
      fr: "Votre organisation a-t-elle déterminé quels équipements nécessitent une maintenance pour préserver la disponibilité, l’intégrité et la confidentialité de l’information, et défini les responsabilités, modalités et critères de maintenance applicables ?",
      en: "Has your organization determined which equipment requires maintenance to preserve information availability, integrity, and confidentiality, and defined the applicable responsibilities, arrangements, and maintenance criteria?"
    },
    helpText: { fr: "Déterminer les équipements pertinents selon leur criticité et leur risque, puis définir les responsabilités, mainteneurs autorisés, déclencheurs et modalités applicables. Une maintenance externalisée, des équipements loués, le cloud ou l’absence de serveur interne ne rendent pas automatiquement ce contrôle non applicable. Aucune cadence, constructeur ou contrat particulier n’est imposé universellement.", en: "Determine relevant equipment according to criticality and risk, then define applicable responsibilities, authorized maintainers, triggers, and arrangements. Outsourced maintenance, leased equipment, cloud use, or no internal server do not automatically make this control not applicable. No universal cadence, manufacturer, or particular contract is imposed." },
    suggestedEvidence: { fr: "- inventaire des actifs ;\n- critères de maintenance ;\n- responsabilités IT/Facilities/fournisseurs ;\n- contrats ou garanties pertinents ;\n- analyse de risques.", en: "- asset inventory;\n- maintenance criteria;\n- IT/Facilities/supplier responsibilities;\n- relevant contracts or warranties;\n- risk assessment." }
  },
  {
    id: "p7_13_002", type: "application", status: "main",
    title: { fr: "Exécution sécurisée de la maintenance", en: "Secure maintenance execution" },
    question: {
      fr: "Les opérations de maintenance sont-elles effectivement réalisées de manière à préserver la sécurité de l’information, notamment en contrôlant les intervenants, l’accès aux équipements, les données présentes et les équipements envoyés hors site pour réparation ?",
      en: "Are maintenance activities effectively performed in a manner that preserves information security, including control of maintainers, equipment access, stored data, and equipment sent off-site for repair?"
    },
    helpText: { fr: "Évaluer les contrôles appropriés avant, pendant et après l’intervention : autorisation, accès, protection des données, réparation externe, sortie d’équipement et retour en service. Les mesures sont proportionnées au risque : aucun NDA, escorte, badge temporaire, chiffrement complet, retrait de disque, MFA ou chaîne de garde n’est universellement obligatoire.", en: "Assess controls appropriate before, during, and after servicing: authorization, access, data protection, off-site repair, equipment release, and return to service. Measures are proportionate to risk: no NDA, escort, temporary badge, full-disk encryption, disk removal, MFA, or chain of custody is universally required." },
    suggestedEvidence: { fr: "- demandes ou autorisations de maintenance ;\n- tickets ;\n- rapports d’intervention ;\n- règles de sortie/réparation ;\n- vérifications de retour en service ;\n- documents fournisseurs pertinents.", en: "- maintenance requests or authorizations;\n- tickets;\n- service reports;\n- release/repair rules;\n- return-to-service checks;\n- relevant supplier documents." }
  },
  {
    id: "p7_13_003", type: "proof_traceability", status: "main",
    title: { fr: "Assurance et traçabilité de la maintenance", en: "Maintenance assurance and traceability" },
    question: {
      fr: "Votre organisation conserve-t-elle des preuves proportionnées des maintenances préventives et correctives, des défauts, interventions de tiers, équipements sortis pour réparation, vérifications de retour en service et actions correctives ?",
      en: "Does your organization retain proportionate evidence of preventive and corrective maintenance, faults, third-party servicing, equipment sent for repair, return-to-service checks, and corrective actions?"
    },
    helpText: { fr: "Conserver une traçabilité proportionnée des opérations et corrections. Elle peut inclure tickets, rapports, interventions fournisseurs, défauts, sorties d’équipement et vérifications de remise en service. Aucune fréquence de maintenance ou journalisation temps réel universelle n’est requise.", en: "Retain proportionate traceability of activities and corrections. It may include tickets, reports, supplier servicing, faults, equipment release, and return-to-service checks. No universal maintenance frequency or real-time logging is required." },
    suggestedEvidence: { fr: "- tickets ;\n- rapports de maintenance ;\n- factures ou contrats de support ;\n- rapports IT/Facilities ;\n- preuves de réparation externe ;\n- vérifications de remise en service ;\n- actions correctives et clôture.", en: "- tickets;\n- maintenance reports;\n- support invoices or contracts;\n- IT/Facilities reports;\n- off-site repair evidence;\n- return-to-service checks;\n- corrective actions and closure." }
  },
];
