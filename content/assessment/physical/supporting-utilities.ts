export type SupportingUtilitiesQuestionId =
  | "p7_11_001"
  | "p7_11_002"
  | "p7_11_003";

export const A7_11_SUPPORTING_UTILITIES_PLAN = "A7_11_SUPPORTING_UTILITIES_PLAN";

export const A7_11_SUPPORTING_UTILITIES_GAP_CODES = {
  // p7_11_001
  A7_11_UTILITY_REQUIREMENTS_PARTIAL: "A7_11_UTILITY_REQUIREMENTS_PARTIAL",
  A7_11_UTILITY_REQUIREMENTS_ABSENT: "A7_11_UTILITY_REQUIREMENTS_ABSENT",
  // p7_11_002
  A7_11_UTILITY_PROTECTION_PARTIAL: "A7_11_UTILITY_PROTECTION_PARTIAL",
  A7_11_UTILITY_PROTECTION_ABSENT: "A7_11_UTILITY_PROTECTION_ABSENT",
  // p7_11_003
  A7_11_UTILITY_ASSURANCE_PARTIAL: "A7_11_UTILITY_ASSURANCE_PARTIAL",
  A7_11_UTILITY_ASSURANCE_ABSENT: "A7_11_UTILITY_ASSURANCE_ABSENT",
} as const;

export type SupportingUtilitiesQuestion = {
  id: SupportingUtilitiesQuestionId;
  type: "policy_process" | "application" | "proof_traceability";
  status: "main";
  title: { fr: string; en: string };
  question: { fr: string; en: string };
  helpText: { fr: string; en: string };
  suggestedEvidence: { fr: string; en: string };
  legalWarning?: { fr: string; en: string };
};

