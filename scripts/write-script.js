const fs = require('fs');
const content = \import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { getAiDocumentTemplateSpec } from '../lib/ai/documents/catalog';
import { buildAiDocumentsRegistry } from '../lib/ai-documents/registry';
import { prepareGenerationContext, workspaceGenerationInput, normalizeContext } from '../app/api/ai-documents/context';
import { buildCommonDocumentGenerationRequest } from '../lib/ai/documents/request-builder';
import { getAiDocumentProvider } from '../lib/ai/providers/index';
import { validateSectionStructuredDocumentResponse, buildSectionStructuredDocumentJsonSchema } from '../lib/ai/documents/generation-schema';
import { hydrateNonGeneratedSection } from '../lib/ai/documents/section-hydrator';
import { validateSemanticWriteGate } from '../lib/ai/documents/semantic-write-gate';
import { persistValidatedAiDocumentDraft } from '../lib/ai/documents/common-validated-draft-persistence';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const documentType = 'information_security_policy';
  console.log('=== Step 1: Workspace ===');
  console.log('Workspace ID:', workspaceId);
  console.log('Document Type:', documentType);
  
  const { data: latest } = await supabase.from('ai_documents_registry').select('id, version').eq('workspace_id', workspaceId).eq('document_type', documentType).order('created_at', { ascending: false }).limit(1);
  console.log('Existing latest version:', latest[0]);
  
  console.log('\\n=== Step 2: Context ===');
  const user = { id: 'admin' };
  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from('evidence_items').select('*').eq('workspace_id', workspaceId),
    supabase.from('ai_documents').select('*').eq('workspace_id', workspaceId),
    supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId)
  ]);
  
  const registry = buildAiDocumentsRegistry(evidence.data as any[], aiDocuments.data as any[]);
  const context = prepareGenerationContext(documentType, workspaceGenerationInput(user, responses.data as never[], registry, {}));
  const raw = context as any;
  const knownInputs = raw.knownInputs ?? {};
  
  console.log('Resolved Inputs:');
  const checks = [
    'organization_name', 'policy_owner', 'approver', 'review_plan', 
    'document_classification', 'security_objectives', 'legal_requirements', 
    'asset_classifications'
  ];
  
  for (const k of checks) {
    const v = knownInputs[k];
    if (v === undefined || v === null || v === '') console.log(k, '-> MISSING');
    else console.log(k, '-> known');
  }
  
  const spec = getAiDocumentTemplateSpec(documentType);
  const preparation = normalizeContext(context);
  
  const generationReq = buildCommonDocumentGenerationRequest({ 
    documentType, 
    templateVersion: String(raw.templateVersion ?? raw.template?.version), 
    mappingVersion: String(raw.mappingVersion ?? raw.generationContract?.mappingVersion), 
    generationContractVersion: String(raw.generationContractVersion ?? raw.generationContract?.version), 
    documentTitle: spec.label, 
    language: 'en', 
    semanticFacts: raw.semanticFacts ?? {}, 
    policyIntent: Object.fromEntries(spec.sections.map(s => [s.id, { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true }])), 
    resolvedInputs: knownInputs, 
    sectionReadiness: preparation.sectionReadiness, 
    generationConstraints: [] 
  });
  
  console.log('\\n=== Step 3 & 4: Generation ===');
  const provider = getAiDocumentProvider();
  console.log('Provider:', provider.id);
  
  const assembledSections = [];
  let groqCalls = 0;
  let totalRetries = 0;
  let generatedSections = 0;
  
  for (const sectionReq of generationReq.request.sections) {
    if (sectionReq.expectedStatus !== 'generated') {
      assembledSections.push({
        sectionId: sectionReq.sectionId,
        title: sectionReq.title,
        status: sectionReq.expectedStatus,
        content: '',
        blocks: hydrateNonGeneratedSection(generationReq.request as any, sectionReq as any)
      });
      continue;
    }
    
    generatedSections++;
    let success = false;
    let retries = 0;
    let validatedBlocks = [];
    const responseSchema = buildSectionStructuredDocumentJsonSchema();
    
    while (!success && retries < 3) {
      try {
        groqCalls++;
        console.log(\Generating section \ (Attempt \)...\);
        const response = await provider.generateStructuredDocument({
          documentType: generationReq.request.documentType,
          templateVersion: generationReq.request.templateVersion,
          documentTitle: generationReq.request.documentTitle,
          language: generationReq.request.language,
          policyIntent: generationReq.request.policyIntent[sectionReq.sectionId],
          resolvedInputs: generationReq.request.resolvedInputs,
          semanticFacts: generationReq.request.semanticFacts,
          section: sectionReq,
          providerOptions: { responseSchema, maxOutputTokens: 2048 }
        });
        
        validatedBlocks = validateSectionStructuredDocumentResponse(response.structuredOutput);
        
        // Structural validation
        const structureSpec = spec.sections.find(s => s.id === sectionReq.sectionId)?.structure;
        if (structureSpec && structureSpec.minBlocks && validatedBlocks.length < structureSpec.minBlocks) {
           throw new Error('Too few blocks');
        }
        
        validateSemanticWriteGate(validatedBlocks, generationReq.request.resolvedInputs);
        success = true;
        console.log(\  -> \ PASS (\ blocks)\);
      } catch (e) {
        retries++;
        totalRetries++;
        console.warn(\  -> FAIL (\)\);
      }
    }
    if (!success) {
      console.warn(\Generation failed for \ after 3 attempts\);
      process.exit(1);
    }
    
    assembledSections.push({
      sectionId: sectionReq.sectionId,
      title: sectionReq.title,
      status: 'generated',
      content: '',
      blocks: validatedBlocks
    });
    
    // Rate limit
    await new Promise(r => setTimeout(r, 2500));
  }
  
  console.log('\\n=== Step 5: Hydrated Sections ===');
  for (const s of assembledSections) {
    if (s.status !== 'generated') {
      console.log(s.sectionId);
      console.log('  -> ' + s.blocks.map(b => b.type).join(' + '));
      const str = JSON.stringify(s.blocks);
      if (str.includes('to be defined')) console.log('  -> contains "to be defined"');
    }
  }
  
  console.log('\\n=== Step 6: Semantic Write Gate Final ===');
  const fullBlocks = assembledSections.flatMap(s => s.blocks);
  try {
    validateSemanticWriteGate(fullBlocks, knownInputs);
    console.log('Write Gate PASS: unsourced concrete claims blocked, sourced allowed.');
  } catch (e) {
    console.error('Write Gate FAIL:', e.message);
    process.exit(1);
  }
  
  console.log('\\n=== Step 7: Persistence ===');
  const finalStructuredOutput = {
    documentType: spec.documentType,
    language: 'en',
    title: spec.label,
    sections: assembledSections
  };
  
  try {
    const saved = await persistValidatedAiDocumentDraft({
      client: supabase as any,
      workspaceId,
      documentType,
      idempotencyKey: 'ui-live-test-' + Date.now(),
      context: context as any,
      draft: finalStructuredOutput
    });
    console.log('Persistence PASS. New ID:', saved.id, 'Version:', saved.version);
    
    console.log('\\n=== Step 8: Registry Read-back ===');
    const { data: readback } = await supabase.from('ai_documents_registry').select('*').eq('id', saved.id).single();
    if (readback) {
      console.log('Registry Read-back PASS');
      const doc = readback.active_document;
      const bTypes = {};
      let bCount = 0;
      for (const s of doc.sections) {
        if (!s.blocks) continue;
        for (const b of s.blocks) {
          bTypes[b.type] = (bTypes[b.type] || 0) + 1;
          bCount++;
        }
      }
      console.log('Sections:', doc.sections.length);
      console.log('Total blocks:', bCount);
      console.log('Block distribution:', bTypes);
      
      console.log('\\n=== Step 9: Anomaly Check ===');
      const emptyIds = ['document_control', 'information_security_principles', 'information_security_policy_framework', 'approval'];
      for (const id of emptyIds) {
        const sect = doc.sections.find(s => s.sectionId === id);
        console.log(id, 'non-empty:', !!sect.blocks?.length);
      }
      const fullContent = JSON.stringify(doc);
      console.log('no fffff:', !fullContent.includes('fffff'));
      console.log('Total Groq Calls:', groqCalls);
      console.log('Total Retries:', totalRetries);
      console.log('Generated Sections:', generatedSections);
    }
  } catch (e) {
    console.error('Persistence FAIL:', e);
  }
}
run();\
fs.writeFileSync('scripts/live-generation.ts', content);
