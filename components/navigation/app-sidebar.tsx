"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ClipboardList,
  Building2,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import styles from "./app-sidebar.module.css";
import { NormCoreLogo } from "@/components/branding/normcore-logo";

type AppSidebarProps = {
  organization?: string;
  workspaceId?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

const navigation = [
  [LayoutDashboard, "Dashboard", "/dashboard"],
  [ClipboardList, "Assessment", "/assessment"],
  [Gauge, "Gap Analysis", "/gap-analysis"],
  [Check, "Remediation Plan", "/remediation-plan"],
  [FolderOpen, "Evidence Room", "/evidence-room"],
  [Sparkles, "AI Documents", "/ai-documents"],
] as const;

function isActive(pathname: string, href: string) {
  return href === "/assessment" ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
}

export function AppSidebar({ organization = "", workspaceId, mobileOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const status = workspaceId ? "Active workspace" : "Setup";

  return (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
      <Link className={styles.brand} href="/dashboard" aria-label="NormCore home" onClick={onClose}>
        <NormCoreLogo width={188} height={52} priority />
      </Link>
      <div className={styles.workspace}>
        <Building2 className={styles.workspaceIcon} aria-hidden="true" />
        <div><strong>{organization || "Workspace"}</strong><small><i />{status}</small></div>
      </div>
      <nav aria-label="Application navigation">
        {navigation.map(([Icon, label, href]) => (
          <Link key={href} href={href} className={isActive(pathname, href) ? styles.active : ""} onClick={onClose}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <Link className={styles.settings} href="/dashboard" onClick={onClose}><Settings aria-hidden="true" /><span>Settings</span></Link>
    </aside>
  );
}
