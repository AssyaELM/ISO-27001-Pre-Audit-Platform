"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { authCopy } from "@/content/auth";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthShell } from "./auth-shell";

type AuthMode = "login" | "signup";
type AuthPageProps = { mode: AuthMode; verified?: boolean };

const pendingEmailKey = "normcore-pending-auth-email";
const pendingFlowKey = "normcore-pending-auth-flow";

export function AuthPage({ mode, verified = false }: AuthPageProps) {
  const router = useRouter();
  const { language } = useStoredLanguage();
  const copy = authCopy[language];
  const modeCopy = copy[mode];
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!isSupabaseConfigured()) {
      setMessage(copy.configurationMissing);
      setIsError(true);
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (isSignup && password !== String(data.get("passwordConfirmation") ?? "")) {
      setMessage(copy.mismatch);
      setIsError(true);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const fullName = String(data.get("name") ?? "").trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, language } },
        });

        if (error) {
          setMessage(getAuthErrorMessage(error, language));
          setIsError(true);
          return;
        }

        window.sessionStorage.setItem(pendingEmailKey, email);
        window.sessionStorage.setItem(pendingFlowKey, "signup");
        router.push("/check-email?flow=signup");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(getAuthErrorMessage(error, language));
        setIsError(true);
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const safePath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/onboarding";
      router.replace(safePath);
      router.refresh();
    } catch {
      setMessage(copy.genericError);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell cardClassName={isSignup ? "auth-card-signup" : ""}>
      <div className="auth-form-heading">
        <h1 id="auth-title">{modeCopy.title}</h1>
        <p>{modeCopy.description}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup ? (
          <label className="auth-field">
            <span>{copy.fullName}</span>
            <div>
              <UserRound size={18} aria-hidden="true" />
              <input name="name" type="text" autoComplete="name" placeholder={copy.fullNamePlaceholder} maxLength={120} required />
            </div>
          </label>
        ) : null}

        <label className="auth-field">
          <span>{copy.workEmail}</span>
          <div>
            <Mail size={18} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" placeholder={copy.emailPlaceholder} maxLength={254} required />
          </div>
        </label>

        <label className="auth-field">
          <span>{copy.password}</span>
          <div>
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? copy.createPasswordPlaceholder : copy.passwordPlaceholder}
              minLength={8}
              maxLength={128}
              required
            />
            <button
              className="auth-password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {isSignup ? (
          <label className="auth-field">
            <span>{copy.confirmPassword}</span>
            <div>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                name="passwordConfirmation"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.confirmationPlaceholder}
                minLength={8}
                maxLength={128}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                aria-label={showConfirmation ? copy.hideConfirmation : copy.showConfirmation}
              >
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        ) : null}

        <div className="auth-form-options">
          <label className="auth-check">
            <input name={isSignup ? "terms" : "remember"} type="checkbox" required={isSignup} />
            <span aria-hidden="true"><Check size={12} /></span>
            {isSignup ? (
              <em>
                {copy.termsPrefix} <Link href="/terms">{copy.terms}</Link> {copy.termsAnd}{" "}
                <Link href="/privacy">{copy.privacy}</Link>.
              </em>
            ) : <em>{copy.remember}</em>}
          </label>

          {!isSignup ? <Link className="auth-text-button" href="/forgot-password">{copy.forgot}</Link> : null}
        </div>

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : null}
          {modeCopy.submitLabel}
        </button>

        <p className={`auth-form-message ${isError ? "is-error" : ""}`} aria-live="polite">
          {message || (mode === "login" && verified ? copy.login.verified : "")}
        </p>
      </form>

      <div className="auth-divider" aria-hidden="true">
        <span />{isSignup ? <em>{copy.or}</em> : null}<span />
      </div>

      <div className="auth-switch">
        <span>{isSignup ? copy.already : copy.newUser}</span>
        <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? copy.signIn : copy.createAccount}</Link>
      </div>
    </AuthShell>
  );
}
