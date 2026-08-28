import Link from "next/link";
import { Clock3, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Access request | NormCore", robots: { index: false, follow: false } };

export default async function AccessStatusPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const rejected = status === "rejected";
  return <AuthShell>
    <div className="auth-form-heading access-status-heading">
      <span className={`access-status-icon ${rejected ? "is-rejected" : ""}`}>{rejected ? <XCircle /> : <Clock3 />}</span>
      <h1>{rejected ? "Access request not approved" : "Request submitted"}</h1>
      <p>{rejected
        ? "Your access request was not approved. Please contact the NormCore team if you believe this was unexpected."
        : "Your access request has been submitted. A NormCore administrator must approve your account before you can sign in."}</p>
    </div>
    <div className="auth-switch"><Link href="/login">Back to sign in</Link></div>
  </AuthShell>;
}
