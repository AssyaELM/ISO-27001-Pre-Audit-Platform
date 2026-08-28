import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign in | NormCore",
  description: "Sign in to your NormCore Annex A readiness workspace.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; next?: string }> }) {
  const params = await searchParams;
  return <AuthPage mode="login" verified={params.verified === "1"} nextPath={params.next} />;
}
