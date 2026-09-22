import type { Metadata } from "next";

import { ClientSettingsPage } from "@/components/settings/client-settings-page";

export const metadata: Metadata = {
  title: "Settings | NormCore",
  description: "Manage your NormCore profile, organization, security and preferences.",
  robots: { index: false, follow: false },
};

export default function SettingsRoute() {
  return <ClientSettingsPage />;
}
