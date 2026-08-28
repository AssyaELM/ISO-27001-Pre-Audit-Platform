import type { Metadata } from "next";
import { OrganizationsPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Organizations | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <OrganizationsPage />; }
