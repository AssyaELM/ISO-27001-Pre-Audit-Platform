"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./super-admin.module.css";
import notificationStyles from "./notifications.module.css";

const navigation = [
  ["/super-admin/dashboard", "Dashboard"],
  ["/super-admin/organizations", "Organizations"],
  ["/super-admin/invitations", "Invitations / Tokens"],
  ["/super-admin/activity", "Activity Log"],
  ["/super-admin/notifications", "Notifications"],
  ["/super-admin/settings", "Settings"],
] as const;

export function SuperAdminShell({ identity, children }: { identity: { name: string; email: string; initials: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [requests, setRequests] = useState<Array<{ id: string; full_name: string; email: string; requested_at: string }>>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewing, setReviewing] = useState("");
  const [toast, setToast] = useState("");

  const loadRequests = useCallback(async () => {
    const response = await fetch("/api/super-admin/access-requests?status=pending&limit=5", { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json() as { items: typeof requests; pendingCount: number };
    setRequests(result.items);
    setPendingCount(result.pendingCount);
  }, []);
  useEffect(() => { void loadRequests(); const timer = window.setInterval(loadRequests, 30_000); return () => window.clearInterval(timer); }, [loadRequests]);

  async function reviewRequest(id: string, action: "approve" | "reject") {
    setReviewing(id);
    try {
      const response = await fetch(`/api/super-admin/access-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json() as { error?: string; emailWarning?: string };
      if (!response.ok) { setToast(action === "approve" ? "Unable to approve this request. Please try again." : "Unable to reject this request. Please try again."); return; }
      setToast(result.emailWarning ? "Account approved, but approval email could not be sent." : action === "approve" ? "Access request approved" : "Access request rejected");
      await loadRequests();
      router.refresh();
    } catch { setToast(action === "approve" ? "Unable to approve this request. Please try again." : "Unable to reject this request. Please try again."); }
    finally { setReviewing(""); window.setTimeout(() => setToast(""), 4200); }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <div className={styles.shell}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/super-admin/dashboard"><Image src="/images/normcore-logo-symbol.png" width={29} height={29} alt="" priority /><span>NormCore</span></Link>
      <nav aria-label="Super Admin navigation">
        {navigation.map(([href, label]) => <Link key={href} href={href} className={pathname === href || (href === "/super-admin/organizations" && pathname.startsWith(`${href}/`)) ? styles.activeNav : ""}>{label}</Link>)}
      </nav>
      <div className={styles.headerActions}><div className={styles.notificationWrap}><button className={styles.headerIcon} aria-label={`${pendingCount} pending access requests`} onClick={()=>{setNotificationsOpen(value=>!value);setOpen(false)}}><Bell size={14} />{pendingCount?<span>{pendingCount>99?"99+":pendingCount}</span>:null}</button>{notificationsOpen?<div className={notificationStyles.dropdown}><div className={notificationStyles.dropdownHeader}><strong>Access requests</strong><small>{pendingCount} pending request{pendingCount===1?"":"s"}</small></div>{requests.length?requests.map(request=><article className={notificationStyles.item} key={request.id}><Link href={`/super-admin/notifications?request=${request.id}`} onClick={()=>setNotificationsOpen(false)}><span>New access request</span><strong>{request.full_name}</strong><small>{request.email}</small><time>{new Intl.RelativeTimeFormat("en",{numeric:"auto"}).format(-Math.max(1,Math.round((Date.now()-new Date(request.requested_at).getTime())/60000)),"minute")}</time></Link><div><button disabled={reviewing===request.id} onClick={()=>reviewRequest(request.id,"reject")}>Reject</button><button disabled={reviewing===request.id} onClick={()=>reviewRequest(request.id,"approve")}>Approve</button></div></article>):<p className={notificationStyles.empty}>No pending access requests.</p>}<Link className={notificationStyles.all} href="/super-admin/notifications" onClick={()=>setNotificationsOpen(false)}>View all notifications</Link></div>:null}</div><div className={styles.profileWrap}>
        <button className={styles.profileButton} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <span className={styles.avatar}>{identity.initials}</span><span className={styles.profileText}><strong>{identity.name}</strong><small>Super Admin</small></span><ChevronDown size={14} />
        </button>
        {open ? <div className={styles.profileMenu}><span>{identity.email}</span><Link href="/super-admin/settings">Settings</Link><button onClick={signOut}><LogOut size={15} />Sign out</button></div> : null}
      </div></div>
    </header>
    <main className={styles.main}>{children}</main>{toast ? <div className={notificationStyles.toast} role="status">{toast}</div> : null}
  </div>;
}
