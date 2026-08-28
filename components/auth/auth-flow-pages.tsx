"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { authCopy } from "@/content/auth";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthShell } from "./auth-shell";

export type EmailFlow = "signup" | "recovery";

const pendingEmailKey = "normcore-pending-auth-email";
const pendingFlowKey = "normcore-pending-auth-flow";

function FlowHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: React.ReactNode }) {
  return (
    <div className="auth-flow-heading">
      <span className="auth-flow-icon" aria-hidden="true">{icon}</span>
      <h1 id="auth-title">{title}</h1>
      <div className="auth-flow-description">{description}</div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const { language } = useStoredLanguage();
  const copy = authCopy[language];
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!isSupabaseConfigured()) {
      setMessage(copy.configurationMissing);
      setIsError(true);
      return;
    }

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    setSubmitting(true);

    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email);
      if (error) {
        setMessage(getAuthErrorMessage(error, language));
        setIsError(true);
        return;
      }

      window.sessionStorage.setItem(pendingEmailKey, email);
      window.sessionStorage.setItem(pendingFlowKey, "recovery");
      router.push("/check-email?flow=recovery");
    } catch {
      setMessage(copy.genericError);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell cardClassName="auth-card-flow">
      <FlowHeading
        icon={<KeyRound size={31} />}
        title={copy.forgotPassword.title}
        description={<p>{copy.forgotPassword.description}</p>}
      />
      <form className="auth-form auth-flow-form" onSubmit={submit}>
        <label className="auth-field">
          <span>{copy.workEmail}</span>
          <div>
            <Mail size={18} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" placeholder={copy.emailPlaceholder} maxLength={254} required />
          </div>
        </label>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
          {copy.forgotPassword.submitLabel}
        </button>
        <p className={`auth-form-message ${isError ? "is-error" : ""}`} aria-live="polite">{message}</p>
      </form>
      <Link prefetch={true} className="auth-flow-back" href="/login"><ArrowLeft size={18} />{copy.forgotPassword.back}</Link>
    </AuthShell>
  );
}

