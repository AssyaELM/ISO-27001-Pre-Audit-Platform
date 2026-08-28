import assert from "node:assert/strict";
import {
  prepareIncidentManagementProcedureGenerationContext,
  validateIncidentManagementProcedureGenerationContextCore,
} from "../lib/ai-documents/incident-management-procedure-generation-contract.ts";
import { INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING } from "../lib/ai-documents/incident-management-procedure-assessment-mapping.ts";

assert.deepEqual(validateIncidentManagementProcedureGenerationContextCore(), []);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.length, 82);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.some((item) => item.theme === "physical"), false);

const context = prepareIncidentManagementProcedureGenerationContext({
  assessment: {
    organizationalContext: { hasMandatoryAuthorityNotificationObligations: "no" },
    peopleContext: { hasRelevantExternalParties: "no" },
    technologicalContext: { persisted: { usesCloudHostedCriticalDataOrSystems: "no" } },
    responses: [
      { theme: "organizational", controlId: "a5-24", questionId: "p5_24_001", answer: "implemented" },
      { theme: "organizational", controlId: "a5-24", questionId: "p5_24_002", answer: "partially_implemented" },
      { theme: "organizational", controlId: "a5-24", questionId: "p5_24_003", answer: "not_implemented" },
      { theme: "organizational", controlId: "a5-25", questionId: "p5_25_001", answer: "not_sure" },
      { theme: "organizational", controlId: "a5-5", questionId: "p5_5_004_deadlines", answer: "implemented" },
      { theme: "technological", controlId: "a8-13", questionId: "p8_13_004_cloud", answer: "implemented" },
      { theme: "organizational", controlId: "a5-24", questionId: "p5_24_004_external_ir", answer: "not_applicable" },
    ],
  },
});

const fact = (id) => context.currentFacts.find((item) => item.source.sourceId === id);
assert.equal(fact("p5_24_001")?.implementationState, "implemented");
assert.equal(fact("p5_24_002")?.implementationState, "partial");
assert.equal(fact("p5_24_003")?.implementationState, "absent");
assert.equal(fact("p5_25_001")?.implementationState, "uncertain");
assert.equal(fact("p5_5_004_deadlines"), undefined, "hidden persisted conditional must be excluded");
assert.equal(fact("p8_13_004_cloud"), undefined, "hidden technological conditional must be excluded");
assert.equal(fact("p5_24_004_external_ir"), undefined, "N/A without justification must be excluded");
assert.equal(context.eventModel.reportedEventIsNotConfirmedIncident, true);
assert.deepEqual(context.procedureIntent, { mayDefineNormativeRequirementsLater: true, currentStateIsNotProcedureStatement: true });
assert.equal(context.knownContext.reportingChannels, "unknown");
assert.equal(context.knownContext.knownNotificationRequirements, "unknown");
assert.equal(context.prohibitedInferences.includes("RTO"), true);
assert.equal(context.prohibitedInferences.includes("forensic tool"), true);
assert.equal(context.sourceTrace.length >= context.currentFacts.length, true);
assert.equal(JSON.stringify(context).includes("password"), false);

const applicableNa = prepareIncidentManagementProcedureGenerationContext({
  assessment: { organizationalContext: { usesExternalIncidentResponseProvider: "yes" }, responses: [
    { theme: "organizational", controlId: "a5-24", questionId: "p5_24_004_external_ir", answer: "not_applicable", justification: "No external provider is used for this procedure scope." },
  ] },
});
assert.equal(applicableNa.currentFacts[0]?.implementationState, "not_applicable");
const notificationContext = prepareIncidentManagementProcedureGenerationContext({
  assessment: { organizationalContext: { hasMandatoryAuthorityNotificationObligations: "yes" }, responses: [] },
});
assert.equal(notificationContext.knownContext.notificationObligationsExist, true);
assert.equal(notificationContext.knownContext.knownNotificationRequirements, "unknown");
console.log("INCIDENT MANAGEMENT PROCEDURE GENERATION CONTEXT CORE QA: PASS");
