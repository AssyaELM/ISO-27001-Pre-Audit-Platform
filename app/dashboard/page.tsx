import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard | NormCore",
  description: "NormCore workspace dashboard after onboarding.",
  robots: { index: false, follow: false },
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
