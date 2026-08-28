import { StructuredDocumentBlock } from "./generation-schema";
import { AiDocumentGenerationRequest, AiDocumentGenerationSection } from "../providers/types";
import { AI_DOCUMENT_LABELS, AiDocumentType } from "../../ai-documents/registry";

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

  throw new Error(`Unhandled deterministic section: ${sectionReq.sectionId} for document type: ${request.documentType}`);
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
        const docType = typeof entry === "string" ? entry : entry.documentType;
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

