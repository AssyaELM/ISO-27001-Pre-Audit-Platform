import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const files = {
  infra: path.join(projectRoot, "content", "assessment-infrastructure.ts"),
  responses: path.join(projectRoot, "lib", "assessment", "responses.ts"),
  route: path.join(projectRoot, "app", "api", "assessment", "responses", "route.ts"),
  migration: path.join(projectRoot, "supabase", "migrations", "20260803090000_create_assessment_responses.sql"),
};

const results = [];

const check = (name, fn) => {
  try {
    fn();
    results.push({ name, status: "PASS" });
  } catch (error) {
    results.push({ name, status: "FAIL", message: error.message ?? String(error) });
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function run() {
  const raw = {};
  for (const [key, filePath] of Object.entries(files)) {
    raw[key] = await readFile(filePath, "utf8");
  }

  const allowedAnswers = [
    "implemented",
    "partially_implemented",
    "not_implemented",
    "not_sure",
    "not_applicable",
  ];

  check("Reponses autorisees strictement limitees a 5 valeurs", () => {
    for (const value of allowedAnswers) {
      assert(raw.infra.includes(value), `answer ${value} manque`);
      assert(raw.responses.includes("isAllowedAssessmentAnswer"), "fonction de validation JS manquante");
      assert(raw.responses.includes("validAnswerSet"), "whitelist JS manquante");
    }
  });

  check("not_applicable exige justification dans SQL et API", () => {
    assert(raw.migration.includes("assessment_responses_justification_not_applicable"), "contrainte SQL manquante");
    assert(raw.migration.includes("new.answer = 'not_applicable'"), "trigger SQL ne controle pas not_applicable");
    assert(raw.route.includes('answer === "not_applicable" && !justification'), "API n impos pas la justification");
  });

  check("Pas d etat not_assessed enregistre", () => {
    assert(!raw.infra.includes("not_assessed"), "not_assessed doit rester derive");
    assert(!raw.migration.includes("not_assessed"), "not_assessed ne doit pas exister en SQL");
  });

  check("answer et statut de validation sont separes", () => {
    assert(raw.responses.includes("answer:"), "colonne answer manquante");
    assert(raw.responses.includes("review_status:"), "colonne review_status manquante");
    assert(!raw.infra.includes('status: "implemented"'), "ancien statut monolithique detecte");
  });

  check("statuts validation autorises (draft, submitted, validated, rejected)", () => {
    assert(raw.infra.includes("draft"), "draft manquant");
    assert(raw.infra.includes("submitted"), "submitted manquant");
    assert(raw.infra.includes("validated"), "validated manquant");
    assert(raw.infra.includes("rejected"), "rejected manquant");
    assert(raw.route.includes("validReviewStatuses.has"), "PATCH ne valide pas statuts whitelist");
    assert(raw.responses.includes("isStatusAllowed"), "service layer ne valide pas statuts");
  });

  check("isolation workspace via RLS et filtre lecture", () => {
    assert(
      raw.migration.includes("using (public.current_user_can_access_workspace(workspace_id))") ,
      "RLS select absent",
    );
    assert(
      raw.migration.includes("for insert\n  with check (public.current_user_can_access_workspace(workspace_id));") ||
        raw.migration.includes("for insert with check (public.current_user_can_access_workspace(workspace_id));"),
      "RLS insert absent",
    );
    assert(
      raw.migration.includes("for update\n  using (public.current_user_can_access_workspace(workspace_id));"),
      "RLS update absent",
    );
    assert(raw.responses.includes('from("assessment_responses")'), "query assessment_responses manquante");
    assert(raw.responses.includes('eq("workspace_id", workspaceId)'), "filtre workspace_id absent");
  });

  check("prevention des doublons workspace+question", () => {
    assert(raw.migration.includes("constraint assessment_responses_question_uniqueness unique (workspace_id, question_id)"), "contrainte unique absente");
    assert(raw.responses.includes('onConflict: "workspace_id,question_id"'), "upsert non idempotent");
  });

  check("permissions validation / rejet restreintes", () => {
    assert(raw.migration.includes("current_user_can_validate_workspace"), "fonction de droits validate/reject absente");
    assert(raw.migration.includes("user cannot validate or reject responses"), "message de refus absent");
    assert(raw.migration.includes("if new.review_status in ('validated', 'rejected')"), "controle validateur manquant");
  });

  check("progression = 0 sans reponse", () => {
    assert(raw.responses.includes("if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return 0;"), "division par zero non protegee");
    assert(raw.responses.includes("if (!Number.isFinite(answeredQuestions) || answeredQuestions < 0) return 0;"), "guard answered absent");
    assert(raw.responses.includes("readResponsesWithProgress"), "fonction progress absente");
    assert(raw.responses.includes("expectedTotalQuestions = 0"), "fallback total 0 attendu");
  });

  check("secrets non utilises cote client", () => {
    assert(!raw.route.includes("SUPABASE_SERVICE"), "secret service detecte en route");
    assert(!raw.migration.includes("service_role"), "service role references in SQL");
  });

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  for (const result of results) {
    if (result.status === "PASS") console.log(`PASS ${result.name}`);
    else console.error(`FAIL ${result.name} : ${result.message}`);
  }

  console.log(`\nResume: ${passed} pass, ${failed} fail`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
