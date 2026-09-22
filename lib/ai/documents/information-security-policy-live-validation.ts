import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_PRINCIPLES } from "../../ai-documents/information-security-policy.ts";
import type { InformationSecurityPolicyGenerationContext } from "../../ai-documents/information-security-policy-generation-contract.ts";
import type { StructuredDocument } from "./generation-schema.ts";

const forbiddenQuality = [/\bTODO\b/i, /\[company name\]/i, /\{[^}]+\}/, /\bNormCore\b/i, /\bquestionnaire\b/i, /\bprompt\b/i, /certified to ISO/i];
const forbiddenIsoCopy = /shall establish,\s*implement,\s*maintain and continually improve/i;
const unsupportedCurrentClaim = /the organization (currently )?(has|have|is|are) (an )?(implemented|established|in place|regularly reviewed|regularly tested)/i;

const groundedRoleClaims = [
  /\bInformation Security Manager\b/i,
  /\bChief Executive Officer\b/i,
  /\bLegal Compliance Officer\b/i,
  /\bHuman Resources\b/i,
  /\bIT team\b/i,
  /\bSecurity Officer\b/i,
  /\bCISO\b/i,
  /\bCompliance Officer\b/i,
  /\bDPO\b/i,
  /\bEmployees and authorized users\b/i,
  /\bManagement(?:,|\s+(?:shall|will|must|provides|provide|is responsible))/i,
];

const groundedSystemClaims = [
  /\binternal document repository\b/i,
  /\b(?:organization(?:'s|’s)?\s+)?intranet\b/i,
  /\bHR matrix\b/i,
  /\blegal register\b/i,
  /\brisk register\b/i,
  /\bticketing system\b/i,
  /\bSIEM\b/i,
  /\bSOC\b/i,
  /\bawareness platform\b/i,
  /\bdocument management system\b/i,
  /\binternal portal\b/i,
  /\bvendor register\b/i,
  /\basset register\b/i,
];

function structuredDocumentText(document: StructuredDocument): string {
  return document.sections.map((section) => {
    if (section.blocks) {
      return section.blocks.map((block) => {
        if (block.type === "paragraph" || block.type === "heading") return block.content;
        if (block.type === "bullet_list" || block.type === "numbered_list") return block.items.join("\n");
        if (block.type === "table") return [block.headers.join(" "), ...block.rows.map((row) => row.join(" "))].join("\n");
        return "";
      }).join("\n");
    }
    return section.content || "";
  }).join("\n");
}

export function validateInformationSecurityPolicyGrounding(document: StructuredDocument, context: InformationSecurityPolicyGenerationContext): string[] {
  const errors: string[] = [];
  const content = structuredDocumentText(document);
  const sourceText = JSON.stringify({ knownInputs: context.knownInputs, semanticFacts: context.semanticFacts }).toLowerCase();

  for (const pattern of [...groundedRoleClaims, ...groundedSystemClaims]) {
    const match = content.match(pattern);
    const matchIndex = match ? content.indexOf(match[0]) : -1;
    const followingText = match && matchIndex >= 0 ? content.slice(matchIndex, matchIndex + match[0].length + 24) : "";
    const isFutureNormativeRole = Boolean(match && groundedRoleClaims.includes(pattern) && /\b(?:shall|must|will)\b/i.test(followingText));
    if (match && !isFutureNormativeRole && !sourceText.includes(match[0].toLowerCase())) {
      errors.push("invented organizational detail", `unsupported organizational claim: ${match[0]}`);
    }
  }

  const countryMatch = content.match(/\b(?:Morocco|Moroccan)\b/i);
  if (countryMatch && !/\b(?:morocco|ma)\b/i.test(sourceText)) {
    errors.push("unsupported legal jurisdiction: Morocco");
  }

  const classificationMatch = content.match(/\b(?:document\s+)?classification\s*[:|-]?\s*internal\b/i);
  const classificationSource = String(context.knownInputs.document_classification ?? "").toLowerCase();
  if (classificationMatch && !classificationSource.includes("internal")) {
    errors.push("unsupported classification: Internal");
  }

  const reviewSource = String(context.knownInputs.review_plan ?? "").toLowerCase();
  const frequencies = content.match(/\b(?:annually|annual|monthly|quarterly|weekly|daily|every \d+ (?:months|days|years|weeks))\b/gi) ?? [];
  for (const frequency of frequencies) {
    if (!reviewSource.includes(frequency.toLowerCase())) errors.push(`unsupported review frequency: ${frequency}`);
  }

  return errors;
}

export function assembleInformationSecurityPolicyDraft(draft: StructuredDocument): StructuredDocument {
  const deterministicContent: Record<string, string> = {
    document_control: "Document control information is maintained through the approved document-management process.",
    information_security_principles: INFORMATION_SECURITY_PRINCIPLES.map((principle) => principle.text).join(" "),
    information_security_policy_framework: "Related policy documents are referenced only when they are available through the approved document registry.",
    review_and_continual_improvement: "The policy is reviewed when approved review triggers are met and improvement needs are identified.",
    approval: "Approval is recorded through the authorized approval process.",
  };
  return {
    ...draft,
    sections: draft.sections.map((section) => {
      const spec = INFORMATION_SECURITY_POLICY_SPEC.sections.find((candidate) => candidate.id === section.sectionId);
      if (!spec || spec.generationMode === "ai_later") return section;
      return { ...section, status: "static", content: deterministicContent[section.sectionId] ?? section.content };
    }),
  };
}

export function validateInformationSecurityPolicyLiveQuality(document: StructuredDocument, context: InformationSecurityPolicyGenerationContext): string[] {
  const errors: string[] = [];
  const content = structuredDocumentText(document);
  if (document.sections.some((s) => !s.blocks?.length && !s.content?.trim())) errors.push("empty section");
  if (forbiddenQuality.some((rule) => rule.test(content))) errors.push("quality forbidden mention");
  if (forbiddenIsoCopy.test(content)) errors.push("possible ISO copying");
  const hasWeakCurrentFact = context.currentFacts.some((fact) => fact.implementationState === "absent" || fact.implementationState === "partial");
  if (hasWeakCurrentFact && unsupportedCurrentClaim.test(content)) errors.push("fact intent inconsistency");
  errors.push(...validateInformationSecurityPolicyGrounding(document, context));
  return errors;
}
