import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cablingSecurityQuestions,
  A7_12_CABLING_SECURITY_PLAN,
  A7_12_CABLING_SECURITY_GAP_CODES,
} from "../content/assessment/physical/cabling-security.ts";
import {
  resolveCablingSecurityQuestions,
  deriveCablingSecurityOutcome,
  deriveCablingSecurityRemediationPlan,
} from "../lib/assessment/cabling-security.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    passCount++;
  } catch (err) {
    console.error(`\nFAIL: ${name}`);
    console.error(err);
    failCount++;
  }
}

// ---------------------------------------------------------
// QA Requirements 1-24: Catalogue
// ---------------------------------------------------------
test("1 to 5, 9 to 12. Questions length, IDs, types, and exclusivity", () => {
  assert.equal(cablingSecurityQuestions.length, 3);
  const ids = cablingSecurityQuestions.map((q) => q.id);
  assert.deepEqual(ids, ["p7_12_001", "p7_12_002", "p7_12_003"]);
  
  const mains = cablingSecurityQuestions.filter((q) => q.status === "main");
  assert.equal(mains.length, 3);
  
  const conditionals = cablingSecurityQuestions.filter((q) => q.status === "conditional");
  assert.equal(conditionals.length, 0);

  const hasP712004 = cablingSecurityQuestions.some(q => q.id === "p7_12_004");
  assert.equal(hasP712004, false);

  const hasP713 = cablingSecurityQuestions.some(q => q.id.includes("p7_13_"));
  assert.equal(hasP713, false);
});

test("6 to 8. Exact types", () => {
  const q1 = cablingSecurityQuestions.find((q) => q.id === "p7_12_001");
  const q2 = cablingSecurityQuestions.find((q) => q.id === "p7_12_002");
  const q3 = cablingSecurityQuestions.find((q) => q.id === "p7_12_003");
  assert.equal(q1.type, "policy_process");
  assert.equal(q2.type, "application");
  assert.equal(q3.type, "proof_traceability");
});

test("13, 14, 19, 20, 21, 24. Q1 texts, fields, context keys absent", () => {
  const q1 = cablingSecurityQuestions.find((q) => q.id === "p7_12_001");
  assert.equal(
    q1.question.fr,
    "Votre organisation a-t-elle défini des exigences proportionnées pour protéger les câbles d’alimentation, de données et de télécommunications pertinents contre l’interception, l’interférence, la manipulation et les dommages physiques ?"
  );
  assert.equal(
    q1.question.en,
    "Has your organization defined proportionate requirements for protecting relevant power, data, and telecommunications cabling against interception, interference, tampering, and physical damage?"
  );
  assert.ok(q1.title.fr && q1.title.en);
  assert.ok(q1.helpText.fr && q1.helpText.en);
  assert.ok(q1.suggestedEvidence.fr && q1.suggestedEvidence.en);
  assert.equal(q1.conditionKey, undefined);
  assert.equal(q1.legalWarning, undefined);
});

test("15, 16. Q2 texts", () => {
  const q2 = cablingSecurityQuestions.find((q) => q.id === "p7_12_002");
  assert.equal(
    q2.question.fr,
    "Les câbles, chemins de câblage et points de terminaison pertinents sont-ils effectivement protégés de manière proportionnée contre l’accès ou l’interception non autorisés, les interférences et les dommages accidentels ou malveillants ?"
  );
  assert.equal(
    q2.question.en,
    "Are relevant cables, cabling routes, and termination points effectively protected in a proportionate manner against unauthorized access or interception, interference, and accidental or malicious damage?"
  );
  assert.ok(q2.title.fr && q2.title.en);
  assert.ok(q2.helpText.fr && q2.helpText.en);
  assert.ok(q2.suggestedEvidence.fr && q2.suggestedEvidence.en);
  assert.equal(q2.conditionKey, undefined);
  assert.equal(q2.legalWarning, undefined);
});

test("17, 18. Q3 texts", () => {
  const q3 = cablingSecurityQuestions.find((q) => q.id === "p7_12_003");
  assert.equal(
    q3.question.fr,
    "Les installations, modifications, inspections, défauts, incidents et responsabilités de tiers susceptibles d’affecter la sécurité du câblage sont-ils documentés et suivis lorsque cela est nécessaire ?"
  );
  assert.equal(
    q3.question.en,
    "Are installations, changes, inspections, defects, incidents, and third-party responsibilities that may affect cabling security documented and tracked where necessary?"
  );
  assert.ok(q3.title.fr && q3.title.en);
  assert.ok(q3.helpText.fr && q3.helpText.en);
  assert.ok(q3.suggestedEvidence.fr && q3.suggestedEvidence.en);
  assert.equal(q3.conditionKey, undefined);
  assert.equal(q3.legalWarning, undefined);
});

