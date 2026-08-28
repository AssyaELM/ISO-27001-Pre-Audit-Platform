import type { Metadata } from "next";
import { InvitationsPage } from "@/components/super-admin/super-admin-pages";
export const metadata: Metadata = { title: "Invitations & Tokens | NormCore", robots: { index: false, follow: false } };
export default function Page() { return <InvitationsPage />; }
