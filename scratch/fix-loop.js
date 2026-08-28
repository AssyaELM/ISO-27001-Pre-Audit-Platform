const fs = require('fs');
const content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf8');
const oldLoopRegex = /const semanticFacts: Record<string, unknown\[\]> = \{\};[\s\S]*?(?=\s*sourceTrace: trace)/;
const newLoop = const semanticFacts: Record<string, unknown[]> = {};
  for (const fact of currentFacts) {
    const rawResponse = (assessment as any).responses.find((r: any) => r.questionId === fact.source.sourceId);
    const isEnum = ["implemented", "partial", "absent", "uncertain", "not_applicable"].includes(rawResponse?.answer);
    let details = rawResponse?.justification?.trim() ? (isEnum ? rawResponse.justification : \\\\n\\) : (isEnum ? undefined : rawResponse?.answer);
    if (typeof details === 'string' && details.trim().length === 0) details = undefined;
    for (const section of fact.policySections) {
      if (!semanticFacts[section]) semanticFacts[section] = [];
      semanticFacts[section].push({
        questionId: fact.source.sourceId,
        controlId: fact.source.controlId,
        relevance: fact.source.relevance,
        implementationState: fact.implementationState,
        ...(details ? { details } : {})
      });
    }
  };
const newContent = content.replace(oldLoopRegex, newLoop + '\n  ');
fs.writeFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', newContent);