test("22, 23. Plan and gap codes", () => {
  assert.equal(A7_12_CABLING_SECURITY_PLAN, "A7_12_CABLING_SECURITY_PLAN");
  assert.equal(Object.keys(A7_12_CABLING_SECURITY_GAP_CODES).length, 6);
});

// ---------------------------------------------------------
// QA Requirements 25-32: Resolver
// ---------------------------------------------------------
test("25 to 32. resolveCablingSecurityQuestions takes no context", () => {
  assert.equal(resolveCablingSecurityQuestions.length, 0);
  const resolution = resolveCablingSecurityQuestions();
  assert.equal(resolution.controlApplicability, "applicable");
  assert.equal(resolution.controlReviewState, "none");
  assert.equal(resolution.requiresControlJustification, false);
  assert.deepEqual(resolution.questionIds, ["p7_12_001", "p7_12_002", "p7_12_003"]);
  assert.deepEqual(resolution.hiddenQuestionIds, []);
  assert.deepEqual(resolution.unresolvedConditions, []);
  assert.equal(resolution.assessmentBlocked, false);
});

// ---------------------------------------------------------
// QA Requirements 33-56: Outcomes
// ---------------------------------------------------------
test("33, 34, 35. implemented", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "implemented" }],
    resolution
  );
  assert.equal(res.reviewState, "none");
  assert.equal(res.gapActions.length, 0);
});

test("36, 37, 40. partially_implemented Q1", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "partially_implemented" }],
    resolution
  );
  assert.equal(res.gapActions.length, 1);
  assert.equal(res.gapActions[0].actionCode, "P7.12-A01");
  assert.equal(res.gapActions[0].gapType, "partial");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_REQUIREMENTS_PARTIAL");
});

test("38, 41. partially_implemented Q2", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_002", answer: "partially_implemented" }],
    resolution
  );
  assert.equal(res.gapActions[0].actionCode, "P7.12-A02");
  assert.equal(res.gapActions[0].gapType, "partial");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_PROTECTION_PARTIAL");
});

test("39, 42. partially_implemented Q3", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_003", answer: "partially_implemented" }],
    resolution
  );
  assert.equal(res.gapActions[0].actionCode, "P7.12-A03");
  assert.equal(res.gapActions[0].gapType, "partial");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_ASSURANCE_PARTIAL");
});

test("43, 44, 45, 46. not_implemented", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [
      { questionId: "p7_12_001", answer: "not_implemented" },
      { questionId: "p7_12_002", answer: "not_implemented" },
      { questionId: "p7_12_003", answer: "not_implemented" },
    ],
    resolution
  );
  assert.equal(res.gapActions.length, 3);
  assert.equal(res.gapActions[0].gapType, "full");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_REQUIREMENTS_ABSENT");
  assert.equal(res.gapActions[1].gapCode, "A7_12_CABLING_PROTECTION_ABSENT");
  assert.equal(res.gapActions[2].gapCode, "A7_12_CABLING_ASSURANCE_ABSENT");
});

test("47, 48, 49. not_sure", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "not_sure" }],
    resolution
  );
  assert.equal(res.reviewState, "clarification_required");
  assert.equal(res.gapActions.length, 0); 
});

test("50, 51, 52, 53, 54, 55, 56. not_applicable logic", () => {
  const resolution = resolveCablingSecurityQuestions();
  
  let res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "not_applicable", justification: "" }],
    resolution
  );
  assert.equal(res.reviewState, "applicability_review_required");
  assert.equal(res.gapActions.length, 0);

  res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "not_applicable", justification: "   " }],
    resolution
  );
  assert.equal(res.reviewState, "applicability_review_required");

  res = deriveCablingSecurityOutcome(
    [{ questionId: "p7_12_001", answer: "not_applicable", justification: "  Valid reason  " }],
    resolution
  );
  assert.equal(res.reviewState, "applicability_review_required");
  assert.equal(res.gapActions.length, 0);
});

// ---------------------------------------------------------
// QA Requirements 57-62: Evidence
// ---------------------------------------------------------
test("57 to 62. Evidence Status handling", () => {
  const resolution = resolveCablingSecurityQuestions();
  const statuses = ["not_provided", "provided", "validated", "rejected"];
  for (const s of statuses) {
    const res = deriveCablingSecurityOutcome(
      [{ questionId: "p7_12_001", answer: "implemented", evidenceStatus: s }],
      resolution
    );
    assert.equal(res.gapActions.length, 0);
  }
});

