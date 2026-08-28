export const landingCopy = {
  navigation: {
    brand: "NormCore",
    items: ["Product", "How it works", "Features", "Security", "Pricing", "Resources"],
    language: "EN / FR",
    signIn: "Sign in",
    cta: "Create account",
  },
  hero: {
    eyebrow: "ISO/IEC 27001 Annex A readiness, simplified.",
    title: "Know what’s missing before the audit does.",
    description:
      "Assess your security controls through a guided questionnaire, identify evidence gaps, and turn your results into a prioritized remediation plan.",
    primaryCta: "Create account",
    secondaryCta: "See how it works",
    reassurance:
      "No credit card required · Save and resume anytime · Available in English and French",
  },
  dashboard: {
    title: "Annex A Assessment",
    overallLabel: "Overall progress",
    overallValue: 46,
    demoLabel: "Demo data",
    domains: [
      { name: "Organizational Security", value: 42 },
      { name: "People Security", value: 100 },
      { name: "Physical Security", value: 20 },
      { name: "Technological Security", value: 31 },
    ],
    nextLabel: "Next action:",
    nextAction: "Continue Technological Security",
  },
  problem: {
    title: "Stop managing security readiness across scattered spreadsheets.",
    description:
      "Preparing for an information security audit often means tracking controls, evidence, policies and corrective actions across disconnected documents. NormCore brings that work into one guided workspace.",
    items: [
      {
        title: "Unclear readiness",
        description:
          "You have policies and tools, but no reliable view of what is actually implemented.",
      },
      {
        title: "Missing evidence",
        description:
          "A control may exist, but proving that it operates effectively is often more difficult.",
      },
      {
        title: "Generic documentation",
        description:
          "Templates rarely reflect your company, responsibilities or actual processes.",
      },
      {
        title: "Last-minute remediation",
        description:
          "Important gaps are discovered too late, when the audit date is already approaching.",
      },
    ],
  },
  howItWorks: {
    title: "From first assessment to a clear action plan.",
    steps: [
      {
        title: "Create your workspace",
        description:
          "Tell NormCore about your organization, infrastructure and security context.",
      },
      {
        title: "Complete the progressive assessment",
        description:
          "Work through the four Annex A themes at your own pace. Your answers are saved automatically.",
      },
      {
        title: "Understand your gaps",
        description:
          "See which practices are missing, incomplete, unsupported by evidence or need clarification.",
      },
      {
        title: "Remediate and document",
        description:
          "Assign corrective actions, collect evidence and generate reviewable document drafts with AI assistance.",
      },
    ],
  },
  domains: {
    title: "One assessment, four security themes.",
    items: [
      {
        title: "Organizational Security",
        description:
          "Governance, policies, responsibilities, suppliers, incidents and continuity.",
        controls: "37 controls",
      },
      {
        title: "People Security",
        description:
          "Employment responsibilities, awareness, confidentiality, remote work and personnel changes.",
        controls: "8 controls",
      },
      {
        title: "Physical Security",
        description:
          "Protected areas, physical access, equipment, facilities and secure disposal.",
        controls: "14 controls",
      },
      {
        title: "Technological Security",
        description:
          "Access, endpoints, vulnerabilities, backups, monitoring, networks and secure development.",
        controls: "34 controls",
      },
    ],
  },
  annexA: {
    eyebrow: "Public ISO 27001 library",
    title: "ISO 27001 Themes & Annex Controls",
    subtitle:
      "Explore the 93 ISO/IEC 27001:2022 Annex A controls across four themes and understand what each control addresses, why it matters, and the practical areas organisations should consider.",
    stats: [
      { label: "Controls", value: "93" },
      { label: "Themes", value: "4" },
      { label: "Edition", value: "ISO/IEC 27001:2022" },
    ],
    themes: [
      {
        title: "Organizational",
        count: "37 controls",
        description:
          "Organizational controls define how information security is governed and managed across the organisation. They cover policies, responsibilities, assets, access, suppliers, incidents, continuity, compliance and operational processes.",
        previewControls: ["A.5.1 Policies", "A.5.7 Threat Intelligence", "A.5.23 Cloud Services"],
        cta: "Explore Organizational controls",
      },
      {
        title: "People",
        count: "8 controls",
        description:
          "People controls address the human side of information security, including screening, employment responsibilities, awareness, confidentiality, remote working and security event reporting.",
        previewControls: ["A.6.1 Screening", "A.6.3 Awareness", "A.6.7 Remote Working"],
        cta: "Explore People controls",
      },
      {
        title: "Physical",
        count: "14 controls",
        description:
          "Physical controls protect premises, equipment and information assets against unauthorised physical access, damage, theft and environmental threats.",
        previewControls: ["A.7.1 Perimeters", "A.7.2 Entry", "A.7.7 Clear Desk"],
        cta: "Explore Physical controls",
      },
      {
        title: "Technological",
        count: "34 controls",
        description:
          "Technological controls protect systems, applications, networks and data through access control, vulnerability management, monitoring, backups, cryptography and secure development.",
        previewControls: ["A.8.2 Privileged Access", "A.8.8 Vulnerabilities", "A.8.13 Backup"],
        cta: "Explore Technological controls",
      },
    ],
    browseAll: "Browse all 93 controls →",
  },
  features: {
    title: "Everything you need to move from uncertainty to action.",
    items: [
      {
        title: "Progressive questionnaire",
        description:
          "Answer one clear question at a time instead of facing an overwhelming checklist.",
      },
      {
        title: "Save and resume",
        description:
          "Stop whenever you need to. NormCore automatically saves your progress and returns you to the exact point where you stopped.",
      },
      {
        title: "Gap analysis",
        description:
          "Distinguish between missing processes, partial implementation, missing evidence and unverified effectiveness.",
      },
      {
        title: "Remediation workspace",
        description:
          "Turn each identified gap into an assigned, prioritized and trackable action.",
      },
      {
        title: "Evidence Room",
        description:
          "Centralize policies, reports, screenshots and other supporting evidence in one protected workspace.",
      },
      {
        title: "Statement of Applicability draft",
        description:
          "Build a reviewable Statement of Applicability draft with applicability decisions, justifications, statuses and evidence.",
      },
      {
        title: "AI-assisted documentation",
        description:
          "Generate company-specific document drafts while keeping every decision under human review.",
      },
      {
        title: "Bilingual",
        description:
          "Use NormCore in English or French and generate reports in the language your organization needs.",
      },
    ],
  },
  ai: {
    title: "AI assists. You remain in control.",
    description:
      "NormCore uses AI to explain complex security concepts, summarize identified gaps, suggest remediation steps and prepare document drafts. AI never approves evidence, accepts risks or makes final applicability decisions on your behalf.",
    items: [
      {
        title: "Understand",
        description: "Get clear explanations and contextual examples.",
      },
      {
        title: "Remediate",
        description: "Receive actionable remediation suggestions.",
      },
      {
        title: "Document",
        description: "Generate drafts based on verified company information.",
      },
    ],
  },
  audience: {
    title: "Built for teams preparing without a full-time compliance department.",
    items: [
      {
        title: "Founders and executives",
        description:
          "Understand the organization’s security readiness without becoming an ISO expert.",
      },
      {
        title: "IT and security managers",
        description: "Centralize assessments, evidence and corrective actions.",
      },
      {
        title: "Compliance consultants",
        description:
          "Guide clients through a consistent and structured preparation process.",
        badge: "Coming later",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        question: "Does NormCore certify my organization?",
        answer:
          "No. NormCore helps organizations assess and improve their readiness. Certification is performed by an independent certification body.",
      },
      {
        question: "Does NormCore cover the complete ISO/IEC 27001 standard?",
        answer:
          "The initial product focuses on Annex A security controls. Broader ISMS requirements, including Clauses 4–10, are planned as a future extension.",
      },
      {
        question: "Can I stop and continue later?",
        answer:
          "Yes. Your answers are saved automatically, and NormCore returns you to the exact point where you stopped.",
      },
      {
        question: "Is NormCore available in French?",
        answer:
          "Yes. The interface, questionnaire and reports are available in English and French.",
      },
      {
        question: "Does AI decide whether we are compliant?",
        answer:
          "No. AI provides explanations and suggestions. Applicability, evidence approval and final decisions remain under human control.",
      },
      {
        question: "Is NormCore an auditor?",
        answer:
          "No. NormCore is a preparation and management platform, not an auditor or certification body.",
      },
    ],
  },
  finalCta: {
    title: "Start preparing before the audit becomes urgent.",
    description:
      "Create your NormCore account and begin building a clear view of your Annex A readiness.",
    button: "Create account",
  },
  footer: {
    product: ["How it works", "Features", "Security", "Pricing"],
    resources: ["ISO/IEC 27001 overview", "Security glossary", "Guides", "Contact"],
    legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "AI Usage Notice"],
    language: ["English", "Français"],
    disclaimer:
      "NormCore is an independent readiness platform. It is not affiliated with ISO and does not provide certification services.",
  },
} as const;

