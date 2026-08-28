"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

export default function ActivatePasswordPage() {
  const router = useRouter();
  const [proof, setProof] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { const value = window.sessionStorage.getItem("normcore-activation-proof") ?? ""; if (!value) router.replace("/activate"); else setProof(value); }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter."); return; }
    if (!/[a-z]/.test(password)) { setError("Password must contain a lowercase letter."); return; }
    if (!/\d/.test(password)) { setError("Password must contain a number."); return; }
    if (!/[^A-Za-z\d]/.test(password)) { setError("Password must contain a special character."); return; }
    if (!passwordPattern.test(password)) { setError("Please enter a valid password."); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/activation/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proof, password }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) { setError(body.error ?? "Unable to activate this account. Please try again."); return; }
      window.sessionStorage.removeItem("normcore-activation-proof"); setDone(true); window.setTimeout(() => router.replace("/login?activated=1"), 900);
    } catch { setError("Unable to activate this account. Please try again."); }
    finally { setSubmitting(false); }
  }
  return <main style={{ minHeight: "100vh", background: "#edf7f6", display: "grid", placeItems: "center", padding: 24, color: "#062c3a", fontFamily: "Arial, sans-serif" }}><section style={{ width: "100%", maxWidth: 520, background: "#fff", border: "1px solid #cfe2e1", borderRadius: 14, padding: 40, boxShadow: "0 18px 45px rgba(6,44,58,.10)" }}><img src="/images/normcore-logo.png" width="145" alt="NormCore" style={{ display: "block", marginBottom: 34 }} /><h1 style={{ margin: "0 0 12px", fontSize: 30 }}>Create your password</h1><p style={{ color: "#294e5a", lineHeight: 1.6 }}>Your activation token has been verified. Create a password to finish setting up your account.</p><form onSubmit={submit} style={{ display: "grid", gap: 18, marginTop: 26 }}><label style={{ display: "grid", gap: 8, fontWeight: 700 }}>Password<input type="password" value={password} autoComplete="new-password" onChange={event => setPassword(event.target.value)} required style={{ height: 48, border: "1px solid #b9d6d5", borderRadius: 8, padding: "0 14px", fontSize: 16 }} /></label><label style={{ display: "grid", gap: 8, fontWeight: 700 }}>Confirm password<input type="password" value={confirmation} autoComplete="new-password" onChange={event => setConfirmation(event.target.value)} required style={{ height: 48, border: "1px solid #b9d6d5", borderRadius: 8, padding: "0 14px", fontSize: 16 }} /></label><p style={{ margin: 0, padding: 14, borderRadius: 8, background: "#eefaf8", color: "#285962", fontSize: 13, lineHeight: 1.6 }}>Minimum 8 characters<br />Uppercase and lowercase letters<br />At least one number and one special character</p><button type="submit" disabled={submitting || done} style={{ height: 48, border: 0, borderRadius: 8, background: "#11cbb3", color: "#062c3a", fontWeight: 700, opacity: submitting || done ? .65 : 1 }}>{submitting ? "Creating password…" : "Create password"}</button></form>{done ? <p style={{ background: "#e8f8f3", color: "#087970", padding: 14, borderRadius: 8 }}>Account activated successfully. Redirecting to sign in…</p> : null}{error ? <p style={{ background: "#fff0f2", color: "#b83f5c", padding: 14, borderRadius: 8 }}>{error}</p> : null}</section></main>;
}
