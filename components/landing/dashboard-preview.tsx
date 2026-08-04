"use client";

import { ArrowUpRight, Check, ChevronRight, Circle } from "lucide-react";
import { useLanguage } from "./language-context";

export function DashboardPreview() {
  const { dashboard } = useLanguage().copy;

  return (
    <div className="dashboard-shell" aria-label={`${dashboard.title}, ${dashboard.demoLabel}`}>
      <div className="dashboard-topbar">
        <div className="dashboard-title">
          <span className="mini-mark"><Check size={12} /></span>
          <span>{dashboard.title}</span>
        </div>
        <span className="demo-label">{dashboard.demoLabel}</span>
      </div>

      <div className="dashboard-body">
        <div className="overall-progress">
          <div className="overall-copy">
            <span>{dashboard.overallLabel}</span>
            <strong>{dashboard.overallValue}%</strong>
          </div>
          <div className="progress-ring" style={{ "--progress": dashboard.overallValue } as React.CSSProperties}>
            <span>{dashboard.overallValue}%</span>
          </div>
        </div>

        <div className="domain-progress-list">
          {dashboard.domains.map((domain, index) => (
            <div className="domain-progress-row" key={domain.name}>
              <span className={`domain-dot domain-dot-${index + 1}`}><Circle size={8} fill="currentColor" /></span>
              <div className="domain-progress-main">
                <div>
                  <span>{domain.name}</span>
                  <strong>{domain.value}%</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${domain.value}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="next-action-card">
          <span className="next-icon"><ArrowUpRight size={18} /></span>
          <div>
            <small>{dashboard.nextLabel}</small>
            <strong>{dashboard.nextAction}</strong>
          </div>
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}