export const landingCopyFr = {
  navigation: {
    brand: "NormCore",
    items: ["Produit", "Fonctionnement", "Fonctionnalités", "Sécurité", "Tarifs", "Ressources"],
    language: "FR / EN",
    signIn: "Se connecter",
    cta: "Créer un compte",
  },
  hero: {
    eyebrow: "La préparation à l’Annexe A d’ISO/IEC 27001, simplifiée.",
    title: "Identifiez ce qui manque avant que l’audit ne le fasse.",
    description:
      "Évaluez vos contrôles de sécurité grâce à un questionnaire guidé, identifiez les preuves manquantes et transformez vos résultats en plan de remédiation priorisé.",
    primaryCta: "Créer un compte",
    secondaryCta: "Découvrir le fonctionnement",
    reassurance:
      "Aucune carte bancaire · Sauvegarde et reprise à tout moment · Disponible en anglais et en français",
  },
  dashboard: {
    title: "Évaluation de l’Annexe A",
    overallLabel: "Progression globale",
    overallValue: 46,
    demoLabel: "Données de démonstration",
    domains: [
      { name: "Sécurité organisationnelle", value: 42 },
      { name: "Sécurité liée aux personnes", value: 100 },
      { name: "Sécurité physique", value: 20 },
      { name: "Sécurité technologique", value: 31 },
    ],
    nextLabel: "Prochaine action :",
    nextAction: "Continuer la sécurité technologique",
  },
  problem: {
    title: "Ne gérez plus votre préparation dans des fichiers dispersés.",
    description:
      "La préparation à un audit de sécurité implique souvent de suivre les contrôles, les preuves, les politiques et les actions correctives dans plusieurs documents déconnectés. NormCore rassemble ce travail dans un espace guidé.",
    items: [
      {
        title: "Visibilité insuffisante",
        description:
          "Vous disposez de politiques et d’outils, mais pas d’une vision fiable de ce qui est réellement mis en œuvre.",
      },
      {
        title: "Preuves manquantes",
        description:
          "Un contrôle peut exister, mais démontrer son fonctionnement efficace est souvent plus difficile.",
      },
      {
        title: "Documentation générique",
        description:
          "Les modèles reflètent rarement votre entreprise, ses responsabilités ou ses processus réels.",
      },
      {
        title: "Remédiation tardive",
        description:
          "Les gaps importants sont découverts trop tard, lorsque la date de l’audit approche déjà.",
      },
    ],
  },
  howItWorks: {
    title: "De la première évaluation à un plan d’action clair.",
    steps: [
      {
        title: "Créez votre espace de travail",
        description:
          "Présentez à NormCore votre organisation, votre infrastructure et votre contexte de sécurité.",
      },
      {
        title: "Réalisez l’évaluation progressive",
        description:
          "Parcourez les quatre thèmes de l’Annexe A à votre rythme. Vos réponses sont sauvegardées automatiquement.",
      },
      {
        title: "Comprenez vos gaps",
        description:
          "Identifiez les pratiques absentes, incomplètes, non prouvées ou nécessitant une clarification.",
      },
      {
        title: "Corrigez et documentez",
        description:
          "Attribuez les actions correctives, collectez les preuves et générez des brouillons documentaires à réviser avec l’assistance de l’IA.",
      },
    ],
  },
  domains: {
    title: "Une évaluation, quatre thèmes de sécurité.",
    items: [
      {
        title: "Sécurité organisationnelle",
        description:
          "Gouvernance, politiques, responsabilités, fournisseurs, incidents et continuité.",
        controls: "37 contrôles",
      },
      {
        title: "Sécurité liée aux personnes",
        description:
          "Responsabilités professionnelles, sensibilisation, confidentialité, télétravail et changements de personnel.",
        controls: "8 contrôles",
      },
      {
        title: "Sécurité physique",
        description:
          "Zones protégées, accès physique, équipements, locaux et élimination sécurisée.",
        controls: "14 contrôles",
      },
      {
        title: "Sécurité technologique",
        description:
          "Accès, terminaux, vulnérabilités, sauvegardes, surveillance, réseaux et développement sécurisé.",
        controls: "34 contrôles",
      },
    ],
  },
  annexA: {
    eyebrow: "Bibliothèque publique ISO 27001",
    title: "Thèmes ISO 27001 et contrôles de l’Annexe A",
    subtitle:
      "Explorez les 93 contrôles de l’Annexe A d’ISO/IEC 27001:2022 répartis en quatre thèmes et comprenez ce que chaque contrôle couvre, pourquoi il compte et les domaines pratiques à considérer.",
    stats: [
      { label: "Contrôles", value: "93" },
      { label: "Thèmes", value: "4" },
      { label: "Édition", value: "ISO/IEC 27001:2022" },
    ],
    themes: [
      {
        title: "Organisationnel",
        count: "37 contrôles",
        description:
          "Les contrôles organisationnels définissent la manière dont la sécurité de l’information est gouvernée et pilotée dans l’organisation. Ils couvrent les politiques, responsabilités, actifs, accès, fournisseurs, incidents, continuité, conformité et processus opérationnels.",
        previewControls: ["A.5.1 Politiques", "A.5.7 Threat Intelligence", "A.5.23 Cloud Services"],
        cta: "Explorer les contrôles organisationnels",
      },
      {
        title: "Personnes",
        count: "8 contrôles",
        description:
          "Les contrôles liés aux personnes traitent la dimension humaine de la sécurité de l’information, notamment le filtrage, les responsabilités liées à l’emploi, la sensibilisation, la confidentialité, le télétravail et le signalement d’événements de sécurité.",
        previewControls: ["A.6.1 Screening", "A.6.3 Sensibilisation", "A.6.7 Télétravail"],
        cta: "Explorer les contrôles liés aux personnes",
      },
      {
        title: "Physique",
        count: "14 contrôles",
        description:
          "Les contrôles physiques protègent les locaux, les équipements et les actifs d’information contre les accès physiques non autorisés, les dommages, le vol et les menaces environnementales.",
        previewControls: ["A.7.1 Périmètres", "A.7.2 Entrée", "A.7.7 Bureau dégagé"],
        cta: "Explorer les contrôles physiques",
      },
      {
        title: "Technologique",
        count: "34 contrôles",
        description:
          "Les contrôles technologiques protègent les systèmes, applications, réseaux et données via le contrôle d’accès, la gestion des vulnérabilités, la surveillance, les sauvegardes, la cryptographie et le développement sécurisé.",
        previewControls: ["A.8.2 Accès privilégié", "A.8.8 Vulnérabilités", "A.8.13 Sauvegarde"],
        cta: "Explorer les contrôles technologiques",
      },
    ],
    browseAll: "Parcourir les 93 contrôles →",
  },
  features: {
    title: "Tout ce qu’il faut pour passer de l’incertitude à l’action.",
    items: [
      {
        title: "Questionnaire progressif",
        description:
          "Répondez à une question claire à la fois plutôt que d’affronter une checklist interminable.",
      },
      {
        title: "Sauvegarde et reprise",
        description:
          "Arrêtez-vous quand vous le souhaitez. NormCore enregistre automatiquement votre progression et vous ramène exactement au point où vous vous êtes arrêté.",
      },
      {
        title: "Analyse des gaps",
        description:
          "Distinguez les processus absents, les mises en œuvre partielles, les preuves manquantes et l’efficacité non vérifiée.",
      },
      {
        title: "Espace de remédiation",
        description:
          "Transformez chaque gap en action attribuée, priorisée et suivie.",
      },
      {
        title: "Espace de preuves",
        description:
          "Centralisez politiques, rapports, captures d’écran et autres preuves dans un espace protégé.",
      },
      {
        title: "Brouillon de Déclaration d’applicabilité",
        description:
          "Construisez un brouillon à réviser contenant les décisions d’applicabilité, justifications, statuts et preuves.",
      },
      {
        title: "Documentation assistée par IA",
        description:
          "Générez des brouillons adaptés à votre entreprise tout en conservant chaque décision sous validation humaine.",
      },
      {
        title: "Bilingue",
        description:
          "Utilisez NormCore en anglais ou en français et générez vos rapports dans la langue nécessaire à votre organisation.",
      },
    ],
  },
  ai: {
    title: "L’IA vous assiste. Vous gardez le contrôle.",
    description:
      "NormCore utilise l’IA pour expliquer les concepts de sécurité, résumer les gaps, proposer des actions de remédiation et préparer des brouillons documentaires. L’IA ne valide jamais une preuve, n’accepte pas un risque et ne prend pas seule une décision finale d’applicabilité.",
    items: [
      {
        title: "Comprendre",
        description: "Obtenez des explications claires et des exemples adaptés au contexte.",
      },
      {
        title: "Remédier",
        description: "Recevez des propositions de remédiation directement exploitables.",
      },
      {
        title: "Documenter",
        description: "Générez des brouillons à partir d’informations vérifiées sur l’entreprise.",
      },
    ],
  },
  audience: {
    title: "Conçu pour les équipes sans département conformité à temps plein.",
    items: [
      {
        title: "Fondateurs et dirigeants",
        description:
          "Comprenez la préparation de votre organisation sans devenir expert ISO.",
      },
      {
        title: "Responsables IT et sécurité",
        description: "Centralisez les évaluations, les preuves et les actions correctives.",
      },
      {
        title: "Consultants en conformité",
        description:
          "Accompagnez vos clients avec un processus de préparation cohérent et structuré.",
        badge: "Prochainement",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        question: "NormCore certifie-t-il mon organisation ?",
        answer:
          "Non. NormCore aide les organisations à évaluer et améliorer leur niveau de préparation. La certification est réalisée par un organisme certificateur indépendant.",
      },
      {
        question: "NormCore couvre-t-il l’intégralité d’ISO/IEC 27001 ?",
        answer:
          "Le produit initial se concentre sur les contrôles de l’Annexe A. Les exigences plus larges du SMSI, notamment les clauses 4 à 10, sont prévues dans une évolution future.",
      },
      {
        question: "Puis-je m’arrêter et continuer plus tard ?",
        answer:
          "Oui. Vos réponses sont sauvegardées automatiquement et NormCore vous ramène exactement au point où vous vous êtes arrêté.",
      },
      {
        question: "NormCore est-il disponible en français ?",
        answer:
          "Oui. L’interface, le questionnaire et les rapports sont disponibles en anglais et en français.",
      },
      {
        question: "L’IA décide-t-elle si nous sommes conformes ?",
        answer:
          "Non. L’IA fournit des explications et des suggestions. L’applicabilité, l’approbation des preuves et les décisions finales restent sous contrôle humain.",
      },
      {
        question: "NormCore est-il un auditeur ?",
        answer:
          "Non. NormCore est une plateforme de préparation et de gestion, pas un auditeur ni un organisme certificateur.",
      },
    ],
  },
  finalCta: {
    title: "Commencez votre préparation avant que l’audit ne devienne urgent.",
    description:
      "Créez votre compte NormCore et commencez à construire une vision claire de votre préparation à l’Annexe A.",
    button: "Créer un compte",
  },
  footer: {
    product: ["Fonctionnement", "Fonctionnalités", "Sécurité", "Tarifs"],
    resources: ["Présentation d’ISO/IEC 27001", "Glossaire de sécurité", "Guides", "Contact"],
    legal: ["Politique de confidentialité", "Conditions d’utilisation", "Politique relative aux cookies", "Notice d’utilisation de l’IA"],
    language: ["English", "Français"],
    disclaimer:
      "NormCore est une plateforme indépendante de préparation. Elle n’est pas affiliée à ISO et ne fournit pas de services de certification.",
  },
} as const;

export const landingCopies = { en: landingCopy, fr: landingCopyFr } as const;
export type Language = keyof typeof landingCopies;
export type LandingCopy = (typeof landingCopies)[Language];
