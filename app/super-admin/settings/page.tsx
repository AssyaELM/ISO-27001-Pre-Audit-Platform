import type { Metadata } from "next";
import { SettingsPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Super Admin Settings | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <SettingsPage />; }
