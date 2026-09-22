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
import { useStoredLanguage } from "@/components/language-preference";

type AppSidebarProps = {
  organization?: string;
  workspaceId?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

const navigation = [
  [LayoutDashboard, "Dashboard", "Tableau de bord", "/dashboard"],
  [ClipboardList, "Assessment", "Évaluation", "/assessment"],
  [Gauge, "Gap Analysis", "Analyse des écarts", "/gap-analysis"],
  [Check, "Remediation Plan", "Plan de remédiation", "/remediation-plan"],
  [FolderOpen, "Evidence Room", "Salle des preuves", "/evidence-room"],
  [Sparkles, "AI Documents", "Documents IA", "/ai-documents"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/assessment" && pathname.startsWith(`${href}/`));
}

export function AppSidebar({ organization = "", workspaceId, mobileOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { language } = useStoredLanguage();
  const french = language === "fr";
  const status = workspaceId ? (french ? "Espace actif" : "Active workspace") : (french ? "Configuration" : "Setup");

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
        {navigation.map(([Icon, labelEn, labelFr, href]) => (
          <Link key={href} prefetch={true} href={href} className={isActive(pathname, href) ? styles.active : ""} onClick={onClose}>
            <Icon aria-hidden="true" /><span>{french ? labelFr : labelEn}</span>
          </Link>
        ))}
      </nav>
      <Link className={`${styles.settings} ${pathname === "/settings" ? styles.active : ""}`} prefetch={true} href="/settings" onClick={onClose}><Settings aria-hidden="true" /><span>{french ? "Paramètres" : "Settings"}</span></Link>
    </aside>
  );
}
