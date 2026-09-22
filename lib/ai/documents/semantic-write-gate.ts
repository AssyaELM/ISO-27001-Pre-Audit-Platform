import { AiProviderError } from "../providers/types";
import { StructuredDocumentBlock } from "./generation-schema";

export function validateSemanticWriteGate(blocks: StructuredDocumentBlock[], resolvedInputs: Record<string, unknown>) {
  const content = blocks.map(b => {
    if (b.type === "paragraph" || b.type === "heading") return b.content;
    if (b.type === "bullet_list" || b.type === "numbered_list") return b.items.join("\n");
    if (b.type === "table") return b.headers.join(" ") + "\n" + b.rows.map(r => r.join(" ")).join("\n");
    return "";
  }).join("\n");

  const knownText = JSON.stringify(resolvedInputs).toLowerCase();

  const extractors = [
    {
      name: "classification",
      extract: (text: string) => {
        const matches: string[] = [];
        const assignRegex = /\b(classification|confidentiality|integrity|availability|data|asset|information|document)[\s\S]{0,40}?(?:is|are|:|\||-)\s*(High|Medium|Low|Critical|Confidential|Internal|Public|Restricted|Secret)\b/gi;
        let m;
        while ((m = assignRegex.exec(text)) !== null) matches.push(m[2]);
        const tableRegex = /\|\s*(High|Medium|Low|Critical|Confidential|Internal|Public|Restricted|Secret)\s*(?=\|)/gi;
        while ((m = tableRegex.exec(text)) !== null) matches.push(m[1]);
        return matches;
      }
    },
    {
      name: "frequency",
      extract: (text: string) => {
        const matches: string[] = [];
        const freqRegex = /\b(annually|monthly|quarterly|weekly|daily|every \d+ (?:months|days|years|weeks))\b/gi;
        let m;
        while ((m = freqRegex.exec(text)) !== null) matches.push(m[1]);
        return matches;
      }
    },
    {
      name: "duration/threshold",
      extract: (text: string) => {
        const matches: string[] = [];
        const durationRegex = /\b(\d+ (?:months|days|years|weeks|hours|minutes))\b/gi;
        let m;
        while ((m = durationRegex.exec(text)) !== null) matches.push(m[1]);
        return matches;
      }
    },
    {
      name: "vendor/tool",
      extract: (text: string) => {
        const matches: string[] = [];
        // Product/vendor names are proper nouns. Keep the check case-sensitive
        // so ordinary policy language such as "designated teams" is not
        // misclassified as Microsoft Teams.
        const vendorRegex = /\b(AWS|Azure|Google Cloud|GCP|Jira|ServiceNow|Confluence|Okta|Active Directory|Slack|Teams)\b/g;
        let m;
        while ((m = vendorRegex.exec(text)) !== null) matches.push(m[1]);
        return matches;
      }
    },
    {
      name: "identity/role",
      extract: (text: string) => {
        const matches: string[] = [];
        const identityRegex = /\b(CEO|CFO|CISO|CTO|DPO)\b/gi;
        let m;
        while ((m = identityRegex.exec(text)) !== null) matches.push(m[1]);
        return matches;
      }
    }
  ];

  for (const extractor of extractors) {
    const findings = extractor.extract(content);
    for (const match of findings) {
      if (!knownText.includes(match.toLowerCase())) {
        throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Write Gate blocked invented ${extractor.name}: ${match}`);
      }
    }
  }
}

export function validateContextLeakage(blocks: StructuredDocumentBlock[], semanticFacts: unknown[]) {
  const content = blocks.map(b => {
    if (b.type === 'paragraph' || b.type === 'heading') return b.content;
    if (b.type === 'bullet_list' || b.type === 'numbered_list') return b.items.join('\n');
    if (b.type === 'table') return b.headers.join(' ') + '\n' + b.rows.map(r => r.join(' ')).join('\n');
    return '';
  }).join('\n').toLowerCase();

  const idRegexes = [
    /\b[po]\d+(?:[_-]\d+){1,3}\b/gi,
    /\b[a-z]\.\d+(?:\.\d+){1,3}\b/gi,
    /\b[a-z]\d+(?:[._-]\d+){1,3}\b/gi,
    /\b(?:control|question|theme|assessment)[_-][a-z0-9]+(?:[_-][a-z0-9]+)*\b/gi,
    /\b(?:control|question)\s+id\s*[:#-]?\s*[a-z0-9._-]+\b/gi,
  ];
  for (const idRegex of idRegexes) {
    const match = idRegex.exec(content);
    if (match) {
      throw new AiProviderError('AI_PROVIDER_BAD_RESPONSE', `Leakage blocked: Document contains raw technical ID '${match[0]}'`);
    }
  }

  if (!semanticFacts || !Array.isArray(semanticFacts)) return;

  for (const fact of semanticFacts) {
    const f = fact as Record<string, unknown>;
    if (f.details && typeof f.details === 'string') {
      const verbatim = f.details.toLowerCase().trim();
      if (verbatim.length > 20 && content.includes(verbatim)) {
        throw new AiProviderError('AI_PROVIDER_BAD_RESPONSE', 'Leakage blocked: Document contains verbatim copy of assessment answer');
      }
    }
  }
}
