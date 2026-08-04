import type { Metadata } from "next";
import { CheckEmailPage, type EmailFlow } from "@/components/auth/auth-flow-pages";

export const metadata: Metadata = {
  title: "Check your email | NormCore",
  description: "Verify your secure NormCore email code.",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const params = await searchParams;
  const flow: EmailFlow = params.flow === "recovery" ? "recovery" : "signup";
  return <CheckEmailPage flow={flow} />;
}
