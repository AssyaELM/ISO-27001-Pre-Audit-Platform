import { AiProviderError, type AiDocumentGenerationRequest, type AiDocumentGenerationResponse } from "./types.ts";
import { OpenRouterAiDocumentProvider } from "./openrouter.ts";

export type OpenRouterJsonRecoveryResult = {
  response: AiDocumentGenerationResponse;
  initialRequestStatus: 200;
  repairAttempted: boolean;
  repairStatus: "not_needed" | "completed";
  initialRequestId?: string;
  initialDiagnostics: { choicesCount: number; modelReturned: boolean; contentPresent: boolean; contentLength: number; reasoningPresent: boolean };
};

const expectedSchema = (request: AiDocumentGenerationRequest) => ({
  documentType: request.documentType,
  language: request.language,
  title: request.documentTitle,
  sections: request.sections.map((section) => ({ sectionId: section.sectionId, title: section.title, status: section.expectedStatus, content: "string" })),
});

export async function generateWithSingleJsonRepair(provider: OpenRouterAiDocumentProvider, request: AiDocumentGenerationRequest): Promise<OpenRouterJsonRecoveryResult> {
  const initial = await provider.generateRawStructuredDocument(request);
  if (!initial.content.trim()) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider response does not contain structured output.", initial.httpStatus);
  try {
    return { response: provider.parseRawStructuredDocument(initial), initialRequestStatus: initial.httpStatus, repairAttempted: false, repairStatus: "not_needed", initialRequestId: initial.requestId, initialDiagnostics: initial.diagnostics };
  } catch (error) {
    if (!(error instanceof AiProviderError) || error.code !== "AI_PROVIDER_BAD_RESPONSE") throw error;
    const response = await provider.repairStructuredDocumentJson({ previousResponse: initial.content, expectedSchema: request.providerOptions?.responseSchema ?? expectedSchema(request) });
    return { response, initialRequestStatus: initial.httpStatus, repairAttempted: true, repairStatus: "completed", initialRequestId: initial.requestId, initialDiagnostics: initial.diagnostics };
  }
}
