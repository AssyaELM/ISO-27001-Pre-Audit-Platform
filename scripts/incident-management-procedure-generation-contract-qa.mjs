import assert from "node:assert/strict";
import { INCIDENT_MANAGEMENT_PROCEDURE_SPEC } from "../lib/ai-documents/incident-management-procedure.ts";
import { INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING } from "../lib/ai-documents/incident-management-procedure-assessment-mapping.ts";
import { prepareIncidentManagementProcedureGenerationContext } from "../lib/ai-documents/incident-management-procedure-generation-contract.ts";

const empty = prepareIncidentManagementProcedureGenerationContext({ assessment: { responses: [] } });
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.length, 82);
assert.equal(empty.documentType, INCIDENT_MANAGEMENT_PROCEDURE_SPEC.documentType);
assert.equal(empty.sectionReadiness && Object.keys(empty.sectionReadiness).length, 18);
assert.deepEqual(empty.missingInputs.map((item) => item.key), ["organization_name", "classification", "approved_by", "review_date"]);
assert.equal(empty.currentFacts.length, 0);
assert.equal(empty.sourceTrace.some((item) => item.controlId?.startsWith("a7-")), false);

const hidden = prepareIncidentManagementProcedureGenerationContext({
  assessment: {
    organizationalContext: { hasMandatoryAuthorityNotificationObligations: "no", usesExternalIncidentResponseProvider: "no" },
    responses: [
      { theme: "organizational", controlId: "a5-5", questionId: "p5_5_004_deadlines", answer: "implemented" },
      { theme: "organizational", controlId: "a5-24", questionId: "p5_24_004_external_ir", answer: "implemented" },
      { theme: "physical", controlId: "a7-1", questionId: "p7_1_001", answer: "implemented" },
      { theme: "organizational", controlId: "a5-1", questionId: "p5_1_001", answer: "implemented" },
    ],
  },
});
assert.equal(hidden.currentFacts.length, 0, "hidden, Physical, and non-mapped answers are excluded");
assert.equal(hidden.knownContext.notificationObligationsExist, false);

const complete = prepareIncidentManagementProcedureGenerationContext({
  workspace: { organizationName: "NormCore Test" },
  documentSetup: { classification: "Internal", approved_by: "owner-1", review_date: "2027-01-01", reporting_channels: "known-channel", external_notification_requirements: "known-requirement" },
  assessment: { organizationalContext: { hasMandatoryAuthorityNotificationObligations: "yes", usesExternalIncidentResponseProvider: "yes" }, responses: [
    { theme: "organizational", controlId: "a5-24", questionId: "p5_24_001", answer: "implemented" },
    { theme: "organizational", controlId: "a5-24", questionId: "p5_24_002", answer: "partially_implemented" },
    { theme: "organizational", controlId: "a5-24", questionId: "p5_24_003", answer: "not_implemented" },
    { theme: "organizational", controlId: "a5-25", questionId: "p5_25_001", answer: "not_sure" },
    { theme: "organizational", controlId: "a5-24", questionId: "p5_24_004_external_ir", answer: "not_applicable", justification: "Not used." },
  ] },
});
const fact = (id) => complete.currentFacts.find((item) => item.source.sourceId === id);
assert.equal(fact("p5_24_001")?.implementationState, "implemented");
assert.equal(fact("p5_24_002")?.implementationState, "partial");
assert.equal(fact("p5_24_003")?.implementationState, "absent");
assert.equal(fact("p5_25_001")?.implementationState, "uncertain");
assert.equal(fact("p5_24_004_external_ir")?.implementationState, "not_applicable");
assert.equal(complete.missingInputs.length, 0, "known required inputs are never requested again");
assert.equal(complete.eventModel.reportedEventIsNotConfirmedIncident, true);
assert.equal(complete.knownContext.notificationObligationsExist, true);
assert.equal(complete.knownContext.knownNotificationRequirements, "known-requirement");
assert.equal(complete.knownContext.reportingChannels, "known-channel");
assert.equal(complete.sectionReadiness.document_control, "ready");
assert.equal(complete.sectionReadiness.procedure_review_and_approval, "ready");
assert.equal(complete.sectionReadiness.classification_severity_and_prioritization !== "blocked", true, "optional severity model does not block");
assert.equal(complete.prohibitedInferences.includes("RTO"), true);
assert.equal(complete.prohibitedInferences.includes("SIEM"), true);
assert.equal(complete.prohibitedInferences.includes("response times"), true);
assert.equal(complete.prohibitedInferences.includes("forensic tool"), true);
assert.equal(JSON.stringify(complete).includes("password"), false);
assert.equal(JSON.stringify(complete).includes("access_token"), false);
assert.deepEqual(complete.procedureIntent, { mayDefineNormativeRequirementsLater: true, currentStateIsNotProcedureStatement: true });
assert.equal(complete.generationSnapshot.generatedAt, null);
assert.equal(complete.sourceTrace.length >= complete.currentFacts.length, true);

const priorityConflict = prepareIncidentManagementProcedureGenerationContext({
  documentSetup: { classification: "Public" },
  evidenceMetadata: [{ id: "evidence-1", documentType: "incident_management_procedure", classification: "Internal" }],
  assessment: { responses: [] },
});
assert.equal(priorityConflict.knownInputs.classification, "Internal");
assert.equal(priorityConflict.conflicts.find((item) => item.key === "classification")?.resolution, "resolved_by_source_priority");
const unresolvedConflict = prepareIncidentManagementProcedureGenerationContext({
  evidenceMetadata: [
    { id: "evidence-1", documentType: "incident_management_procedure", classification: "Internal" },
    { id: "evidence-2", documentType: "incident_management_procedure", classification: "Restricted" },
  ], assessment: { responses: [] },
});
assert.equal(unresolvedConflict.conflicts.find((item) => item.key === "classification")?.resolution, "unresolved");
assert.equal(unresolvedConflict.missingInputs.find((item) => item.key === "classification")?.reason, "Conflicting explicit sources require resolution.");
assert.deepEqual(prepareIncidentManagementProcedureGenerationContext({ assessment: { responses: [] } }), empty, "same input is deterministic");
console.log("INCIDENT MANAGEMENT PROCEDURE GENERATION CONTRACT QA: PASS");
