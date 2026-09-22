import { StructuredDocumentBlock } from "./generation-schema";
import { AiDocumentGenerationRequest, AiDocumentGenerationSection } from "../providers/types";
import { AI_DOCUMENT_LABELS } from "../../ai-documents/registry";
import type { AiDocumentType } from "../../ai-documents/registry";
import { ACCESS_CONTROL_PRINCIPLES } from "../../ai-documents/access-control-policy";
import { BACKUP_AND_RECOVERY_PRINCIPLES, BACKUP_AND_RECOVERY_TERMS } from "../../ai-documents/backup-and-recovery-policy";
import { INCIDENT_MANAGEMENT_PRINCIPLES, INCIDENT_MANAGEMENT_TERMS } from "../../ai-documents/incident-management-procedure";
import { INFORMATION_ASSET_MANAGEMENT_PRINCIPLES, INFORMATION_ASSET_MANAGEMENT_TERMS } from "../../ai-documents/information-asset-management-policy";

export function hydrateNonGeneratedSection(
  request: AiDocumentGenerationRequest,
  sectionReq: AiDocumentGenerationSection
): StructuredDocumentBlock[] {
  
  if (request.documentType === "information_security_policy") {
    switch (sectionReq.sectionId) {
      case "document_control":
        return buildDocumentControl(request);
      case "information_security_principles":
        return buildInformationSecurityPrinciples(request);
      case "information_security_policy_framework":
        return buildInformationSecurityPolicyFramework(request);
      case "review_and_continual_improvement":
        return buildReviewAndContinualImprovement(request);
      case "approval":
        return buildApproval(request);
    }
  }

  if (sectionReq.sectionId === "document_control") return buildGenericDocumentControl(request);
  if (sectionReq.sectionId === "policy_review_and_approval" || sectionReq.sectionId === "procedure_review_and_approval") {
    return buildGenericReviewAndApproval(request, sectionReq.sectionId.startsWith("procedure"));
  }

  const staticBlocks = buildStaticBlocks(request.documentType, sectionReq.sectionId);
  if (staticBlocks) return staticBlocks;

  throw new Error(`Unhandled deterministic section: ${sectionReq.sectionId} for document type: ${request.documentType}`);
}

