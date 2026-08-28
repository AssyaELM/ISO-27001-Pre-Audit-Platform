import { organizationalControls as organizationalControlRows } from "@/content/assessment/organizational/organizational-controls";
import { peopleControls as peopleControlRows } from "@/content/assessment/people/people-controls";
import { physicalControls as physicalControlRows } from "@/content/assessment/physical/physical-controls";
import { technologicalControls as technologicalControlRows } from "@/content/assessment/technological/technological-controls.generated";

export type PublicAnnexThemeId = "organizational" | "people" | "physical" | "technological";

export type PublicAnnexTheme = {
  id: PublicAnnexThemeId;
  slug: PublicAnnexThemeId;
  title: string;
  count: number;
  description: string;
  landingPreviewControls: string[];
  representativeControlCodes: string[];
  ctaLabel: string;
};

export type PublicAnnexControl = {
  theme: PublicAnnexThemeId;
  code: string;
  codeSlug: string;
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  objective: string;
  explanation: string;
  whyItMatters: string;
  considerations: string[];
  evidenceExamples: string[];
  implementationGuidance: string;
  relatedControlCodes: string[];
};

type RawTupleControl = readonly [string, string, string, string];
type RawObjectControl = { code: string; name: string };

function titleCase(value: string) {
  const minorWords = new Set(["and", "or", "of", "the", "for", "in", "on", "to", "with", "from", "by", "after", "within", "over", "under"]);
  return value
    .split(" ")
    .map((word, index, words) => {
      if (!word) return word;
      if (word.startsWith("A.")) return word;
      if (/^[A-Z0-9/&-]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (index > 0 && index < words.length - 1 && minorWords.has(lower)) return lower;
      return `${lower[0].toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function codeToSlug(code: string) {
  return code.toLowerCase().replace(/\./g, "-");
}

function normalizeTuple(theme: PublicAnnexThemeId, row: RawTupleControl): PublicAnnexControl {
  const code = row[1];
  const title = titleCase(row[2]);
  return buildControl(theme, code, title);
}

function normalizeObject(theme: PublicAnnexThemeId, row: RawObjectControl): PublicAnnexControl {
  return buildControl(theme, row.code, titleCase(row.name));
}

function topicFocus(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("policy")) return "clear rules and governance";
  if (lower.includes("role")) return "defined accountability";
  if (lower.includes("segregation")) return "separation of duties";
  if (lower.includes("contact")) return "named escalation paths";
  if (lower.includes("threat intelligence")) return "relevant threat awareness";
  if (lower.includes("project")) return "security built into delivery";
  if (lower.includes("inventory")) return "current visibility of assets";
  if (lower.includes("acceptable use")) return "clear user expectations";
  if (lower.includes("return of assets")) return "end-of-employment handback";
  if (lower.includes("classification")) return "consistent handling rules";
  if (lower.includes("labelling")) return "visible information markings";
  if (lower.includes("transfer")) return "controlled movement of information";
  if (lower.includes("access control")) return "who can access what";
  if (lower.includes("identity management")) return "identity lifecycle control";
  if (lower.includes("authentication")) return "strong proof of identity";
  if (lower.includes("access rights")) return "periodic privilege review";
  if (lower.includes("supplier")) return "managed third-party risk";
  if (lower.includes("cloud")) return "secure use of hosted services";
  if (lower.includes("incident")) return "prepared incident handling";
  if (lower.includes("evidence")) return "traceable incident records";
  if (lower.includes("disruption")) return "continuity during interruption";
  if (lower.includes("business continuity")) return "continuity planning and recovery";
  if (lower.includes("legal")) return "legal and contractual awareness";
  if (lower.includes("intellectual property")) return "respect for ownership and licensing";
  if (lower.includes("records")) return "retention and protection of records";
  if (lower.includes("privacy")) return "privacy-aware handling of personal data";
  if (lower.includes("review")) return "independent oversight";
  if (lower.includes("compliance")) return "ongoing policy compliance";
  if (lower.includes("operating procedures")) return "repeatable day-to-day operations";
  if (lower.includes("screening")) return "careful hiring checks";
  if (lower.includes("terms and conditions")) return "security requirements in employment terms";
  if (lower.includes("awareness")) return "practical user training";
  if (lower.includes("disciplinary")) return "consistent response to violations";
  if (lower.includes("termination")) return "secure offboarding and post-employment duties";
  if (lower.includes("confidentiality")) return "confidential handling obligations";
  if (lower.includes("remote working")) return "safe work away from the office";
  if (lower.includes("event reporting")) return "prompt security incident reporting";
  if (lower.includes("physical security perimeters")) return "clear physical boundaries";
  if (lower.includes("physical entry")) return "controlled access to spaces";
  if (lower.includes("securing offices")) return "protected rooms and facilities";
  if (lower.includes("monitoring")) return "visible and reviewable monitoring";
  if (lower.includes("environmental threats")) return "protection from surroundings";
  if (lower.includes("secure areas")) return "work performed in protected spaces";
  if (lower.includes("clear desk")) return "reduced exposure to sensitive material";
  if (lower.includes("equipment siting")) return "safe placement of equipment";
  if (lower.includes("off-premises")) return "security beyond office walls";
  if (lower.includes("storage media")) return "handling of removable media";
  if (lower.includes("supporting utilities")) return "resilient supporting services";
  if (lower.includes("cabling")) return "protected cabling and routing";
  if (lower.includes("maintenance")) return "maintained equipment integrity";
  if (lower.includes("disposal")) return "secure disposal or reuse";
  if (lower.includes("endpoint")) return "protected user devices";
  if (lower.includes("privileged access")) return "controlled high-impact access";
  if (lower.includes("information access restriction")) return "data access limitations";
  if (lower.includes("source code")) return "safeguarded code access";
  if (lower.includes("secure authentication")) return "robust login assurance";
  if (lower.includes("capacity management")) return "capacity planning";
  if (lower.includes("malware")) return "malware defense";
  if (lower.includes("technical vulnerabilities")) return "vulnerability management";
  if (lower.includes("configuration management")) return "controlled configuration";
  if (lower.includes("information deletion")) return "secure deletion";
  if (lower.includes("data masking")) return "reduced exposure in test or analytics use";
  if (lower.includes("data leakage prevention")) return "controlled exfiltration risk";
  if (lower.includes("backup")) return "recoverable information";
  if (lower.includes("redundancy")) return "resilient service design";
  if (lower.includes("logging")) return "traceable system activity";
  if (lower.includes("monitoring activities")) return "active operational surveillance";
  if (lower.includes("clock synchronisation")) return "consistent timestamps";
  if (lower.includes("utility programs")) return "restricted privileged tools";
  if (lower.includes("installation of software")) return "controlled software deployment";
  if (lower.includes("network security")) return "protected connectivity";
  if (lower.includes("network services")) return "defined network dependencies";
  if (lower.includes("segregation of networks")) return "separated traffic zones";
  if (lower.includes("web filtering")) return "safer browsing and web access";
  if (lower.includes("cryptography")) return "appropriate encryption use";
  if (lower.includes("development life cycle")) return "security built into delivery";
  if (lower.includes("application security requirements")) return "clear engineering expectations";
  if (lower.includes("architecture and engineering")) return "secure design principles";
  if (lower.includes("secure coding")) return "safer code production";
  if (lower.includes("security testing")) return "evidence of security checks";
  if (lower.includes("outsourced development")) return "managed third-party development";
  if (lower.includes("development, test and production")) return "environment separation";
  if (lower.includes("change management")) return "controlled system changes";
  if (lower.includes("test information")) return "safe use of test data";
  if (lower.includes("audit testing")) return "protected audit activities";
  return "risk-based security practice";
}

function bulletsFor(theme: PublicAnnexThemeId, title: string) {
  const focus = topicFocus(title);
  const lower = title.toLowerCase();
  const baseConsiderations = [
    `Define the scope, owner and review rhythm for ${focus}.`,
    `Make sure the control is proportionate to the organisation's size, risk profile and operating model.`,
    `Clarify how exceptions are approved, recorded and revisited.`,
    `Keep the control connected to day-to-day process, not just policy language.`,
  ];
  const baseEvidence = [
    `Documented policy, procedure or standard for ${title}.`,
    `Ownership, approval or review records.`,
    `Operational records showing the control is used in practice.`,
    `Exception, remediation or review notes where applicable.`,
  ];

  if (theme === "organizational") {
    if (lower.includes("supplier") || lower.includes("cloud")) {
      return {
        considerations: [
          "Identify which suppliers or cloud services are in scope and what security expectations apply.",
          "Make sure contracts, reviews and escalation paths match the level of sensitivity involved.",
          "Track changes to supplier services, ownership and dependencies over time.",
          "Keep a clear boundary between internal ownership and supplier-delivered work.",
        ],
        evidence: [
          "Supplier or cloud service register.",
          "Security clauses, reviews or scorecards.",
          "Risk assessments or due diligence records.",
          "Issue, escalation or service-change tracking records.",
        ],
      };
    }
    if (lower.includes("incident") || lower.includes("evidence") || lower.includes("disruption") || lower.includes("business continuity")) {
      return {
        considerations: [
          "Link the control to the incident or continuity lifecycle, not just a written policy.",
          "Define who decides, who communicates and who records the outcome.",
          "Use exercises, post-incident reviews or tests to validate the process.",
          "Keep the response path easy to find when pressure is high.",
        ],
        evidence: [
          "Incident or continuity playbooks.",
          "Exercise notes or after-action reviews.",
          "Escalation and notification records.",
          "Corrective actions or lessons-learned logs.",
        ],
      };
    }
    if (lower.includes("access") || lower.includes("identity") || lower.includes("authentication")) {
      return {
        considerations: [
          "Tie access decisions to identity lifecycle events such as joiner, mover and leaver changes.",
          "Use least privilege and review access regularly enough for the risk.",
          "Keep authentication strength aligned to the sensitivity of the asset or system.",
          "Track approvals, exceptions and revocations in one place.",
        ],
        evidence: [
          "Access request and approval records.",
          "Identity or privilege review output.",
          "Leaver or access-revocation records.",
          "Configuration or IAM screenshots / exports.",
        ],
      };
    }
  }

  if (theme === "people") {
    if (lower.includes("screening")) {
      return {
        considerations: [
          "Align screening depth to role sensitivity and legal constraints.",
          "Make sure screening happens before access is granted where appropriate.",
          "Keep the process consistent and repeatable for similar roles.",
          "Document how gaps or adverse findings are handled.",
        ],
        evidence: [
          "Screening checklist or HR process.",
          "Role-risk criteria for screening depth.",
          "Completed screening records or attestations.",
          "Exception approvals or escalation notes.",
        ],
      };
    }
    if (lower.includes("awareness") || lower.includes("training")) {
      return {
        considerations: [
          "Tailor training to role, location and access level.",
          "Refresh awareness when threats, systems or responsibilities change.",
          "Measure completion and follow up missed training.",
          "Connect awareness to practical scenarios rather than generic messaging.",
        ],
        evidence: [
          "Training plan or curriculum.",
          "Completion reports from LMS or attendance records.",
          "Awareness communications and campaigns.",
          "Role-specific training materials or assessments.",
        ],
      };
    }
    if (lower.includes("remote working")) {
      return {
        considerations: [
          "Cover device security, screen privacy, network use and information handling.",
          "Spell out what is allowed on personal devices or in shared spaces.",
          "Clarify reporting expectations for loss, theft or suspicious activity.",
          "Review the control when the work model changes.",
        ],
        evidence: [
          "Remote working policy or guidance.",
          "User acknowledgements or training records.",
          "Secure access configuration or device controls.",
          "Incident or exception records related to remote work.",
        ],
      };
    }
  }

  if (theme === "physical") {
    if (lower.includes("perimeter") || lower.includes("entry") || lower.includes("secure areas")) {
      return {
        considerations: [
          "Identify which areas need stronger protection and how entry is controlled.",
          "Combine physical controls with monitoring and visitor handling where needed.",
          "Review access when roles, spaces or occupancy change.",
          "Make the control proportionate to what is stored or processed in the area.",
        ],
        evidence: [
          "Site or secure-area diagrams.",
          "Access lists, badge or visitor records.",
          "Inspection or monitoring logs.",
          "Physical security policy or standards.",
        ],
      };
    }
    if (lower.includes("clear desk") || lower.includes("storage media") || lower.includes("disposal")) {
      return {
        considerations: [
          "Protect paper, removable media and screens from casual exposure and loss.",
          "Define what must be stored, locked, wiped or destroyed.",
          "Include cleanup and disposal expectations in routine operations.",
          "Check that remote or hybrid work is covered too.",
        ],
        evidence: [
          "Clear desk / secure storage guidance.",
          "Media handling or disposal records.",
          "Awareness communications.",
          "Inspection or audit results.",
        ],
      };
    }
  }

  if (theme === "technological") {
    if (lower.includes("vulnerabilities") || lower.includes("malware") || lower.includes("backup") || lower.includes("logging") || lower.includes("monitoring")) {
      return {
        considerations: [
          "Make sure monitoring or scanning output reaches the people who can act on it.",
          "Prioritise issues by exposure, criticality and exploitability rather than volume alone.",
          "Define how often reviews, scans or checks should happen.",
          "Track remediation, exceptions and re-checks in one workflow.",
        ],
        evidence: [
          "Scanner or monitoring reports.",
          "Patch, backup or detection records.",
          "Remediation tickets and closure evidence.",
          "Exception or risk acceptance records.",
        ],
      };
    }
    if (lower.includes("access") || lower.includes("authentication") || lower.includes("privileged") || lower.includes("source code")) {
      return {
        considerations: [
          "Separate standard and privileged access where practical.",
          "Use strong authentication and regular review for sensitive systems.",
          "Limit access to development material, production data and administration tools.",
          "Remove access promptly when roles change.",
        ],
        evidence: [
          "Access and privilege reviews.",
          "IAM / SSO / MFA configuration screenshots or exports.",
          "Approval records for elevated access.",
          "Revocation or joiner-mover-leaver records.",
        ],
      };
    }
  }

  return { considerations: baseConsiderations, evidence: baseEvidence };
}

function buildControl(theme: PublicAnnexThemeId, code: string, title: string): PublicAnnexControl {
  const codeSlug = codeToSlug(code);
  const slug = `${codeSlug}-${slugify(title)}`;
  const topic = topicFocus(title);
  const { considerations, evidence } = bulletsFor(theme, title);
  const themeDescriptions: Record<PublicAnnexThemeId, string> = {
    organizational:
      "Organizational controls help an ISMS turn policy into repeatable governance, supplier oversight, incident handling and operational discipline.",
    people:
      "People controls turn human behaviour into a predictable part of the security model through screening, training, confidentiality and reporting.",
    physical:
      "Physical controls shape how people, places and equipment are protected in everyday use and during change or disruption.",
    technological:
      "Technological controls reduce digital exposure by managing access, hardening systems, detecting issues and protecting data across the lifecycle.",
  };

  return {
    theme,
    code,
    codeSlug,
    id: codeSlug,
    slug,
    title,
    shortDescription: `${code} ${title} helps teams manage ${topic} in a way that fits their operating model.`,
    objective: `Give the organisation a repeatable way to maintain ${topic}.`,
    explanation: `${themeDescriptions[theme]} ${title} should be implemented in proportion to the organisation's risks, systems and responsibilities.`,
    whyItMatters: `If ${topic} is left informal, the organisation can end up with inconsistent decisions, weaker resilience and control evidence that is hard to trust.`,
    considerations,
    evidenceExamples: evidence,
    implementationGuidance:
      "Start with a clear owner, a simple process and a review cadence that matches the sensitivity of the control. Keep the implementation practical, document exceptions and connect the control to the systems or teams that use it every day.",
    relatedControlCodes: [],
  };
}

const organizationalControls = organizationalControlRows.map((row) => normalizeObject("organizational", row));
const peopleControls = peopleControlRows.map((row) => normalizeTuple("people", row));
const physicalControls = physicalControlRows.map((row) => normalizeTuple("physical", row));
const technologicalControls = technologicalControlRows.map((row) => normalizeObject("technological", row));

export const publicAnnexControls = [
  ...organizationalControls,
  ...peopleControls,
  ...physicalControls,
  ...technologicalControls,
].map((control, index, allControls) => {
  const themeControls = allControls.filter((item) => item.theme === control.theme);
  const themeIndex = themeControls.findIndex((item) => item.code === control.code);
  const previous = themeIndex > 0 ? themeControls[themeIndex - 1]?.code : undefined;
  const next = themeIndex < themeControls.length - 1 ? themeControls[themeIndex + 1]?.code : undefined;
  const alternates = themeControls
    .filter((item) => item.code !== control.code)
    .slice(Math.max(0, themeIndex - 1), Math.max(0, themeIndex - 1) + 4)
    .map((item) => item.code);
  control.relatedControlCodes = [...new Set([previous, next, ...alternates].filter(Boolean) as string[])];
  return control;
});

export const publicAnnexThemes: PublicAnnexTheme[] = [
  {
    id: "organizational",
    slug: "organizational",
    title: "Organizational",
    count: 37,
    description:
      "Organizational controls define how information security is governed and managed across the organisation. They cover policies, responsibilities, assets, access, suppliers, incidents, continuity, compliance and operational processes.",
    landingPreviewControls: ["Policies for Information Security", "Threat Intelligence", "Information Security for Use of Cloud Services"],
    representativeControlCodes: ["A.5.1", "A.5.7", "A.5.23", "A.5.24"],
    ctaLabel: "Explore Organizational controls",
  },
  {
    id: "people",
    slug: "people",
    title: "People",
    count: 8,
    description:
      "People controls address the human side of information security, including screening, employment responsibilities, awareness, confidentiality, remote working and security event reporting.",
    landingPreviewControls: ["Screening", "Information Security Awareness, Education and Training", "Remote Working"],
    representativeControlCodes: ["A.6.1", "A.6.3", "A.6.7", "A.6.8"],
    ctaLabel: "Explore People controls",
  },
  {
    id: "physical",
    slug: "physical",
    title: "Physical",
    count: 14,
    description:
      "Physical controls protect premises, equipment and information assets against unauthorised physical access, damage, theft and environmental threats.",
    landingPreviewControls: ["Physical Security Perimeters", "Physical Entry", "Clear Desk and Clear Screen"],
    representativeControlCodes: ["A.7.1", "A.7.2", "A.7.7", "A.7.14"],
    ctaLabel: "Explore Physical controls",
  },
  {
    id: "technological",
    slug: "technological",
    title: "Technological",
    count: 34,
    description:
      "Technological controls protect systems, applications, networks and data through access control, vulnerability management, monitoring, backups, cryptography and secure development.",
    landingPreviewControls: ["Privileged Access Rights", "Management of Technical Vulnerabilities", "Information Backup"],
    representativeControlCodes: ["A.8.2", "A.8.8", "A.8.13", "A.8.25"],
    ctaLabel: "Explore Technological controls",
  },
];

export const publicAnnexStats = [
  { label: "Controls", value: "93" },
  { label: "Themes", value: "4" },
  { label: "Edition", value: "ISO/IEC 27001:2022" },
] as const;

export function getAnnexTheme(themeSlug: PublicAnnexThemeId) {
  return publicAnnexThemes.find((theme) => theme.slug === themeSlug);
}

export function getAnnexControlBySlug(slug: string) {
  return publicAnnexControls.find((control) => control.slug === slug);
}

export function getAnnexControlByCode(code: string) {
  return publicAnnexControls.find((control) => control.code === code);
}

export function getAnnexControlsForTheme(themeSlug: PublicAnnexThemeId) {
  return publicAnnexControls.filter((control) => control.theme === themeSlug);
}

export function getAnnexThemeRoutes() {
  return publicAnnexThemes.map((theme) => ({
    slug: theme.slug,
    title: theme.title,
    count: theme.count,
  }));
}

export function getAnnexControlRoutes() {
  return publicAnnexControls.map((control) => ({
    slug: control.slug,
    code: control.code,
    title: control.title,
    theme: control.theme,
  }));
}

export function getControlNavigation(control: PublicAnnexControl) {
  const themeControls = getAnnexControlsForTheme(control.theme);
  const currentIndex = themeControls.findIndex((item) => item.code === control.code);
  return {
    previous: themeControls[currentIndex - 1],
    next: themeControls[currentIndex + 1],
  };
}

export function getPublicAnnexPageData(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return { kind: "index" as const };
  }
  if (slug.length === 1) {
    const value = slug[0] as string;
    const theme = getAnnexTheme(value as PublicAnnexThemeId);
    if (theme) {
      return { kind: "theme" as const, themeSlug: theme.slug };
    }
    const control = getAnnexControlBySlug(value);
    if (control) {
      return { kind: "control" as const, controlSlug: control.slug };
    }
  }
  return { kind: "not-found" as const };
}
