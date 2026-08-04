import type { Metadata } from "next";
import { PasswordUpdatedPage } from "@/components/auth/auth-flow-pages";

export const metadata: Metadata = {
  title: "Password updated | NormCore",
  description: "Your NormCore password has been updated.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PasswordUpdatedPage />;
}
