import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { activeGapCount, deriveGapAnalysis, gapAnalysisMetrics } from "../lib/assessment/gap-analysis.ts";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import { peopleControls } from "../content/assessment/people/people-controls.ts";
import { physicalControls } from "../content/assessment/physical/physical-controls.ts";
import { technologicalControls } from "../content/assessment/technological/technological-controls.generated.ts";

const response = (controlId, questionId, answer, extra = {}) => ({ controlId, questionId, answer, ...extra });

const basic = deriveGapAnalysis([
  response("a5-1", "p5_1_001", "implemented"),
  response("a5-1", "p5_1_002", "partially_implemented"),
  response("a5-1", "p5_1_003", "not_implemented"),
  response("a5-2", "p5_2_001", "not_sure"),
  response("a5-2", "p5_2_002", "not_applicable", { justification: "Not relevant in the test scope" }),
], {}, "en");

assert.equal(basic.some((item) => item.questionId === "p5_1_001"), false, "implemented must not appear");
assert.equal(basic.find((item) => item.questionId === "p5_1_002")?.status, "partial_gap");
assert.equal(basic.find((item) => item.questionId === "p5_1_003")?.status, "full_gap");
assert.equal(basic.find((item) => item.questionId === "p5_2_001")?.status, "clarification_required");
assert.equal(basic.find((item) => item.questionId === "p5_2_002")?.status, "applicability_review_required");
const metrics = gapAnalysisMetrics(basic);
assert.deepEqual({ total: metrics.total, full: metrics.full, partial: metrics.partial, clarification: metrics.clarification, applicability: metrics.applicability }, { total: 2, full: 1, partial: 1, clarification: 1, applicability: 1 });

const conditionalControl = organizationalControls.find((control) => control.questions.some((question) => question.conditionKey));
assert.ok(conditionalControl, "canonical Organizational catalog must contain a conditional question");
const conditional = conditionalControl.questions.find((question) => question.conditionKey);
assert.ok(conditional?.conditionKey);
const hidden = deriveGapAnalysis(
  [response(conditionalControl.id, conditional.id, "not_implemented")],
  { assessment_context: { organizational: { [conditional.conditionKey]: "no" } } },
  "en",
);
assert.equal(hidden.some((item) => item.questionId === conditional.id), false, "hidden conditional responses must be excluded");

const themes = deriveGapAnalysis([
  response("a5-1", "p5_1_001", "partially_implemented"),
  response("a6-1", "p6_1_001", "partially_implemented"),
  response("a7-7", "p7_7_001", "partially_implemented"),
  response("a8-1", "p8_1_001", "partially_implemented"),
], {}, "en");
assert.deepEqual(new Set(themes.map((item) => item.theme)), new Set(["organizational", "people", "physical", "technological"]));
assert.equal(gapAnalysisMetrics(themes).total, 4);
assert.ok(themes.every((item) => item.href.includes(item.controlId) && item.href.includes(item.questionId)), "View control must retain control and question identifiers");

const reviewStatusIsNotEvidence = deriveGapAnalysis([
  response("a5-1", "p5_1_002", "partially_implemented", { status: "validated" }),
], {}, "en");
assert.equal(reviewStatusIsNotEvidence[0]?.evidenceStatus, "not_provided", "response review_status must never become an Evidence status");
const realEvidenceReference = deriveGapAnalysis([
  response("a5-1", "p5_1_002", "partially_implemented", { status: "rejected", evidenceReference: "evidence://document/1" }),
], {}, "en");
assert.equal(realEvidenceReference[0]?.evidenceStatus, "not_provided", "legacy evidence_reference must not be treated as canonical Evidence");
const canonicalEvidence = deriveGapAnalysis([
  response("a5-1", "p5_1_002", "partially_implemented", { status: "rejected", hasCanonicalEvidence: true }),
], {}, "en");
assert.equal(canonicalEvidence[0]?.evidenceStatus, "provided", "a canonical Evidence link must map to provided");

