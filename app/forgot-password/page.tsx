import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/auth/auth-flow-pages";

export const metadata: Metadata = {
  title: "Reset password | NormCore",
  description: "Request a secure NormCore password reset code.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForgotPasswordPage />;
}
