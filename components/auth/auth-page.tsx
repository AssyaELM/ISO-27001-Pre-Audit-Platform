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
import { FormEvent, useEffect, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { authCopy } from "@/content/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolvePostAuthDestination, resolveSafeDestination } from "@/lib/auth/destination";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "./auth-shell";

type AuthMode = "login" | "signup";
type AuthPageProps = { mode: AuthMode; verified?: boolean; nextPath?: string };

const pendingEmailKey = "normcore-pending-auth-email";
const pendingFlowKey = "normcore-pending-auth-flow";
const workspaceStorageKey = "normcore-onboarding-organization-v1";

type AuthResult = {
  destination?: string;
  error?: string;
  accessStatus?: "pending" | "rejected";
  offlineFallback?: boolean;
  metadata?: Record<string, unknown>;
};

function isNetworkAuthError(error: unknown) {
  return error instanceof Error && (error.message === "fetch failed" || error.message.includes("fetch failed"));
}

function persistAuthContext(result: AuthResult, email: string) {
  if (result.offlineFallback) {
    window.localStorage.setItem("normcore-local-auth", "1");
    window.localStorage.setItem("normcore-local-auth-email", email);
  } else {
    window.localStorage.removeItem("normcore-local-auth");
    window.localStorage.removeItem("normcore-local-auth-email");
  }

  if (result.metadata) {
    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(result.metadata));
    window.localStorage.setItem(`${workspaceStorageKey}:${email}`, JSON.stringify(result.metadata));
  }
}

export function AuthPage({ mode, verified = false, nextPath }: AuthPageProps) {
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

    try {
      if (isSignup) {
        const fullName = String(data.get("name") ?? "").trim();
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: fullName, language }),
        });
        const result = await response.json() as AuthResult;
        if (!response.ok) {
          setMessage(result.error ?? copy.genericError);
          setIsError(true);
          return;
        }

        if (result.destination === "/check-email?flow=signup") {
          window.sessionStorage.setItem(pendingEmailKey, email);
          window.sessionStorage.setItem(pendingFlowKey, "signup");
        }

        persistAuthContext(result, email);

        router.push(result.destination ?? "/check-email?flow=signup");
        return;
      }

      let result: AuthResult;
      let responseOk = false;
      try {
        // Authenticate in the browser first so the real Supabase user metadata
        // always wins over any stale local fallback state.
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
        if (!sessionError && sessionData.user) {
          const roleResponse = await fetch(`/api/auth/current${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`, { cache: "no-store" });
          const roleResult = await roleResponse.json() as AuthResult;
          if (!roleResponse.ok) {
            if (roleResult.accessStatus) {
              await supabase.auth.signOut();
              router.replace(roleResult.destination ?? `/access-status?status=${roleResult.accessStatus}`);
              return;
            }
            setMessage(roleResult.error ?? copy.genericError);
            setIsError(true);
            return;
          }
          result = {
            destination: roleResult?.destination ?? resolvePostAuthDestination(nextPath, sessionData.user.user_metadata),
            offlineFallback: false,
            metadata: sessionData.user.user_metadata as Record<string, unknown>,
          };
          persistAuthContext(result, email);
          router.replace(resolveSafeDestination(result.destination));
          router.refresh();
          return;
        }
        if (sessionError && !isNetworkAuthError(sessionError)) {
          setMessage(sessionError.message || copy.genericError);
          setIsError(true);
          return;
        }
      } catch (error) {
        if (!isNetworkAuthError(error)) throw error;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nextPath }),
      });
      result = await response.json() as AuthResult;
      responseOk = response.ok;
      if (!responseOk) {
        setMessage(result.error ?? copy.genericError);
        setIsError(true);
        return;
      }

      persistAuthContext(result, email);

      const destination = resolveSafeDestination(result.destination ?? nextPath);
      router.replace(destination);
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
                {copy.termsPrefix} <Link prefetch={true} href="/terms">{copy.terms}</Link> {copy.termsAnd}{" "}
                <Link prefetch={true} href="/privacy">{copy.privacy}</Link>.
              </em>
            ) : <em>{copy.remember}</em>}
          </label>

          {!isSignup ? <Link prefetch={true} className="auth-text-button" href="/forgot-password">{copy.forgot}</Link> : null}
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
        <Link prefetch={true} href={isSignup ? "/login" : "/signup"}>{isSignup ? copy.signIn : copy.createAccount}</Link>
      </div>
    </AuthShell>
  );
}
