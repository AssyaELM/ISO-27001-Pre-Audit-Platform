import { redirect } from "next/navigation";
import { requireSuperAdmin, SuperAdminError } from "@/lib/super-admin/auth";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const identity = await requireSuperAdmin();
    return <SuperAdminShell identity={{ name: identity.name, email: identity.email, initials: identity.initials }}>{children}</SuperAdminShell>;
  } catch (cause) {
    if (cause instanceof SuperAdminError && cause.status === 403) redirect("/dashboard");
    redirect("/login?next=/super-admin/dashboard");
  }
}
