import assert from "node:assert/strict";
import { AiProviderError, validateOpenRouterSmokeStructuredOutput } from "../lib/ai/providers/index.ts";

const valid = { documentType: "test_document", sections: [{ sectionId: "purpose", content: "A concise test purpose." }] };
assert.deepEqual(validateOpenRouterSmokeStructuredOutput(valid), valid);
for (const invalid of ["text", null, {}, { documentType: "test_document", sections: [] }, { documentType: "test_document", sections: [{ sectionId: "purpose", content: "" }] }, { documentType: "", sections: valid.sections }]) {
  assert.throws(() => validateOpenRouterSmokeStructuredOutput(invalid), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_BAD_RESPONSE");
}
console.log("OPENROUTER STRUCTURED OUTPUT QA: PASS");
