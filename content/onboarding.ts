import type { Language } from "@/content/landing";

export const organizationSizes = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,001+"] as const;

export const industries = [
  { id: "software-saas", en: "Software / SaaS", fr: "Logiciels / SaaS", artwork: 0 },
  { id: "financial-services", en: "Financial Services", fr: "Services financiers", artwork: 1 },
  { id: "healthcare-life-sciences", en: "Healthcare / Life Sciences", fr: "Santé / Sciences de la vie", artwork: 2 },
  { id: "professional-services", en: "Professional Services / Consulting", fr: "Services professionnels / Conseil", artwork: 3 },
  { id: "ecommerce-retail", en: "E-commerce / Retail", fr: "E-commerce / Commerce de détail", artwork: 4 },
  { id: "manufacturing-industrial", en: "Manufacturing / Industrial", fr: "Industrie / Fabrication", artwork: 5 },
  { id: "education", en: "Education", fr: "Éducation", artwork: 6 },
  { id: "telecommunications", en: "Telecommunications", fr: "Télécommunications", artwork: 7 },
  { id: "media-technology", en: "Media / Technology", fr: "Médias / Technologie", artwork: 0 },
  { id: "government-public-sector", en: "Government / Public Sector", fr: "Gouvernement / Secteur public", artwork: 6 },
  { id: "non-profit", en: "Non-profit Organization", fr: "Organisation à but non lucratif", artwork: 3 },
  { id: "public-sector", en: "Public sector", fr: "Secteur public", artwork: 6 },
  { id: "other", en: "Other", fr: "Autre", artwork: 1 },
] as const;

export const softwareDevelopmentOptions = [
  { id: "internal", en: "Yes: Internal development team", fr: "Oui : Équipe de développement interne" },
  { id: "outsourced", en: "Yes: Development is outsourced", fr: "Oui : Développement externalisé" },
  { id: "both", en: "Yes: Both internal and outsourced", fr: "Oui : Interne et externalisé" },
  { id: "no", en: "No", fr: "Non" },
  { id: "not-sure", en: "Not sure", fr: "Je ne sais pas" },
] as const;

export const workModelOptions = [
  {
    id: "remote",
    en: { title: "Fully remote", description: "Everyone primarily works remotely." },
    fr: { title: "Entièrement à distance", description: "Tout le monde travaille principalement à distance." },
  },
  {
    id: "hybrid",
    en: { title: "Hybrid", description: "Teams work both remotely and on-site." },
    fr: { title: "Hybride", description: "Les équipes travaillent à distance et sur site." },
  },
  {
    id: "onsite",
    en: { title: "Primarily on-site", description: "Most work is performed from company locations." },
    fr: { title: "Principalement sur site", description: "La majorité du travail est effectuée depuis les locaux de l’organisation." },
  },
] as const;

export const assessmentScopeOptions = [
  {
    id: "entire",
    en: { title: "Entire organization", description: "All departments, people, locations and systems." },
    fr: { title: "Toute l’organisation", description: "Tous les départements, personnes, sites et systèmes." },
  },
  {
    id: "product",
    en: { title: "A specific product or service", description: "One product, platform or customer-facing service." },
    fr: { title: "Un produit ou service spécifique", description: "Un produit, une plateforme ou un service destiné aux clients." },
  },
  {
    id: "business-unit",
    en: { title: "A business unit or department", description: "One team, department or operational unit." },
    fr: { title: "Une unité métier ou un département", description: "Une équipe, un département ou une unité opérationnelle." },
  },
  {
    id: "location",
    en: { title: "A specific location", description: "One office, facility or geographic location." },
    fr: { title: "Un site spécifique", description: "Un bureau, un établissement ou un site géographique." },
  },
  {
    id: "undecided",
    en: { title: "Not decided yet", description: "The assessment scope will be defined later." },
    fr: { title: "Pas encore défini", description: "Le périmètre de l’évaluation sera défini ultérieurement." },
  },
] as const;

export const assessmentOwnerRoles = [
  { id: "founder-executive", en: "Founder / Executive", fr: "Fondateur / Direction générale" },
  { id: "it-manager", en: "IT Manager / SysAdmin", fr: "Responsable Informatique (DSI) / SysAdmin" },
  { id: "security-manager", en: "Security Manager / CISO", fr: "Responsable Sécurité (RSSI)" },
  { id: "compliance-risk", en: "Compliance / Risk Manager", fr: "Responsable Conformité / Risques" },
  { id: "data-protection", en: "Data Protection / Privacy Manager", fr: "Délégué à la Protection des Données (DPO)" },
  { id: "engineering-manager", en: "Engineering / Development Manager", fr: "Directeur Technique (CTO) / Lead Developer" },
  { id: "hr-operations", en: "HR / Operations Manager", fr: "Responsable RH / Opérations" },
  { id: "project-manager", en: "Project Manager", fr: "Chef de Projet" },
  { id: "consultant", en: "Consultant / External Advisor", fr: "Consultant / Conseiller externe" },
  { id: "other", en: "Other", fr: "Autre" },
] as const;

