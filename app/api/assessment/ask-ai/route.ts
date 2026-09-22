import { NextResponse } from "next/server.js";

import { getCurrentUser } from "../../../../lib/workspaces/authenticated-client.ts";
import { getCanonicalAssessmentCatalog, isCanonicalAssessmentQuestion } from "../../../../lib/assessment/gap-analysis.ts";
import { askAssessmentAi, AssessmentAskAiError, type AssessmentAskAiAction } from "../../../../lib/ai/assessment-ask-ai/provider.ts";

const answerOptions = ["Implemented", "Partially implemented", "Not implemented", "Not sure", "Not applicable"];
const actions = new Set<AssessmentAskAiAction>(["explain_question", "explain_options", "give_example", "suggest_evidence", "custom"]);

export async function POST(request: Request) {
  let body: {
    workspaceId?: string;
    assessmentId?: string;
    theme?: string;
    controlId?: string;
    questionId?: string;
    question?: string;
    selectedAnswer?: string;
    action?: AssessmentAskAiAction;
    userMessage?: string;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Unable to process this request." }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim() ?? "";
  const theme = body.theme === "technology" ? "technological" : body.theme?.trim() ?? "";
  const controlId = body.controlId?.trim() ?? "";
  const questionId = body.questionId?.trim() ?? "";
  const action = body.action;
  if (!workspaceId || !theme || !controlId || !questionId || !action || !actions.has(action)) {
    return NextResponse.json({ error: "Unable to process this request." }, { status: 400 });
  }

  try {
    const { client, user } = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { data: workspace } = await client.from("workspaces").select("id").eq("id", workspaceId).maybeSingle();
    if (!workspace) return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    if (!isCanonicalAssessmentQuestion(theme as "organizational" | "people" | "physical" | "technological", controlId, questionId)) {
      return NextResponse.json({ error: "Assessment question not found" }, { status: 404 });
    }
    const catalog = getCanonicalAssessmentCatalog("en");
    const control = catalog[theme as keyof typeof catalog]?.find((item) => item.id === controlId);
    const question = control?.questions.find((item) => item.id === questionId);
    if (!control || !question) return NextResponse.json({ error: "Assessment question not found" }, { status: 404 });

    const answer = await askAssessmentAi({
      question: question.wording,
      controlTitle: control.title,
      controlId,
      questionId,
      answerOptions,
      selectedAnswer: body.selectedAnswer,
      action,
      userMessage: body.userMessage,
    });
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof AssessmentAskAiError) {
      const status = error.code === "ASK_AI_NOT_CONFIGURED" ? 503 : error.code === "ASK_AI_BUSY" ? 429 : 502;
      return NextResponse.json({ code: error.code, error: error.message }, { status });
    }
    console.error("POST /api/assessment/ask-ai failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ code: "ASK_AI_UNAVAILABLE", error: "Ask AI is temporarily unavailable." }, { status: 502 });
  }
}