// ---------------------------------------------------------
// QA Requirements 63-66: Transitions
// ---------------------------------------------------------
test("63, 64, 65, 66. Transitions and deduplication", () => {
  const resolution = resolveCablingSecurityQuestions();
  
  let res = deriveCablingSecurityOutcome(
    [
      { questionId: "p7_12_001", answer: "partially_implemented" },
      { questionId: "p7_12_001", answer: "not_implemented" }, 
    ],
    resolution
  );
  assert.equal(res.gapActions.length, 1);
  assert.equal(res.gapActions[0].gapType, "full");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_REQUIREMENTS_ABSENT");

  res = deriveCablingSecurityOutcome(
    [
      { questionId: "p7_12_001", answer: "not_implemented" },
      { questionId: "p7_12_001", answer: "partially_implemented" }, 
    ],
    resolution
  );
  assert.equal(res.gapActions.length, 1);
  assert.equal(res.gapActions[0].gapType, "partial");
  assert.equal(res.gapActions[0].gapCode, "A7_12_CABLING_REQUIREMENTS_PARTIAL");

  res = deriveCablingSecurityOutcome(
    [
      { questionId: "p7_12_001", answer: "not_implemented" },
      { questionId: "p7_12_001", answer: "implemented" },
    ],
    resolution
  );
  assert.equal(res.gapActions.length, 0);
});

// ---------------------------------------------------------
// QA Requirements 67-76: Plan
// ---------------------------------------------------------
test("67 to 76. Remediation plan structure", () => {
  const resolution = resolveCablingSecurityQuestions();
  const res = deriveCablingSecurityOutcome(
    [
      { questionId: "p7_12_001", answer: "not_implemented" },
      { questionId: "p7_12_002", answer: "not_implemented" },
      { questionId: "p7_12_003", answer: "not_implemented" },
    ],
    resolution
  );
  
  const plans = deriveCablingSecurityRemediationPlan(res);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].planCode, "A7_12_CABLING_SECURITY_PLAN");
  
  const actions = plans[0].actions;
  assert.equal(actions.length, 3);
  
  const aCodes = actions.map(a => a.actionCode);
  assert.deepEqual(aCodes, ["P7.12-A01", "P7.12-A02", "P7.12-A03"]);
  
  const actionSet = new Set(aCodes);
  assert.equal(actionSet.size, 3); 

  const hasA04 = aCodes.includes("P7.12-A04");
  assert.equal(hasA04, false);
});

// ---------------------------------------------------------
// QA Requirements 77-94: Remediation Content
// ---------------------------------------------------------
test("77 to 94. Remediation content texts and priorities", () => {
  const resolution = resolveCablingSecurityQuestions();
  for (const lvl of ["partially_implemented", "not_implemented"]) {
    const res = deriveCablingSecurityOutcome(
      [
        { questionId: "p7_12_001", answer: lvl },
        { questionId: "p7_12_002", answer: lvl },
        { questionId: "p7_12_003", answer: lvl },
      ],
      resolution
    );
    const plan = deriveCablingSecurityRemediationPlan(res)[0];
    
    // A01
    const a01 = plan.actions.find(a => a.actionCode === "P7.12-A01");
    assert.ok(a01.title.fr && a01.title.en);
    assert.ok(a01.description.fr && a01.description.en);
    assert.ok(a01.remediationSteps.fr && a01.remediationSteps.en);
    assert.ok(a01.closureCriteria.fr && a01.closureCriteria.en);
    if (lvl === "not_implemented") {
      assert.equal(a01.priority, "high");
      assert.equal(a01.recommendedOwner, "Facilities / IT Operations / Network / Information Security");
    } else {
      assert.equal(a01.priority, "medium");
      assert.equal(a01.recommendedOwner, undefined);
    }
    
    // A02
    const a02 = plan.actions.find(a => a.actionCode === "P7.12-A02");
    assert.ok(a02.title.fr && a02.title.en);
    assert.ok(a02.description.fr && a02.description.en);
    assert.ok(a02.remediationSteps.fr && a02.remediationSteps.en);
    assert.ok(a02.closureCriteria.fr && a02.closureCriteria.en);
    assert.equal(a02.priority, "high"); 
    
    // A03
    const a03 = plan.actions.find(a => a.actionCode === "P7.12-A03");
    assert.ok(a03.title.fr && a03.title.en);
    assert.ok(a03.description.fr && a03.description.en);
    assert.ok(a03.remediationSteps.fr && a03.remediationSteps.en);
    assert.ok(a03.closureCriteria.fr && a03.closureCriteria.en);
    if (lvl === "not_implemented") {
      assert.equal(a03.priority, "high");
    } else {
      assert.equal(a03.priority, "medium");
    }
  }
});

