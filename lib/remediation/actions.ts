import type { GapAnalysisItem, GapAnalysisTheme } from "../assessment/gap-analysis.ts";

export const remediationStatuses = ["todo", "in_progress", "completed"] as const;
export type RemediationStatus = (typeof remediationStatuses)[number];

export type RemediationMember = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export type RemediationWorkflow = {
  id: string;
  workspaceId: string;
  sourceKey: string;
  theme: GapAnalysisTheme;
  controlId: string;
  questionId: string;
  gapCode: string;
  gapLevel: "full_gap" | "partial_gap";
  ownerUserId: string | null;
  dueDate: string | null;
  status: RemediationStatus;
  progressNote: string;
  createdAt: string;
  updatedAt: string;
};

export type RemediationAction = RemediationWorkflow & {
  controlCode: string;
  controlTitle: string;
  question: string;
  diagnostic?: string;
  remediation?: string;
  evidenceStatus: GapAnalysisItem["evidenceStatus"];
  assessmentHref: string;
  gapHref: string;
};

export type RemediationMetrics = {
  open: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  total: number;
};

export function isRemediationStatus(value: unknown): value is RemediationStatus {
  return remediationStatuses.includes(value as RemediationStatus);
}

export function remediationSourceKey(item: Pick<GapAnalysisItem, "theme" | "controlId" | "questionId" | "gapCode" | "status">) {
  if (item.status !== "full_gap" && item.status !== "partial_gap") {
    throw new Error("Only active full or partial gaps can create remediation actions");
  }
  return [item.theme, item.controlId, item.questionId, item.gapCode?.trim() || "no-gap-code", item.status].join(":");
}

export function activeRemediationGaps(items: GapAnalysisItem[]) {
  return items.filter((item) => item.status === "full_gap" || item.status === "partial_gap");
}

export function isOverdue(action: Pick<RemediationWorkflow, "dueDate" | "status">, today = new Date()) {
  if (!action.dueDate || action.status === "completed") return false;
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return action.dueDate < localToday;
}

export function remediationMetrics(actions: RemediationWorkflow[], today = new Date()): RemediationMetrics {
  const completed = actions.filter((action) => action.status === "completed").length;
  const todo = actions.filter((action) => action.status === "todo").length;
  const inProgress = actions.filter((action) => action.status === "in_progress").length;
  return {
    open: todo + inProgress,
    todo,
    inProgress,
    completed,
    overdue: actions.filter((action) => isOverdue(action, today)).length,
    total: actions.length,
  };
}
