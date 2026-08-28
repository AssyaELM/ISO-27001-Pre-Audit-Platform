import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { AiProviderError, OpenRouterAiDocumentProvider, getOpenRouterConfig, generateWithSingleJsonRepair, probeOpenRouterStructuredCapability, decideOpenRouterCapabilityProbe, OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS } from "../lib/ai/providers/index.ts";
import { AI_DOCUMENT_TEMPLATE_SPECS } from "../lib/ai/documents/catalog.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { buildStructuredDocumentJsonSchema } from "../lib/ai/documents/generation-schema.ts";
import { persistValidatedAiDocumentDraft } from "../lib/ai/documents/common-validated-draft-persistence.ts";
import { prepareAccessControlPolicyGenerationContext } from "../lib/ai-documents/access-control-policy-generation-contract.ts";
import { prepareIncidentManagementProcedureGenerationContext } from "../lib/ai-documents/incident-management-procedure-generation-contract.ts";
import { prepareBackupAndRecoveryPolicyGenerationContext } from "../lib/ai-documents/backup-and-recovery-policy-generation-contract.ts";
import { prepareInformationAssetManagementPolicyGenerationContext } from "../lib/ai-documents/information-asset-management-policy-generation-contract.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
for(const [filename,override] of [[".env.local",false],[".env.assessment-test.local",true]]){const file=path.join(root,filename);if(fs.existsSync(file))for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){const m=line.match(/^([^#=]+)=(.*)$/);if(m&&(override||process.env[m[1].trim()]===undefined))process.env[m[1].trim()]=m[2].trim().replace(/^['"]|['"]$/g,"");}}
const env={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service:process.env.SUPABASE_SERVICE_ROLE_KEY,emailA:process.env.TEST_USER_A_EMAIL,passwordA:process.env.TEST_USER_A_PASSWORD,workspaceA:process.env.TEST_WORKSPACE_A_ID};
if(Object.values(env).some(v=>!v)){console.log("NOT VERIFIED — multi-type authenticated test environment is incomplete.");process.exit(0);}
const model="nvidia/nemotron-3-super-120b-a12b:free";
const config=getOpenRouterConfig();assert.equal(config.model,model);
const auth=async()=>{const r=await fetch(`${env.url}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:env.key,"Content-Type":"application/json"},body:JSON.stringify({email:env.emailA,password:env.passwordA})});const d=await r.json();assert.equal(r.status,200);return {userId:d.user.id,client:createClient(env.url,env.key,{global:{headers:{Authorization:`Bearer ${d.access_token}`}},auth:{persistSession:false,autoRefreshToken:false}})}};
const setup={document_classification:"Organization-defined classification",classification:"Organization-defined classification",approver:"authorized approval role",approved_by:"authorized approval role",policy_owner:"designated policy owner",review_plan:"approved review triggers",review_date:"approved review triggers",security_objectives:["organization-defined objectives"],security_roles:["designated responsibilities"],legal_requirements:["confirmed requirements"]};
const contexts={
 access_control_policy:()=>prepareAccessControlPolicyGenerationContext({workspace:{organizationName:"Example Organization",scope:"Controlled test scope"},documentSetup:setup,assessment:{responses:[]}}),
 incident_management_procedure:()=>prepareIncidentManagementProcedureGenerationContext({workspace:{organizationName:"Example Organization"},documentSetup:setup,assessment:{responses:[]}}),
 backup_and_recovery_policy:()=>prepareBackupAndRecoveryPolicyGenerationContext({workspace:{organizationName:"Example Organization"},documentSetup:setup,assessment:{responses:[]}}),
 information_asset_management_policy:()=>prepareInformationAssetManagementPolicyGenerationContext({workspace:{organizationName:"Example Organization"},documentSetup:setup,assessment:{responses:[]}}),
};
const a=await auth(); const admin=createClient(env.url,env.service,{auth:{persistSession:false,autoRefreshToken:false}}); const ids=[];
try{
 const cachePath=path.join(root,"tmp","openrouter-structured-capability-cache.json");let cache;try{cache=JSON.parse(fs.readFileSync(cachePath,"utf8"));}catch{}
 let state="PASS";try{await probeOpenRouterStructuredCapability(new OpenRouterAiDocumentProvider({config,timeoutMs:OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS}));}catch(error){state=error instanceof AiProviderError&&error.code==="AI_PROVIDER_TIMEOUT"?"TIMEOUT":"FAIL";}
 const decision=decideOpenRouterCapabilityProbe({model,now:Date.now(),state,cache}); if(!decision.allowGeneration){console.log(`NOT VERIFIED — probe ${state.toLowerCase()} without a matching cache; zero DB writes`);process.exit(0);}
 const requestedType=process.env.TEST_AI_DOCUMENT_TYPE;
 const documentTypes=requestedType?[requestedType]:Object.keys(contexts);
 if(requestedType&&!contexts[requestedType])throw new Error("Unsupported TEST_AI_DOCUMENT_TYPE");
 for(const documentType of documentTypes){
   const context=contexts[documentType](); const spec=AI_DOCUMENT_TEMPLATE_SPECS[documentType];
   const semanticFacts={}; for(const fact of context.currentFacts??[])for(const section of fact.policySections??fact.procedureSections??[])(semanticFacts[section]??=[]).push({capability:fact.capability,implementationState:fact.implementationState});
   const {request}=buildCommonDocumentGenerationRequest({documentType,templateVersion:context.templateVersion,mappingVersion:context.mappingVersion,generationContractVersion:context.generationContractVersion,documentTitle:spec.label,language:"en",semanticFacts,policyIntent:Object.fromEntries(spec.sections.map(s=>[s.id,{useNormativePolicyLanguage:true,currentFactsAreNotPolicyClaims:true}])),resolvedInputs:context.knownInputs??{organization_name:context.organization?.name,...setup},sectionReadiness:context.sectionReadiness,generationConstraints:[`Return the exact ${spec.sections.length} sections in canonical order.`,`Use concise policy language; do not make current-state claims.`,`Never mention these forbidden terms or values: ${[...spec.forbiddenInferences,"CISO","CIO","CTO","DPO","SOC","CSIRT","MFA","VPN","PAM","JIT","RBAC","SIEM","RPO","RTO","GFS","3-2-1","AES","TLS","CMDB","Jira","ServiceNow","MDM","remote wipe","annual","quarterly","daily","weekly","monthly","sanction"].join("; ")}.`]});
   const response=(await generateWithSingleJsonRepair(new OpenRouterAiDocumentProvider({config,timeoutMs:180000}),{...request,providerOptions:{responseSchema:buildStructuredDocumentJsonSchema(spec,"en",spec.label,context.sectionReadiness),maxOutputTokens:4096}})).response;
   const created=await persistValidatedAiDocumentDraft({client:a.client,workspaceId:env.workspaceA,documentType,idempotencyKey:`ai6-${documentType}-${Date.now().toString(36)}`,context,providerResponse:response});ids.push(created.id);
   const reread=await a.client.from("ai_documents").select("*").eq("id",created.id).single();assert.equal(reread.error,null);assert.deepEqual(reread.data.document_content,created.document_content);assert.equal(reread.data.provider_model,model);assert.equal(reread.data.document_content.sections.length,spec.sections.length);console.log(`PASS ${documentType} version=${created.version} sections=${spec.sections.length} model=${created.provider_model}`);
 }
}finally{if(ids.length)await admin.from("ai_documents").delete().in("id",ids);await a.client.auth.signOut();}
