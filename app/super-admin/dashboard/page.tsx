import type { Metadata } from "next";
import { SuperAdminDashboard } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Super Admin Dashboard | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <SuperAdminDashboard />; }
