import type { Metadata } from "next";
import { AddOrganizationPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Add Organization | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <AddOrganizationPage />; }