function inputValue(req: AiDocumentGenerationRequest, ...keys: string[]): string {
  for (const key of keys) {
    const value = req.resolvedInputs?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "to be defined";
}

function buildGenericDocumentControl(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  return [{
    type: "table",
    headers: ["Property", "Value"],
    rows: [
      ["Document Version", inputValue(req, "version", "document_version")],
      ["Document Classification", inputValue(req, "classification", "document_classification")],
      ["Document Owner", inputValue(req, "policy_owner", "document_owner", "asset_policy_owner", "procedure_owner")],
      ["Approver", inputValue(req, "approver", "approved_by")],
      ["Review Date or Frequency", inputValue(req, "review_plan", "review_date")],
    ],
  }];
}

function buildGenericReviewAndApproval(req: AiDocumentGenerationRequest, procedure: boolean): StructuredDocumentBlock[] {
  return [{
    type: "table",
    headers: ["Role", "Name", "Review date", "Status"],
    rows: [[procedure ? "Procedure approver" : "Policy approver", inputValue(req, "approver", "approved_by"), inputValue(req, "review_plan", "review_date"), "To be approved"]],
  }];
}

function buildStaticBlocks(documentType: string, sectionId: string): StructuredDocumentBlock[] | undefined {
  if (documentType === "access_control_policy" && sectionId === "access_control_principles") {
    return [{ type: "bullet_list", items: ACCESS_CONTROL_PRINCIPLES.map((principle) => `${principle.label}: ${principle.text}`) }];
  }
  if (documentType === "incident_management_procedure" && sectionId === "terms_and_definitions") {
    return [{ type: "table", headers: ["Term", "Definition"], rows: Object.entries(INCIDENT_MANAGEMENT_TERMS).map(([term, definition]) => [term.replaceAll("_", " "), definition]) }];
  }
  if (documentType === "incident_management_procedure" && sectionId === "incident_management_principles") {
    return [{ type: "bullet_list", items: [...INCIDENT_MANAGEMENT_PRINCIPLES] }];
  }
  if (documentType === "backup_and_recovery_policy" && sectionId === "terms_and_definitions") {
    return [{ type: "table", headers: ["Term", "Definition"], rows: Object.entries(BACKUP_AND_RECOVERY_TERMS).map(([term, definition]) => [term.replaceAll("_", " "), definition]) }];
  }
  if (documentType === "backup_and_recovery_policy" && sectionId === "backup_and_recovery_principles") {
    return [{ type: "bullet_list", items: [...BACKUP_AND_RECOVERY_PRINCIPLES] }];
  }
  if (documentType === "information_asset_management_policy" && sectionId === "terms_and_definitions") {
    return [{ type: "table", headers: ["Term", "Definition"], rows: Object.entries(INFORMATION_ASSET_MANAGEMENT_TERMS).map(([term, definition]) => [term.replaceAll("_", " "), definition]) }];
  }
  if (documentType === "information_asset_management_policy" && sectionId === "asset_management_principles") {
    return [{ type: "bullet_list", items: [...INFORMATION_ASSET_MANAGEMENT_PRINCIPLES] }];
  }
  return undefined;
}

function buildDocumentControl(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  const inputs = req.resolvedInputs || {};
  const version = (inputs.version as string) || (inputs.document_version as string) || "to be defined";
  const owner = (inputs.policy_owner as string) || "to be defined";
  const approver = (inputs.approver as string) || "to be defined";
  const reviewPlan = inputs.review_plan;
  const reviewFreq = typeof reviewPlan === "string" ? reviewPlan : (reviewPlan as Record<string, string> | undefined)?.frequency || "to be defined";
  const classification = (inputs.document_classification as string) || "to be defined";

  return [
    {
      type: "table",
      headers: ["Property", "Value"],
      rows: [
        ["Document Version", version],
        ["Document Classification", classification],
        ["Policy Owner", owner],
        ["Approver", approver],
        ["Review Frequency", reviewFreq]
      ]
    }
  ];
}

function buildInformationSecurityPrinciples(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  const inputs = req.resolvedInputs || {};
  const principles = (inputs.information_security_principles as Array<{label: string, text: string}>) || [];
  
  if (!principles.length) {
    return [
      {
        type: "paragraph",
        content: "The organization adheres to the core principles of information security (CIA Triad): Confidentiality, Integrity, and Availability."
      }
    ];
  }

  return [
    {
      type: "paragraph",
      content: "The organization adheres to the core principles of information security:"
    },
    {
      type: "bullet_list",
      items: principles.map(p => p.label + ": " + p.text)
    }
  ];
}

function buildInformationSecurityPolicyFramework(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  const inputs = req.resolvedInputs || {};
  const frameworkDocs = (inputs.policy_framework_documents as Array<AiDocumentType | { documentType: AiDocumentType; status: string }>) || [];
  
  const blocks: StructuredDocumentBlock[] = [
    {
      type: "paragraph",
      content: "This Information Security Policy is supported by the following policies and procedures:"
    }
  ];

  if (frameworkDocs.length > 0) {
    blocks.push({
      type: "bullet_list",
      items: frameworkDocs.map((entry) => {
        const docType = (typeof entry === "string" ? entry : entry.documentType) as keyof typeof AI_DOCUMENT_LABELS;
        const status = typeof entry === "string" ? "Available" : entry.status.replaceAll("_", " ");
        return `${AI_DOCUMENT_LABELS[docType] || docType} (${status})`;
      })
    });
  } else {
    blocks.push({
      type: "paragraph",
      content: "No additional framework documents are currently recorded in the approved document registry."
    });
  }

  return blocks;
}

function buildApproval(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  const inputs = req.resolvedInputs || {};
  const approver = (inputs.approver as string) || "to be defined";
  const effectiveDate = "to be defined";

  return [
    {
      type: "table",
      headers: ["Role", "Name", "Date", "Signature"],
      rows: [
        ["Approver", approver, effectiveDate, ""]
      ]
    }
  ];
}

function buildReviewAndContinualImprovement(req: AiDocumentGenerationRequest): StructuredDocumentBlock[] {
  const inputs = req.resolvedInputs || {};
  const reviewPlan = inputs.review_plan;
  const reviewFreq = typeof reviewPlan === "string" ? reviewPlan : (reviewPlan as Record<string, string> | undefined)?.frequency || "to be defined";
  const reviewText = reviewFreq === "to be defined"
    ? "The review frequency for this policy is to be defined. The policy shall also be reviewed following significant changes to the organization's environment, legal obligations, or technical infrastructure to ensure its continuing suitability, adequacy, and effectiveness."
    : `This Information Security Policy shall be reviewed at least ${reviewFreq} or following any significant changes to the organization's environment, legal obligations, or technical infrastructure to ensure its continuing suitability, adequacy, and effectiveness.`;

  return [
    {
      type: "paragraph",
      content: reviewText
    }
  ];
}

