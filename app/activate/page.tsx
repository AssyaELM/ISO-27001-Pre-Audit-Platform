"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => setToken(new URLSearchParams(window.location.search).get("token")?.toUpperCase() ?? ""), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/activation/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json() as { error?: string; proof?: string };
      if (!response.ok) { setError("Activation token is invalid or expired."); return; }
      if (!body.proof) { setError("Unable to continue secure activation."); return; }
      window.sessionStorage.setItem("normcore-activation-proof", body.proof);
      router.push("/activate/password");
    } catch { setError("Unable to verify the activation token. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <main style={{ minHeight: "100vh", background: "#edf7f6", display: "grid", placeItems: "center", padding: 24, color: "#062c3a", fontFamily: "Arial, sans-serif" }}><section style={{ width: "100%", maxWidth: 520, background: "#fff", border: "1px solid #cfe2e1", borderRadius: 14, padding: 40, boxShadow: "0 18px 45px rgba(6,44,58,.10)" }}><img src="/images/normcore-logo.png" width="145" alt="NormCore" style={{ display: "block", marginBottom: 34 }} /><h1 style={{ margin: "0 0 12px", fontSize: 30 }}>Activate your organization</h1><p style={{ color: "#294e5a", lineHeight: 1.6 }}>Enter the single-use activation token from your NormCore invitation.</p><form onSubmit={submit}><label style={{ display: "grid", gap: 8, marginTop: 24, fontWeight: 700 }}>Activation token<input value={token} onChange={(event) => setToken(event.target.value.toUpperCase())} required maxLength={12} minLength={12} style={{ height: 48, border: "1px solid #b9d6d5", borderRadius: 8, padding: "0 14px", color: "#062c3a", fontFamily: "Consolas, monospace", fontSize: 17, letterSpacing: 2 }} /></label><button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 22, height: 48, border: 0, borderRadius: 8, background: "#11cbb3", color: "#062c3a", fontWeight: 700, opacity: submitting ? .65 : 1 }}>{submitting ? "Verifying…" : "Activate account"}</button></form>{message ? <p style={{ background: "#e8f8f3", color: "#087970", padding: 14, borderRadius: 8, lineHeight: 1.5 }}>{message}</p> : null}{error ? <p style={{ background: "#fff0f2", color: "#b83f5c", padding: 14, borderRadius: 8 }}>{error}</p> : null}</section></main>;
}