export function CheckEmailPage({ flow }: { flow: EmailFlow }) {
  const router = useRouter();
  const { language } = useStoredLanguage();
  const copy = authCopy[language];
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const pendingEmail = window.sessionStorage.getItem(pendingEmailKey) ?? "";
    const pendingFlow = window.sessionStorage.getItem(pendingFlowKey);
    if (!pendingEmail || (pendingFlow && pendingFlow !== flow)) {
      router.replace(flow === "signup" ? "/signup" : "/forgot-password");
      return;
    }
    const timer = window.setTimeout(() => setEmail(pendingEmail), 0);
    return () => window.clearTimeout(timer);
  }, [flow, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!isSupabaseConfigured()) {
      setMessage(copy.configurationMissing);
      setIsError(true);
      return;
    }

    if (!email || code.length < 6 || code.length > 10) {
      setMessage(copy.checkEmail.invalidCode);
      setIsError(true);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: flow });
      if (error) {
        setMessage(getAuthErrorMessage(error, language));
        setIsError(true);
        return;
      }

      window.sessionStorage.removeItem(pendingEmailKey);
      window.sessionStorage.removeItem(pendingFlowKey);

      if (flow === "recovery") {
        router.replace("/set-new-password");
      } else {
        await supabase.auth.signOut();
        router.replace("/login?verified=1");
      }
      router.refresh();
    } catch {
      setMessage(copy.genericError);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || !email || !isSupabaseConfigured()) return;
    setResending(true);
    setMessage("");
    setIsError(false);

    try {
      const supabase = createClient();
      const result = flow === "signup"
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.resetPasswordForEmail(email);

      if (result.error) {
        setMessage(getAuthErrorMessage(result.error, language));
        setIsError(true);
        return;
      }

      setCooldown(60);
      setMessage(copy.checkEmail.resent);
    } catch {
      setMessage(copy.genericError);
      setIsError(true);
    } finally {
      setResending(false);
    }
  }

  function changeEmail() {
    window.sessionStorage.removeItem(pendingEmailKey);
    window.sessionStorage.removeItem(pendingFlowKey);
    router.push(flow === "signup" ? "/signup" : "/forgot-password");
  }

  const description = flow === "signup" ? copy.checkEmail.signupDescription : copy.checkEmail.recoveryDescription;
  const submitLabel = flow === "signup" ? copy.checkEmail.verifySignup : copy.checkEmail.verifyRecovery;
  const resendLabel = cooldown > 0
    ? copy.checkEmail.resendIn.replace("{seconds}", String(cooldown))
    : copy.checkEmail.resend;
  const hasValidCodeLength = code.length >= 6 && code.length <= 10;

  return (
    <AuthShell cardClassName="auth-card-flow auth-card-otp">
      <FlowHeading
        icon={<MailCheck size={32} />}
        title={copy.checkEmail.title}
        description={<><p>{description}</p><strong>{email}</strong><p>{copy.checkEmail.instruction}</p></>}
      />
      <form className="auth-form auth-flow-form" onSubmit={verify}>
        <label className="auth-field auth-otp-field">
          <span>{copy.checkEmail.codeLabel}</span>
          <input
            name="otp"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={copy.checkEmail.codePlaceholder}
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
          />
        </label>
        <button className="auth-submit" type="submit" disabled={submitting || !hasValidCodeLength}>
          {submitting ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
          {submitLabel}
        </button>
        <button className="auth-secondary-action" type="button" onClick={resend} disabled={cooldown > 0 || resending}>
          {resending ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
          {resendLabel}
        </button>
        <p className={`auth-form-message ${isError ? "is-error" : ""}`} aria-live="polite">{message}</p>
      </form>
      <div className="auth-flow-links">
        <button type="button" onClick={changeEmail}>{copy.checkEmail.changeEmail}</button>
        <Link prefetch={true} href="/login"><ArrowLeft size={18} />{copy.checkEmail.back}</Link>
      </div>
    </AuthShell>
  );
}

export function SetNewPasswordPage() {
  const router = useRouter();
  const { language } = useStoredLanguage();
  const copy = authCopy[language];
  const configured = isSupabaseConfigured();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState(configured ? "" : copy.configurationMissing);
  const [isError, setIsError] = useState(!configured);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    async function checkSession() {
      const result = await createClient().auth.getClaims();
      if (!result.data?.claims?.sub) router.replace("/forgot-password");
      else setCheckingSession(false);
    }

    void checkSession();
  }, [configured, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("passwordConfirmation") ?? "");
    setMessage("");
    setIsError(false);

    if (password !== confirmation) {
      setMessage(copy.mismatch);
      setIsError(true);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(getAuthErrorMessage(error, language));
        setIsError(true);
        return;
      }
      await supabase.auth.signOut();
      router.replace("/password-updated");
      router.refresh();
    } catch {
      setMessage(copy.genericError);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell cardClassName="auth-card-flow">
      <FlowHeading
        icon={<LockKeyhole size={31} />}
        title={copy.setPassword.title}
        description={<p>{copy.setPassword.description}</p>}
      />
      <form className="auth-form auth-flow-form" onSubmit={submit}>
        <label className="auth-field">
          <span>{copy.setPassword.newPassword}</span>
          <div>
            <LockKeyhole size={18} aria-hidden="true" />
            <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={copy.createPasswordPlaceholder} minLength={8} maxLength={128} required />
            <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? copy.hidePassword : copy.showPassword}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label className="auth-field">
          <span>{copy.confirmPassword}</span>
          <div>
            <LockKeyhole size={18} aria-hidden="true" />
            <input name="passwordConfirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder={copy.confirmationPlaceholder} minLength={8} maxLength={128} required />
            <button className="auth-password-toggle" type="button" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? copy.hideConfirmation : copy.showConfirmation}>
              {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <button className="auth-submit" type="submit" disabled={submitting || checkingSession}>
          {submitting || checkingSession ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
          {copy.setPassword.submitLabel}
        </button>
        <p className={`auth-form-message ${isError ? "is-error" : ""}`} aria-live="polite">{message}</p>
      </form>
    </AuthShell>
  );
}

export function PasswordUpdatedPage() {
  const { language } = useStoredLanguage();
  const copy = authCopy[language];

  return (
    <AuthShell cardClassName="auth-card-flow auth-card-success">
      <FlowHeading
        icon={<CheckCircle2 size={34} />}
        title={copy.passwordUpdated.title}
        description={<p>{copy.passwordUpdated.description}</p>}
      />
      <Link prefetch={true} className="auth-submit auth-success-link" href="/login">{copy.passwordUpdated.button}</Link>
    </AuthShell>
  );
}
