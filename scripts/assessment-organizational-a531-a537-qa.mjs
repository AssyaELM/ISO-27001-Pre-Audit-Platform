import assert from "node:assert/strict";
import fs from "node:fs";

import { assessmentAnswerValues } from "../content/assessment-infrastructure.ts";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import {
  deriveOrganizationalOutcome,
  deriveOrganizationalRemediationPlan,
  resolveOrganizationalAssessmentContext,
  resolveOrganizationalControl,
} from "../lib/assessment/organizational-controls.ts";
import { POST as assessmentResponsesPost } from "../app/api/assessment/responses/route.ts";

const canonicalPath = process.env.NORMCORE_ORGANIZATIONAL_A531_A537_README
  ?? "C:/Users/HP/Downloads/README-NORMCORE-ORGANIZATIONAL-A5.31-A5.37-FINAL-CANONICAL-AUGUST-2026.md";
const readme = fs.readFileSync(canonicalPath, "utf8");

function parseReadme(source) {
  const heads = [...source.matchAll(/^# A[.]5[.](3[1-7]).*$/gm)];
  return heads.map((head, index) => {
    const number = head[1];
    const block = source.slice(head.index, heads[index + 1]?.index ?? source.indexOf("\n# 9.", head.index));
    const quickBlock = block.match(/## Quick Context\n([\s\S]*?)\n## Main assessed questions/)?.[1] ?? "";
    const quickContext = [...quickBlock.matchAll(/^### `([^`]+)`\n\*\*EN:\*\* ([\s\S]*?)\n\n\*\*FR:\*\* ([\s\S]*?)(?=\n\n### `|\s*$)/gm)]
      .map((item) => ({ key: item[1], question: { en: item[2].trim(), fr: item[3].trim() } }));
    const questionHeads = [...block.matchAll(/^### `(o5_[^`]+)`[^\n]*`([^`\n]+)`$/gm)];
    const questions = questionHeads.map((item, questionIndex) => {
      const questionBlock = block.slice(item.index, questionHeads[questionIndex + 1]?.index ?? block.length);
      const rows = [...questionBlock.matchAll(/^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)];
      const partial = rows.find((row) => row[1] === "partially_implemented");
      const absent = rows.find((row) => row[1] === "not_implemented");
      assert.ok(partial, `${item[1]}: README partial row exists`);
      assert.ok(absent, `${item[1]}: README absent row exists`);
      return {
        id: item[1],
        type: item[2],
        conditionKey: questionBlock.match(/\*\*Condition key:\*\* `([^`]+)`/)?.[1] ?? null,
        question: {
          en: questionBlock.match(/\*\*EN exact NormCore:\*\* ([\s\S]*?)\n\n\*\*FR exact NormCore:/)?.[1].trim(),
          fr: questionBlock.match(/\*\*FR exact NormCore:\*\* ([\s\S]*?)\n\n\*\*Gap family:/)?.[1].trim(),
        },
        partial: {
          gapCode: partial[2].match(/`([^`]+)`/)?.[1],
          gap: partial[3].trim(),
          remediation: partial[4].trim(),
        },
        absent: {
          gapCode: absent[2].match(/`([^`]+)`/)?.[1],
          gap: absent[3].trim(),
          remediation: absent[4].trim(),
        },
      };
    });
    const gatedQuickContext = number === "34"
      ? quickContext.map((item) => item.key === "processesPIIInScope" ? item : { ...item, conditionKey: "processesPIIInScope" })
      : quickContext;
    return { id: `a5-${number}`, code: `A.5.${number}`, quickContext: gatedQuickContext, questions };
  });
}

const expectedControls = parseReadme(readme);
const runtimeControls = organizationalControls.filter((control) => {
  const number = Number(control.id.split("-")[1]);
  return number >= 31 && number <= 37;
});

assert.deepEqual(assessmentAnswerValues, [
  "implemented",
  "partially_implemented",
  "not_implemented",
  "not_sure",
  "not_applicable",
], "exact five NormCore answers");
assert.deepEqual(runtimeControls.map((control) => control.id), expectedControls.map((control) => control.id), "A.5.31-A.5.37 exact control order");
assert.equal(runtimeControls.length, 7, "7 controls");
assert.equal(runtimeControls.flatMap((control) => control.questions).filter((item) => item.type !== "conditional").length, 21, "21 main questions");
assert.equal(runtimeControls.flatMap((control) => control.questions).filter((item) => item.type === "conditional").length, 11, "11 conditional questions");
assert.equal(runtimeControls.flatMap((control) => control.quickContext).length, 12, "12 Quick Context items");
assert.equal(runtimeControls.flatMap((control) => control.questions).length, 32, "32 maximum assessed questions");

for (const expectedControl of expectedControls) {
  const control = runtimeControls.find((item) => item.id === expectedControl.id);
  assert.ok(control, `${expectedControl.id}: runtime control exists`);
  assert.deepEqual(control.quickContext, expectedControl.quickContext, `${control.code}: exact Quick Context key/wording`);
  assert.deepEqual(
    control.questions.map((item) => ({
      id: item.id,
      type: item.type,
      conditionKey: item.conditionKey,
      question: item.question,
      partial: item.partial,
      absent: item.absent,
    })),
    expectedControl.questions,
    `${control.code}: exact IDs/types/conditionKey/wording/gaps/remediations`,
  );

  const unresolved = resolveOrganizationalControl(control.id, {});
  assert.equal(unresolved.questionIds.length, 3, `${control.code}: unresolved context keeps main questions visible`);
  assert.equal(unresolved.assessmentBlocked, false, `${control.code}: ordinary unresolved context does not block assessment`);
  assert.equal(unresolved.requiredQuickContextQuestions.length, control.quickContext.filter((item) => !item.conditionKey).length, `${control.code}: only top-level unresolved Quick Context returned`);

  const allYes = Object.fromEntries(control.quickContext.map((item) => [item.key, "yes"]));
  const yesResolution = resolveOrganizationalControl(control.id, allYes);
  assert.deepEqual(yesResolution.questionIds, control.questions.map((item) => item.id), `${control.code}: yes shows conditionals`);
  assert.equal(yesResolution.requiredQuickContextQuestions.length, 0, `${control.code}: known yes suppresses Quick Context`);

  for (const quick of control.quickContext) {
    const noResolution = resolveOrganizationalControl(control.id, { ...allYes, [quick.key]: "no" });
    const notSureResolution = resolveOrganizationalControl(control.id, { ...allYes, [quick.key]: "not_sure" });
    const undefinedResolution = resolveOrganizationalControl(control.id, Object.fromEntries(Object.entries(allYes).filter(([key]) => key !== quick.key)));
    for (const conditional of control.questions.filter((item) => item.conditionKey === quick.key)) {
      assert.equal(noResolution.questionIds.includes(conditional.id), false, `${conditional.id}: no hides conditional`);
      assert.equal(notSureResolution.questionIds.includes(conditional.id), false, `${conditional.id}: not_sure hides conditional`);
      assert.equal(undefinedResolution.questionIds.includes(conditional.id), false, `${conditional.id}: undefined hides conditional`);
    }
    if (!quick.conditionKey || allYes[quick.conditionKey] === "yes") {
      assert.equal(notSureResolution.requiredQuickContextQuestions.some((item) => item.key === quick.key), true, `${quick.key}: not_sure remains unresolved`);
      assert.equal(undefinedResolution.requiredQuickContextQuestions.some((item) => item.key === quick.key), true, `${quick.key}: undefined asks Quick Context`);
    }
  }

  for (const question of control.questions) {
    const base = { questionId: question.id, hasEvidence: false };
    assert.equal(deriveOrganizationalOutcome(control.id, [{ ...base, answer: "implemented" }], allYes).gapActions.length, 0, `${question.id}: implemented no gap`);
    const partial = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "partially_implemented" }], allYes);
    assert.equal(partial.gapActions[0]?.gapCode, question.partial.gapCode, `${question.id}: exact PARTIAL code`);
    assert.equal(partial.gapActions[0]?.gap, question.partial.gap, `${question.id}: exact PARTIAL diagnostic`);
    assert.equal(partial.gapActions[0]?.remediation, question.partial.remediation, `${question.id}: exact PARTIAL remediation`);
    const absent = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_implemented" }], allYes);
    assert.equal(absent.gapActions[0]?.gapCode, question.absent.gapCode, `${question.id}: exact ABSENT code`);
    assert.equal(absent.gapActions[0]?.gap, question.absent.gap, `${question.id}: exact ABSENT diagnostic`);
    assert.equal(absent.gapActions[0]?.remediation, question.absent.remediation, `${question.id}: exact ABSENT remediation`);
    assert.equal(deriveOrganizationalRemediationPlan(control.id, absent)[0].actions[0].remediation, question.absent.remediation, `${question.id}: remediation plan parity`);
    const unsure = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_sure" }], allYes);
    assert.equal(unsure.reviewState, "clarification_required", `${question.id}: not_sure clarification only`);
    assert.equal(unsure.gapActions.length, 0, `${question.id}: not_sure no remediation`);
    const unjustifiedNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable" }], allYes);
    assert.equal(unjustifiedNa.invalidResponses[0]?.errorCode, "not_applicable_requires_justification", `${question.id}: N/A requires justification`);
    const justifiedNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable", justification: "SoA applicability review" }], allYes);
    assert.equal(justifiedNa.reviewState, "applicability_review_required", `${question.id}: N/A applicability review`);
    assert.equal(justifiedNa.gapActions.length, 0, `${question.id}: N/A no remediation`);
  }

  for (const conditional of control.questions.filter((item) => item.type === "conditional")) {
    const hiddenContext = { ...allYes, [conditional.conditionKey]: "no" };
    const hiddenOutcome = deriveOrganizationalOutcome(control.id, [{ questionId: conditional.id, answer: "not_implemented", hasEvidence: false }], hiddenContext);
    assert.deepEqual(hiddenOutcome.gapActions, [], `${conditional.id}: hidden historical answer ignored for gaps`);
    assert.equal(hiddenOutcome.evaluatedResponseCount, 0, `${conditional.id}: hidden historical answer ignored for progress`);
    assert.ok(hiddenOutcome.ignoredHiddenResponseIds.includes(conditional.id), `${conditional.id}: hidden response tracked as ignored`);
  }
}

assert.equal(resolveOrganizationalControl("a5-34", { processesPIIInScope: "no" }).assessmentBlocked, true, "A.5.34 N/A blocked until justification");
assert.deepEqual(resolveOrganizationalControl("a5-34", { processesPIIInScope: "no" }).requiredQuickContextQuestions, [], "A.5.34 no PII suppresses secondary Quick Context");
assert.equal(resolveOrganizationalControl("a5-34", { processesPIIInScope: "no" }, "No PII in scope.").assessmentBlocked, false, "A.5.34 N/A unblocked by justification");
assert.deepEqual(resolveOrganizationalControl("a5-34", { processesPIIInScope: "no" }, "No PII in scope.").questionIds, [], "A.5.34 N/A hides all questions");
assert.equal(resolveOrganizationalControl("a5-34", {
  processesPIIInScope: "yes",
  requiresFormalPrivacyOfficerOrDPO: "no",
  conductsHighRiskPIIProcessing: "no",
  usesPIIProcessorsOrCrossBorderTransfers: "no",
}).questionIds.length, 3, "A.5.34 DPO/DPIA/processors are conditional, not universal");

const reused = resolveOrganizationalAssessmentContext({}, {}, {}, {
  processesPersonalData: "yes",
  developsSoftware: "yes",
  usesOpenSourceComponents: "yes",
  hasTechnicalBaselines: "yes",
  dependsOnIctForCriticalActivities: "yes",
});
assert.equal(reused.context.processesPIIInScope, "yes", "A.5.34 reuses explicit PII context");
assert.equal(reused.context.createsOrCommissionsProtectedIP, "yes", "A.5.32 reuses explicit development/IP context");
assert.equal(reused.context.usesOpenSourceOrThirdPartyComponents, "yes", "A.5.32 reuses explicit OSS/component context");
assert.equal(reused.context.hasTechnicalSystemsRequiringComplianceReview, "yes", "A.5.36 reuses explicit technical baseline context");
assert.equal(reused.context.hasCriticalInfrequentOrHighRiskOperations, "yes", "A.5.37 reuses explicit critical ICT operations context");
assert.equal(resolveOrganizationalControl("a5-34", reused.context).requiredQuickContextQuestions.some((item) => item.key === "processesPIIInScope"), false, "known PII context suppresses Quick Context");

const workspaceId = "workspace-organizational-a531-api";
let responseRows = [];
let metadataUpdates = 0;
const userMetadata = {
  normcore_onboarding: {
    assessment_context: {
      organizational: { processesPIIInScope: "no" },
      shared_context: {},
    },
  },
};
const dbRow = (payload) => ({
  id: `response-${responseRows.length + 1}`,
  workspace_id: payload.workspaceId ?? payload.workspace_id,
  theme: payload.theme,
  control_id: payload.controlId ?? payload.control_id,
  question_id: payload.questionId ?? payload.question_id,
  answer: payload.answer,
  justification: payload.justification ?? null,
  comment: payload.comment ?? null,
  evidence_reference: payload.evidenceReference ?? null,
  review_status: "pending",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
});
const fakeClient = {
  auth: {
    async getUser() {
      return { data: { user: { id: "user-a531", user_metadata: userMetadata } }, error: null };
    },
    async updateUser(payload) {
      metadataUpdates += 1;
      userMetadata.normcore_onboarding = payload.data.normcore_onboarding;
      return { data: { user: { id: "user-a531", user_metadata: userMetadata } }, error: null };
    },
  },
  from(table) {
    assert.equal(table, "assessment_responses");
    return {
      select() {
        return { async eq() { return { data: responseRows, error: null }; } };
      },
      upsert(payload) {
        const row = dbRow(payload);
        responseRows = responseRows.filter((item) => !(item.workspace_id === payload.workspace_id && item.question_id === payload.question_id));
        responseRows.push(row);
        return { select() { return { async single() { return { data: row, error: null }; } }; } };
      },
    };
  },
};
const apiRouteContext = { params: Promise.resolve({}), clientFactory: async () => fakeClient };
const apiRequest = (body) => new Request("http://localhost/api/assessment/responses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

let apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-34",
  controlApplicability: "not_applicable",
  controlApplicabilityJustification: "",
}), apiRouteContext);
assert.equal(apiResponse.status, 400, "A.5.34 API rejects missing N/A justification");
assert.equal(metadataUpdates, 0, "A.5.34 missing justification is not persisted");

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-34",
  controlApplicability: "not_applicable",
  controlApplicabilityJustification: "No PII is processed in the ISMS scope; SoA review required.",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.34 API accepts justified control-level N/A");
let body = await apiResponse.json();
assert.equal(body.organizational.outcome.resolution.controlApplicability, "not_applicable");
assert.deepEqual(body.organizational.outcome.resolution.questionIds, []);
assert.deepEqual(body.organizational.outcome.gapActions, []);
assert.deepEqual(body.organizational.remediationPlan, []);
assert.equal(userMetadata.normcore_onboarding.assessment_context.organizational.control_applicability_justifications["a5-34"], "No PII is processed in the ISMS scope; SoA review required.", "A.5.34 API persists control-level justification");

userMetadata.normcore_onboarding.assessment_context.organizational.processesPIIInScope = "yes";
apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-34",
  questionId: "o5_34_001",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.34 API reactivates questions when context returns to yes");
body = await apiResponse.json();
assert.equal(body.organizational.outcome.resolution.controlApplicability, "applicable");
assert.ok(body.organizational.outcome.resolution.questionIds.includes("o5_34_001"));
assert.equal(body.organizational.outcome.evaluatedResponseCount, 1, "A.5.34 API persists/reloads assessed answer after reactivation");

console.log("All Organizational A.5.31-A.5.37 backend QA checks passed.");
