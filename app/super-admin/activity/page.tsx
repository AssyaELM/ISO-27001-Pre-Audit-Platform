import type { Metadata } from "next";
import { ActivityLogPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Activity Log | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <ActivityLogPage />; }