const applicabilityControl = organizationalControls.find((control) => control.id === "a5-34");
assert.ok(applicabilityControl?.applicabilityKey, "A.5.34 must expose its canonical applicability key");
const applicabilityKey = applicabilityControl.applicabilityKey;
const withoutControlJustification = deriveGapAnalysis([], {
  assessment_context: { organizational: { [applicabilityKey]: "no" } },
}, "en");
assert.equal(withoutControlJustification.some((item) => item.questionId === "control.applicability"), false, "Quick Context no without persisted control justification must not create Applicability");
const withControlJustification = deriveGapAnalysis([], {
  assessment_context: { organizational: { [applicabilityKey]: "no", control_applicability_justifications: { "a5-34": "PII is outside the approved ISMS scope." } } },
}, "en");
assert.equal(withControlJustification.filter((item) => item.controlId === "a5-34" && item.questionId === "control.applicability").length, 1, "valid control-level N/A must create exactly one Applicability item");
const reactivatedControl = deriveGapAnalysis([], {
  assessment_context: { organizational: { [applicabilityKey]: "yes", control_applicability_justifications: { "a5-34": "Old justification" } } },
}, "en");
assert.equal(reactivatedControl.some((item) => item.controlId === "a5-34" && item.questionId === "control.applicability"), false, "no to yes must exclude stale control-level Applicability");

const hiddenPeople = deriveGapAnalysis(
  [response("a6-3", "p6_3_004_role_based", "not_implemented")],
  { assessment_context: { awareness_training: { has_roles_requiring_specialized_training: "no" } } },
  "en",
);
assert.equal(hiddenPeople.length, 0, "hidden People conditional responses must be excluded");
const hiddenPhysical = deriveGapAnalysis(
  [response("a7-1", "p7_1_004_third_party", "not_implemented")],
  { assessment_context: { physical: { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" } } },
  "en",
);
assert.equal(hiddenPhysical.length, 0, "hidden Physical conditional responses must be excluded");
const technologicalConditionalControl = technologicalControls.find((control) => control.questions.some((question) => question.conditionKey));
const technologicalConditional = technologicalConditionalControl?.questions.find((question) => question.conditionKey);
assert.ok(technologicalConditionalControl && technologicalConditional?.conditionKey, "canonical Technological catalog must contain a conditional question");
const hiddenTechnological = deriveGapAnalysis(
  [response(technologicalConditionalControl.id, technologicalConditional.id, "not_implemented")],
  { assessment_context: { technological: { [technologicalConditional.conditionKey]: "no" } } },
  "en",
);
assert.equal(hiddenTechnological.length, 0, "hidden Technological conditional responses must be excluded");

const mixedResponses = [
  response("a5-1", "p5_1_002", "not_implemented"),
  response("a6-3", "p6_3_004_role_based", "not_implemented"),
  response("a7-1", "p7_1_004_third_party", "not_implemented"),
  response(technologicalConditionalControl.id, technologicalConditional.id, "not_implemented"),
];
const mixedOnboarding = { assessment_context: {
  awareness_training: { has_roles_requiring_specialized_training: "no" },
  physical: { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  technological: { [technologicalConditional.conditionKey]: "no" },
} };
assert.equal(activeGapCount(mixedResponses, mixedOnboarding), gapAnalysisMetrics(deriveGapAnalysis(mixedResponses, mixedOnboarding)).total, "Dashboard and Gap Analysis must use the same total-gap aggregation");
assert.equal(activeGapCount(mixedResponses, mixedOnboarding), 1, "hidden cross-theme responses must not inflate the Dashboard gap count");

assert.equal(peopleControls.find(([id]) => id === "a6-3")?.[2], "Information security awareness, education and training");
assert.equal(physicalControls.find(([id]) => id === "a7-1")?.[2], "Physical security perimeters");
const gapSource = readFileSync(new URL("../lib/assessment/gap-analysis.ts", import.meta.url), "utf8");
assert.match(gapSource, /import \{ peopleControls \}/, "Gap Analysis must import canonical People control metadata");
assert.match(gapSource, /import \{ physicalControls \}/, "Gap Analysis must import canonical Physical control metadata");
assert.doesNotMatch(gapSource, /const peopleControls\s*=/, "Gap Analysis must not duplicate People control metadata");
assert.doesNotMatch(gapSource, /const physicalControls\s*=/, "Gap Analysis must not duplicate Physical control metadata");
assert.doesNotMatch(gapSource, /ACME|Nora|mockData|demoData|sampleData/, "production Gap Analysis must not contain mockup or sample data");
const dashboardSource = readFileSync(new URL("../components/dashboard/dashboard-page.tsx", import.meta.url), "utf8");
assert.match(dashboardSource, /activeGapCount\(/, "Dashboard must reuse the canonical active gap aggregation");
const viewSource = readFileSync(new URL("../components/gap-analysis/gap-analysis-view.tsx", import.meta.url), "utf8");
assert.doesNotMatch(viewSource, /option value="validated"|option value="rejected"/, "Gap Analysis must not expose unsupported Evidence states");

console.log("Gap Analysis deterministic QA: PASS");
