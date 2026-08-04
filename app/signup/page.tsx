import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create account | NormCore",
  description: "Create a secure NormCore Annex A readiness workspace.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}