// ---------------------------------------------------------
// QA Requirements 95-123: Anti-Prescriptive Guardrails
// ---------------------------------------------------------
test("95 to 123. Anti-prescriptive guardrails", () => {
  const allText = JSON.stringify(cablingSecurityQuestions);
  
  assert.equal(allText.includes("doit séparer power/data de 20 cm"), false);
  assert.equal(allText.includes("50 mm mandatory"), false);
  assert.equal(allText.includes("fibre obligatoire"), false);
  assert.equal(allText.includes("blindage obligatoire"), false);
  assert.equal(allText.includes("câblage souterrain obligatoire"), false);
  assert.equal(allText.includes("armoire verrouillée dans tous les cas"), false);
  assert.equal(allText.includes("badge obligatoire"), false);
  assert.equal(allText.includes("étiquetage obligatoire"), false);
  assert.equal(allText.includes("DCIM obligatoire"), false);
  assert.equal(allText.includes("inspection trimestrielle fixe"), false);
  
  assert.ok(allText.includes("La norme n’impose pas universellement :\\n\\n- une distance précise entre power et data"));
  assert.ok(allText.includes("absence de fibre ≠ automatiquement non-conforme"));
});

// ---------------------------------------------------------
// QA Requirements 124-131: Boundaries
// ---------------------------------------------------------
test("124 to 131. Boundaries", () => {
  const allText = JSON.stringify(cablingSecurityQuestions);
  assert.equal(allText.includes("Physical entry"), false);
  assert.equal(allText.includes("Equipment maintenance"), false);
  assert.equal(allText.includes("p7_13_"), false);
  assert.equal(allText.includes("Networks security"), false);
});

// ---------------------------------------------------------
// QA Requirements 132-150: Architecture
// ---------------------------------------------------------
test("132 to 150. Architectural isolation and no markers leaking", () => {
  const markerPattern = /p7_12_|A7_12_|P7\.12-/g;
  
  const allowedFiles = [
    "content/assessment/physical/cabling-security.ts",
    "lib/assessment/cabling-security.ts",
    "scripts/assessment-cabling-security-qa.mjs",
  ];
  
  const excludedDirs = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    ".gemini"
  ];

  let filesScanned = 0;

  function walkSync(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!excludedDirs.includes(file)) {
          walkSync(fullPath);
        }
      } else {
        const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        if (allowedFiles.includes(relativePath)) continue;
        
        if (relativePath === "package.json" || relativePath === "package-lock.json") continue;
        
        if (relativePath.endsWith(".ps1") || relativePath.endsWith(".md") || relativePath.endsWith(".jsonl")) continue;
        if (relativePath.endsWith(".env") || relativePath.endsWith(".env.local")) continue;
        if (relativePath.endsWith(".log") || relativePath.endsWith(".jpg") || relativePath.endsWith(".png") || relativePath.endsWith(".ico") || relativePath.endsWith(".webp") || relativePath.endsWith(".woff") || relativePath.endsWith(".woff2") || relativePath.endsWith(".ttf") || relativePath.endsWith(".svg")) continue;

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          
          if (relativePath.includes("-qa.mjs") && content.includes(`includes("p7_12_")`)) {
            // QA script specifically checking for the absence of p7_12_, which is allowed
            filesScanned++;
            continue;
          }

          if (markerPattern.test(content)) {
            throw new Error(`Unauthorized A.7.12 marker found in ${relativePath}`);
          }
          filesScanned++;
        } catch (e) {
          if (e.message.includes('Unauthorized A.7.12 marker found in')) {
            throw e;
          }
        }
      }
    }
  }

  walkSync(rootDir);
  
  assert.ok(filesScanned > 20, "Should have scanned historical QA");

  assert.equal(typeof resolveCablingSecurityQuestions, "function");
  assert.equal(typeof deriveCablingSecurityOutcome, "function");
  assert.equal(resolveCablingSecurityQuestions.constructor.name, "Function"); 
});

if (failCount > 0) {
  console.log(`\nQA FAILED: ${failCount} failed, ${passCount} passed.`);
  process.exit(1);
} else {
  console.log(`\nAll assessment A.7.12 QA checks passed. (${passCount} suites)`);
  process.exit(0);
}
