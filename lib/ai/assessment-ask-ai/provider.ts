export type AssessmentAskAiAction =
  | "explain_question"
  | "explain_options"
  | "give_example"
  | "suggest_evidence"
  | "custom";

export type AssessmentAskAiRequest = {
  question: string;
  controlTitle: string;
  controlId: string;
  questionId: string;
  answerOptions: string[];
  selectedAnswer?: string;
  action: AssessmentAskAiAction;
  userMessage?: string;
};

export class AssessmentAskAiError extends Error {
  constructor(public readonly code: "ASK_AI_NOT_CONFIGURED" | "ASK_AI_BUSY" | "ASK_AI_UNAVAILABLE", message: string) {
    super(message);
  }
}

const actionInstructions: Record<AssessmentAskAiAction, string> = {
  explain_question: "Explain in simple language what this assessment question is trying to verify.",
  explain_options: "Explain the difference between each answer option without selecting one for the user.",
  give_example: "Give one generic, concrete example of what a suitable situation or practice could look like.",
  suggest_evidence: "Suggest practical types of evidence that could support the user's own answer.",
  custom: "Answer the user's question using only the assessment context provided.",
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

const systemInstruction = "You are NormCore Ask AI, an assistant that helps users understand ISO 27001 assessment questions. Explain clearly and concisely. Do not answer the assessment on behalf of the user. Do not claim compliance or certification. The user remains responsible for selecting the answer.";

function promptFor(input: AssessmentAskAiRequest, userInstruction: string) {
  return JSON.stringify({
    instruction: userInstruction,
    control: { id: input.controlId, title: input.controlTitle },
    question: { id: input.questionId, text: input.question },
    answerOptions: input.answerOptions,
    selectedAnswer: input.selectedAnswer ?? null,
  });
}

async function askOpenAi(apiKey: string, model: string, prompt: string, signal: AbortSignal) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (response.status === 429) throw new AssessmentAskAiError("ASK_AI_BUSY", "Ask AI is temporarily busy. Please try again.");
  if (!response.ok) throw new AssessmentAskAiError("ASK_AI_UNAVAILABLE", "Ask AI is temporarily unavailable.");
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return body.choices?.[0]?.message?.content?.trim() ?? "";
}

async function askGemini(apiKey: string, model: string, prompt: string, signal: AbortSignal) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (response.status === 429) throw new AssessmentAskAiError("ASK_AI_BUSY", "Ask AI is temporarily busy. Please try again.");
  if (!response.ok) throw new AssessmentAskAiError("ASK_AI_UNAVAILABLE", "Ask AI is temporarily unavailable.");
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

export async function askAssessmentAi(input: AssessmentAskAiRequest) {
  const provider = env("ASSESSMENT_ASK_AI_PROVIDER").toLowerCase() || "openai";
  const apiKey = env("ASSESSMENT_ASK_AI_API_KEY");
  const model = env("ASSESSMENT_ASK_AI_MODEL");
  if (!apiKey || !model) throw new AssessmentAskAiError("ASK_AI_NOT_CONFIGURED", "Ask AI is not configured yet.");

  const userInstruction = input.action === "custom" ? input.userMessage?.trim() : actionInstructions[input.action];
  if (!userInstruction) throw new AssessmentAskAiError("ASK_AI_UNAVAILABLE", "Ask AI is temporarily unavailable.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const prompt = promptFor(input, userInstruction);
    const content = provider === "gemini"
      ? await askGemini(apiKey, model, prompt, controller.signal)
      : provider === "openai"
        ? await askOpenAi(apiKey, model, prompt, controller.signal)
        : "";
    if (!content) throw new AssessmentAskAiError("ASK_AI_UNAVAILABLE", "Ask AI is temporarily unavailable.");
    return content;
  } catch (error) {
    if (error instanceof AssessmentAskAiError) throw error;
    throw new AssessmentAskAiError("ASK_AI_UNAVAILABLE", "Ask AI is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}
