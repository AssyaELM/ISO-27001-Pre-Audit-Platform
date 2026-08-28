import { sendNormCoreEmail } from "./mailer";
import { approvalEmail } from "./templates/approval-email";

type DecisionEmail = { email: string; fullName: string; approved: boolean; appUrl: string };

export async function sendAccessDecisionEmail(input: DecisionEmail) {
  if (!input.approved) return { sent: false, reason: "Rejected access requests do not send email." };
  return sendNormCoreEmail({ to: input.email, ...approvalEmail(input.fullName, input.appUrl) });
}
