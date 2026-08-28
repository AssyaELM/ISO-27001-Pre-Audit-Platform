import type { AiDocumentGenerationResponse } from "../providers/types.ts";
import { getAiDocumentTemplateSpec, type SupportedAiDocumentType } from "./catalog.ts";
import { validateStructuredDocumentResponse, type StructuredDocument } from "./generation-schema.ts";
import { ValidatedDraftPersistenceError, type DraftPersistenceClient, type PersistedAiDocumentDraft } from "./validated-draft-persistence.ts";

export type CommonGenerationContext = { templateVersion: string; mappingVersion: string; generationContractVersion: string; sectionReadiness: Record<string,"ready"|"partial"|"blocked">; prohibitedInferences: readonly string[]; currentFacts?: readonly { implementationState?: string }[] };
// Global Write Gate: only catches vendor/product names that have no place in a generic ISO 27001 policy draft.
// Frequency words (annual, monthly, etc.) and role acronyms (CISO, MFA, etc.) are standard policy vocabulary
// and are intentionally NOT in this list. Per-document prohibitedInferences handle document-specific constraints.
const forbidden = /\b(SIEM|CMDB|Jira|ServiceNow|sk-or-v1-|PAM\/JIT)\b/i;
const secret = /sk-or-v1-|Bearer\s+/i;
export function validateCommonDraftForPersistence(documentType: SupportedAiDocumentType, context: CommonGenerationContext, response: AiDocumentGenerationResponse): StructuredDocument {
  if (response.status!=="completed"||response.httpStatus!==200) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED","Provider response did not complete successfully.");
  try {
    const spec=getAiDocumentTemplateSpec(documentType); const document=validateStructuredDocumentResponse(spec,"en",spec.label,context.sectionReadiness,response.structuredOutput);
    const text=document.sections.map(s => {
      if (s.blocks) {
        return s.blocks.map(b => {
          if (b.type === "paragraph" || b.type === "heading") return b.content;
          if (b.type === "bullet_list" || b.type === "numbered_list") return b.items.join("\n");
          if (b.type === "table") return [b.headers.join(" "), ...b.rows.map(r => r.join(" "))].join("\n");
          return "";
        }).join("\n");
      }
      return s.content || "";
    }).join("\n");
    const genericMatch=forbidden.exec(text)?.[0]; const specific=context.prohibitedInferences.find(value=>new RegExp(`\\b${value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i').test(text));
    if(secret.test(text)||genericMatch||specific) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED",`Generated draft failed mandatory anti-hallucination validation: ${genericMatch??specific??"secret-like value"}.`);
    if (context.currentFacts?.some(f=>f.implementationState==="absent"||f.implementationState==="partial") && /organization (currently )?(has|have|is|are) (implemented|established|in place)/i.test(text)) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED","Generated draft failed facts/intent validation.");
    return document;
  } catch(error) { if(error instanceof ValidatedDraftPersistenceError) throw error; throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED","Generated draft failed mandatory schema validation."); }
}
export async function persistValidatedAiDocumentDraft(input:{client:DraftPersistenceClient;workspaceId:string;documentType:SupportedAiDocumentType;idempotencyKey:string;context:CommonGenerationContext;providerResponse:AiDocumentGenerationResponse}):Promise<PersistedAiDocumentDraft>{
  const document=validateCommonDraftForPersistence(input.documentType,input.context,input.providerResponse);
  const result=await input.client.rpc("create_validated_ai_document_draft" as never,{p_workspace_id:input.workspaceId,p_document_type:input.documentType,p_language:document.language,p_title:document.title,p_document_content:document,p_template_version:input.context.templateVersion,p_mapping_version:input.context.mappingVersion,p_generation_contract_version:input.context.generationContractVersion,p_provider:input.providerResponse.provider,p_provider_model:input.providerResponse.model,p_provider_request_id:input.providerResponse.requestId??"",p_provider_usage:input.providerResponse.usage??null,p_idempotency_key:input.idempotencyKey});
  if(result.error||!result.data) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_PERSISTENCE_FAILED","Validated draft could not be persisted."); return result.data;
}
