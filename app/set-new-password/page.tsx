import type { Metadata } from "next";
import { SetNewPasswordPage } from "@/components/auth/auth-flow-pages";

export const metadata: Metadata = {
  title: "Set a new password | NormCore",
  description: "Securely update your NormCore password.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SetNewPasswordPage />;
}
