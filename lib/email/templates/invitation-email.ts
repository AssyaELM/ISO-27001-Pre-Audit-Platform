import { renderBaseEmail } from "./base-template";

export function invitationEmail(organizationName: string, token: string, appUrl: string) {
  const body = `Your organization, ${organizationName}, has been added to NormCore.\n\nUse the activation token below to activate your account and continue your organization setup.`;
  const activationUrl = `${appUrl.replace(/\/$/, "")}/activate?token=${encodeURIComponent(token)}`;
  return { subject: "Activate your NormCore organization account", text: `Hello,\n\n${body}\n\nActivation token: ${token}\n\nActivate your account: ${activationUrl}\n\nThis activation token is single-use and expires automatically.\n\nNormCore`, html: renderBaseEmail({ title: "You have been invited to NormCore", greeting: "Hello,", body, code: token, cta: { label: "Activate your account", url: activationUrl }, note: "This activation token is single-use and expires automatically." }, appUrl) };
}
