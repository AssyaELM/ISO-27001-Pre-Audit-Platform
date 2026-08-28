import type { Metadata } from "next";
import { OrganizationDetailPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Organization Details | NormCore", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <OrganizationDetailPage id={id} />; }
