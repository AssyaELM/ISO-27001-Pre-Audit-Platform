import { renderBaseEmail } from "./base-template";

export function approvalEmail(fullName: string, appUrl: string) {
  const body = "Your request to access NormCore has been approved.\n\nYour account is now active and you can sign in using your registered email and password.\n\nContinue to NormCore to complete your organization onboarding.";
  return { subject: "Your NormCore account has been approved", text: `Hello ${fullName},\n\n${body}\n\nNormCore`, html: renderBaseEmail({ title: "Your access has been approved", greeting: `Hello ${fullName},`, body, cta: { label: "Sign in to NormCore", url: `${appUrl.replace(/\/$/, "")}/login` } }, appUrl) };
}