export const supportingUtilitiesQuestions: SupportingUtilitiesQuestion[] = [
  {
    id: "p7_11_001",
    type: "policy_process",
    status: "main",
    title: {
      fr: "Identification et exigences des services de support",
      en: "Supporting utility identification and requirements"
    },
    question: {
      fr: "Votre organisation a-t-elle identifié les services de support dont dépendent ses équipements et installations de traitement de l’information et défini, selon leur criticité, les exigences de protection et de continuité nécessaires en cas de défaillance ?",
      en: "Has your organization identified the supporting utilities on which its information-processing equipment and facilities depend and defined, according to their criticality, the protection and continuity requirements needed in case of failure?"
    },
    helpText: {
      fr: "L’organisation doit identifier les services de support dont la défaillance pourrait affecter la disponibilité, l’intégrité ou la continuité des équipements et traitements de l’information.\n\nSelon le contexte, considérer notamment :\n\n- alimentation électrique ;\n- télécommunications ;\n- connectivité ;\n- refroidissement ;\n- ventilation ;\n- eau ou autres services nécessaires au fonctionnement d’équipements pertinents ;\n- sites et installations concernés ;\n- criticité des équipements/services dépendants ;\n- conséquences possibles d’une interruption ;\n- dépendances croisées ;\n- responsabilités internes ;\n- responsabilités de bailleurs, datacenters, hébergeurs ou autres fournisseurs ;\n- exigences de continuité proportionnées au risque ;\n- exceptions et mesures compensatoires.\n\nUne utility opérée par un tiers reste une dépendance à comprendre et à gérer.\n\nCloud-first, SaaS, colocation ou locaux loués ne rendent pas automatiquement A.7.11 non applicable.",
      en: "The organization should identify supporting utilities whose failure could affect the availability, integrity, or continuity of information-processing equipment and services.\n\nDepending on context, consider:\n\n- power supply;\n- telecommunications;\n- connectivity;\n- cooling;\n- ventilation;\n- water or other services necessary for relevant equipment;\n- affected sites and facilities;\n- criticality of dependent equipment/services;\n- potential consequences of interruption;\n- interdependencies;\n- internal responsibilities;\n- landlord, data-center, hosting-provider, or other supplier responsibilities;\n- continuity requirements proportionate to risk;\n- exceptions and compensating controls.\n\nA utility operated by a third party remains a dependency that should be understood and managed.\n\nCloud-first, SaaS, colocation, or leased premises do not automatically make A.7.11 not applicable."
    },
    suggestedEvidence: {
      fr: "- analyse des dépendances aux utilities ;\n- documentation Facilities/IT ;\n- architecture ou documentation de site ;\n- registre des services critiques ;\n- analyse de criticité ;\n- exigences de disponibilité ;\n- plans de continuité pertinents ;\n- contrats, baux ou SLA ;\n- documentation datacenter/hébergeur ;\n- répartition des responsabilités ;\n- analyse de risques ;\n- exceptions documentées.",
      en: "- supporting-utility dependency analysis;\n- Facilities/IT documentation;\n- site architecture or documentation;\n- critical-service register;\n- criticality analysis;\n- availability requirements;\n- relevant continuity plans;\n- contracts, leases, or SLAs;\n- data-center/hosting documentation;\n- responsibility allocation;\n- risk assessment;\n- documented exceptions."
    }
  },
  {
    id: "p7_11_002",
    type: "application",
    status: "main",
    title: {
      fr: "Protection contre les défaillances des services de support",
      en: "Protection against supporting utility failures"
    },
    question: {
      fr: "Les mesures retenues pour protéger les équipements contre les défaillances des services de support sont-elles effectivement mises en œuvre et proportionnées aux besoins de disponibilité et aux risques concernés ?",
      en: "Are the measures selected to protect equipment against supporting-utility failures effectively implemented and proportionate to the relevant availability needs and risks?"
    },
    helpText: {
      fr: "Évaluer le résultat réellement obtenu.\n\nSelon le risque et les besoins de disponibilité, les mesures peuvent inclure, sans obligation universelle :\n\n- capacité adaptée ;\n- alimentation temporaire ou alternative ;\n- redondance ;\n- solution de bascule ;\n- arrêt contrôlé ;\n- connectivité alternative ;\n- monitoring ;\n- alarmes ;\n- notification d’incident ;\n- solution de continuité ;\n- protection ou résilience assurée par un fournisseur ;\n- mesure compensatoire.\n\nLes mesures doivent être adaptées :\n\n- aux équipements concernés ;\n- aux conséquences d’une interruption ;\n- au temps pendant lequel une interruption peut être tolérée ;\n- au contexte du site ;\n- aux responsabilités du fournisseur lorsqu’un tiers opère l’infrastructure.\n\nNe pas évaluer la conformité uniquement sur la présence ou l’absence d’un UPS, d’un générateur ou d’un second fournisseur télécom.",
      en: "Assess the actual protection outcome.\n\nDepending on risk and availability needs, measures may include, without any universal requirement:\n\n- appropriate capacity;\n- temporary or alternative power;\n- redundancy;\n- failover arrangements;\n- controlled shutdown;\n- alternative connectivity;\n- monitoring;\n- alarms;\n- incident notification;\n- continuity arrangements;\n- protection or resilience provided by a supplier;\n- compensating controls.\n\nMeasures should be appropriate to:\n\n- affected equipment;\n- consequences of interruption;\n- tolerable interruption;\n- site context;\n- supplier responsibilities where infrastructure is operated by a third party.\n\nDo not assess conformity solely on the presence or absence of a UPS, generator, or secondary telecommunications provider."
    },
    suggestedEvidence: {
      fr: "- configuration ou photographie d’une protection lorsqu’elle existe ;\n- documentation de capacité ;\n- procédure de bascule ;\n- procédure d’arrêt contrôlé lorsqu’elle existe ;\n- preuve de connectivité alternative lorsqu’elle existe ;\n- configuration d’alarme ou de monitoring lorsqu’elle existe ;\n- documentation fournisseur ;\n- SLA ;\n- architecture de résilience ;\n- exercice ou test ;\n- incident réel et réponse apportée ;\n- mesure compensatoire.",
      en: "- protection configuration or physical evidence where used;\n- capacity documentation;\n- failover procedure;\n- controlled-shutdown procedure where used;\n- alternative-connectivity evidence where used;\n- alarm or monitoring configuration where used;\n- supplier documentation;\n- SLA;\n- resilience architecture;\n- exercise or test;\n- actual incident and response;\n- compensating control."
    }
  },
  {
    id: "p7_11_003",
    type: "proof_traceability",
    status: "main",
    title: {
      fr: "Assurance et traçabilité des services de support",
      en: "Supporting utility assurance and traceability"
    },
    question: {
      fr: "Votre organisation peut-elle démontrer que les protections liées aux services de support sont surveillées lorsque pertinent, testées, maintenues et réévaluées, et que les défaillances, exceptions, responsabilités de fournisseurs et actions correctives sont suivies ?",
      en: "Can your organization demonstrate that supporting-utility protections are monitored where relevant, tested, maintained, and reassessed, and that failures, exceptions, supplier responsibilities, and corrective actions are tracked?"
    },
    helpText: {
      fr: "La preuve doit être proportionnée au risque et au modèle d’exploitation.\n\nSelon le contexte, elle peut couvrir :\n\n- tests de protection ou de bascule ;\n- vérification de capacité ;\n- tests d’autonomie lorsque pertinents ;\n- monitoring lorsqu’il est utilisé ;\n- alertes ;\n- maintenance des dispositifs de protection ;\n- pannes réelles ;\n- résultats d’exercices ;\n- anomalies ;\n- exceptions ;\n- interventions ;\n- rapports fournisseurs ;\n- engagements contractuels ;\n- incidents ;\n- actions correctives ;\n- responsables ;\n- dates de clôture ;\n- réévaluation après changement significatif.\n\nLorsque l’infrastructure est exploitée par un bailleur, datacenter ou autre fournisseur, l’organisation peut s’appuyer sur une assurance tierce proportionnée.\n\nCette assurance ne nécessite pas obligatoirement une certification particulière ou que l’organisation exploite elle-même les équipements physiques.\n\nAucune cadence universelle de test ou de maintenance n’est imposée.",
      en: "Evidence should be proportionate to risk and the operating model.\n\nDepending on context, it may cover:\n\n- protection or failover tests;\n- capacity verification;\n- autonomy tests where relevant;\n- monitoring where used;\n- alerts;\n- maintenance of protective arrangements;\n- actual failures;\n- exercise results;\n- anomalies;\n- exceptions;\n- interventions;\n- supplier reports;\n- contractual commitments;\n- incidents;\n- corrective actions;\n- owners;\n- closure dates;\n- reassessment following significant change.\n\nWhere infrastructure is operated by a landlord, data center, or other supplier, the organization may rely on proportionate third-party assurance.\n\nSuch assurance does not universally require a particular certification or direct operation of the physical equipment by the organization.\n\nNo universal testing or maintenance cadence is mandated."
    },
    suggestedEvidence: {
      fr: "- rapports de tests ;\n- rapports de bascule ;\n- rapports de maintenance ;\n- journaux d’alarme ;\n- historique de monitoring lorsqu’il existe ;\n- incidents liés aux utilities ;\n- tickets Facilities/IT ;\n- rapports d’intervention ;\n- rapports fournisseurs ;\n- SLA ou engagements contractuels ;\n- rapport d’assurance fournisseur ;\n- preuve de correction ;\n- analyse post-incident ;\n- réévaluation après changement.",
      en: "- test reports;\n- failover reports;\n- maintenance records;\n- alarm logs;\n- monitoring history where used;\n- utility-related incidents;\n- Facilities/IT tickets;\n- intervention reports;\n- supplier reports;\n- SLAs or contractual commitments;\n- supplier assurance reports;\n- remediation evidence;\n- post-incident analysis;\n- reassessment after change."
    }
  }
];
