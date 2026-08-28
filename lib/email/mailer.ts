import nodemailer from "nodemailer";

type MailInput = { to: string; subject: string; html: string; text: string };

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !Number.isFinite(port) || !user || !password || !from) return null;
  return { host, port, user, password, from };
}

export async function sendNormCoreEmail(input: MailInput) {
  const config = smtpConfig();
  if (!config) {
    console.error("[NormCore email] SMTP is not configured", { to: input.to, subject: input.subject });
    return { sent: false, reason: "NormCore SMTP is not configured." };
  }
  try {
    const transporter = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.password } });
    const info = await transporter.sendMail({ from: config.from, to: input.to, subject: input.subject, text: input.text, html: input.html });
    console.info("[NormCore email] sent", { to: input.to, subject: input.subject, messageId: info.messageId });
    return { sent: true, id: info.messageId };
  } catch (error) {
    console.error("[NormCore email] delivery failed", { to: input.to, subject: input.subject, message: error instanceof Error ? error.message : String(error) });
    return { sent: false, reason: "The email could not be delivered." };
  }
}
