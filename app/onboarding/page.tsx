import type { Metadata } from "next";
import { OrganizationOnboarding } from "@/components/onboarding/organization-onboarding";

export const metadata: Metadata = {
  title: "Organization onboarding | NormCore",
  description: "Set up your NormCore organization readiness workspace.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OrganizationOnboarding />;
}