const countryCodes = [
  "MA", "FR", "GB", "US", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO",
  "GA", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export function getCountryOptions(language: Language) {
  const displayNames = new Intl.DisplayNames([language], { type: "region" });
  return countryCodes
    .map((code) => ({ code, label: displayNames.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label, language, { sensitivity: "base" }));
}

export const onboardingCopy = {
  en: {
    globalStep: "Step 1 of 5",
    section: "Organization",
    saveAndExit: "Save & exit",
    back: "Back",
    continue: "Continue",
    substep: (step: number) => `Organization · ${step} of 4`,
    required: "Complete this field before continuing.",
    saved: "Your organization information has been saved.",
    screens: {
      organizationName: {
        title: "Organization name",
        description: "This will identify your readiness workspace and future assessment documents.",
        label: "Organization name",
        placeholder: "Acme Ltd",
      },
      companySize: {
        title: "Company size",
        question: "How many people work in your organization?",
      },
      country: {
        title: "Primary country",
        question: "What is your organization’s primary country of operation?",
        description: "This information will be useful for legal requirements, data protection, and future documents.",
        label: "Primary country",
        placeholder: "Search for a country",
        noResults: "No country found",
      },
      industry: {
        title: "Industry",
        question: "What is your organization’s primary industry?",
        label: "Industry",
        placeholder: "Select or search for an industry",
        otherLabel: "Please specify your industry",
      },
    },
  },
  fr: {
    globalStep: "Étape 1 sur 5",
    section: "Organisation",
    saveAndExit: "Enregistrer et quitter",
    back: "Retour",
    continue: "Continuer",
    substep: (step: number) => `Organisation · ${step} sur 4`,
    required: "Complétez ce champ avant de continuer.",
    saved: "Les informations de votre organisation ont été enregistrées.",
    screens: {
      organizationName: {
        title: "Nom de l’organisation",
        description: "Ce nom identifiera votre espace de préparation et vos futurs documents d’évaluation.",
        label: "Nom de l’organisation",
        placeholder: "Acme Ltd",
      },
      companySize: {
        title: "Taille de l’entreprise",
        question: "Combien de personnes travaillent dans votre organisation ?",
      },
      country: {
        title: "Pays principal",
        question: "Quel est le principal pays d’activité de votre organisation ?",
        description: "Cette information sera utile pour les exigences légales, la protection des données et les futurs documents.",
        label: "Pays principal",
        placeholder: "Rechercher un pays",
        noResults: "Aucun pays trouvé",
      },
      industry: {
        title: "Secteur d’activité",
        question: "Quel est le secteur d’activité principal de votre organisation ?",
        label: "Secteur d’activité",
        placeholder: "Sélectionner ou rechercher un secteur",
        otherLabel: "Précisez votre secteur d’activité",
      },
    },
  },
} as const;

export const remainingOnboardingCopy = {
  en: {
    steps: ["Organization", "Operating environment", "Assessment scope", "Assessment owner", "Review"],
    step: (step: number) => `Step ${step} of 5`,
    saveAndExit: "Save & exit",
    back: "Back",
    continue: "Continue",
    createWorkspace: "Create workspace",
    creatingWorkspace: "Creating workspace…",
    workspaceCreated: "Workspace created successfully.",
    required: "Complete this field before continuing.",
    saveError: "Your progress is saved on this device, but could not be synchronized right now.",
    profile: {
      loading: "Loading your account information…",
      empty: "Your account profile is incomplete. Add the missing information to continue.",
      error: "Your account information could not be loaded. You can enter it manually.",
    },
    software: {
      marker: "Operating environment · 1 of 2",
      title: "Software development",
      question: "Does your organization develop software or applications?",
      imageAlt: "Secure software delivery environment",
    },
    workModel: {
      marker: "Operating environment · 2 of 2",
      title: "Work model",
      question: "What is your organization’s primary work model?",
      imageAlt: "Remote, hybrid and on-site work environments",
    },
    scope: {
      marker: "Assessment scope · 1 of 1",
      title: "Assessment coverage",
      question: "What should this assessment cover?",
      imageAlt: "Enterprise assessment scope boundaries",
      scopeName: "Assessment scope",
      productName: "Product or service name",
      businessName: "Business unit or department name",
      locationName: "Location name",
      description: "Scope description",
      productPlaceholder: "NormCore SaaS Platform",
      businessPlaceholder: "Information Technology",
      locationPlaceholder: "Casablanca Office",
      descriptionPlaceholder: "Describe the people, systems and activities included…",
      undecidedWarning: "You can continue and define the assessment scope later.",
    },
    owner: {
      marker: "Assessment owner · 1 of 1",
      title: "Owner information",
      question: "What is your role in the organization?",
      imageAlt: "Professional reviewing a readiness assessment",
      fullName: "Full name",
      workEmail: "Work email",
      role: "Role in the organization",
      rolePlaceholder: "Select your role",
      otherRole: "Please specify your role",
      namePlaceholder: "Your full name",
      emailPlaceholder: "you@company.com",
      invalidEmail: "Enter a valid work email address, including a name, @ and domain.",
    },
    review: {
      marker: "Review · Final step",
      title: "Review your workspace",
      question: "Confirm your information before creating the workspace.",
      sectionsComplete: "Sections complete",
      complete: "Complete",
      organization: "Organization",
      environment: "Operating environment",
      scope: "Assessment scope",
      owner: "Assessment owner",
      name: "Name",
      size: "Size",
      country: "Country",
      industry: "Industry",
      development: "Development",
      workModel: "Work model",
      coverage: "Coverage",
      scopeName: "Scope",
      email: "Email",
      role: "Role",
    },
  },
  fr: {
    steps: ["Organisation", "Environnement opérationnel", "Périmètre de l’évaluation", "Responsable de l’évaluation", "Vérification"],
    step: (step: number) => `Étape ${step} sur 5`,
    saveAndExit: "Enregistrer et quitter",
    back: "Retour",
    continue: "Continuer",
    createWorkspace: "Créer l’espace",
    creatingWorkspace: "Création de l’espace…",
    workspaceCreated: "L’espace a été créé avec succès.",
    required: "Complétez ce champ avant de continuer.",
    saveError: "Votre progression est enregistrée sur cet appareil, mais la synchronisation a échoué.",
    profile: {
      loading: "Chargement des informations de votre compte…",
      empty: "Le profil de votre compte est incomplet. Ajoutez les informations manquantes pour continuer.",
      error: "Les informations de votre compte n’ont pas pu être chargées. Vous pouvez les saisir manuellement.",
    },
    software: {
      marker: "Environnement opérationnel · 1 sur 2",
      title: "Développement logiciel",
      question: "Votre organisation développe-t-elle des logiciels ou des applications ?",
      imageAlt: "Environnement sécurisé de développement logiciel",
    },
    workModel: {
      marker: "Environnement opérationnel · 2 sur 2",
      title: "Mode de travail",
      question: "Quel est le principal mode de travail de votre organisation ?",
      imageAlt: "Environnements de travail à distance, hybrides et sur site",
    },
    scope: {
      marker: "Périmètre de l’évaluation · 1 sur 1",
      title: "Couverture de l’évaluation",
      question: "Que doit couvrir cette évaluation ?",
      imageAlt: "Limites du périmètre d’évaluation de l’entreprise",
      scopeName: "Périmètre de l’évaluation",
      productName: "Nom du produit ou service",
      businessName: "Nom de l’unité métier ou du département",
      locationName: "Nom du site",
      description: "Description du périmètre",
      productPlaceholder: "Plateforme SaaS NormCore",
      businessPlaceholder: "Technologies de l’information",
      locationPlaceholder: "Bureau de Casablanca",
      descriptionPlaceholder: "Décrivez les personnes, systèmes et activités inclus…",
      undecidedWarning: "Vous pouvez continuer et définir le périmètre de l’évaluation ultérieurement.",
    },
    owner: {
      marker: "Responsable de l’évaluation · 1 sur 1",
      title: "Informations du responsable",
      question: "Quelle est votre fonction dans l’organisation ?",
      imageAlt: "Professionnel examinant une évaluation de préparation",
      fullName: "Nom complet",
      workEmail: "E-mail professionnel",
      role: "Fonction dans l’organisation",
      rolePlaceholder: "Sélectionnez votre fonction",
      otherRole: "Précisez votre fonction",
      namePlaceholder: "Votre nom complet",
      emailPlaceholder: "vous@entreprise.com",
      invalidEmail: "Saisissez une adresse e-mail professionnelle valide avec un nom, @ et un domaine.",
    },
    review: {
      marker: "Vérification · Étape finale",
      title: "Vérifiez votre espace",
      question: "Confirmez vos informations avant de créer l’espace.",
      sectionsComplete: "Sections terminées",
      complete: "Terminé",
      organization: "Organisation",
      environment: "Environnement opérationnel",
      scope: "Périmètre de l’évaluation",
      owner: "Responsable de l’évaluation",
      name: "Nom",
      size: "Taille",
      country: "Pays",
      industry: "Secteur",
      development: "Développement",
      workModel: "Mode de travail",
      coverage: "Couverture",
      scopeName: "Périmètre",
      email: "E-mail",
      role: "Fonction",
    },
  },
} as const;

export type OrganizationSize = (typeof organizationSizes)[number];
export type IndustryId = (typeof industries)[number]["id"];
export type SoftwareDevelopmentId = (typeof softwareDevelopmentOptions)[number]["id"];
export type WorkModelId = (typeof workModelOptions)[number]["id"];
export type AssessmentScopeId = (typeof assessmentScopeOptions)[number]["id"];
export type AssessmentOwnerRoleId = (typeof assessmentOwnerRoles)[number]["id"];
