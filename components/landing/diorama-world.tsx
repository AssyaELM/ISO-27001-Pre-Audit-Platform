import {
  Bot,
  Building2,
  Check,
  Database,
  FileCheck2,
  FileText,
  Fingerprint,
  FolderLock,
  KeyRound,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type DioramaWorldProps = {
  activeScene: number;
  cameraProgress: number;
};

export function DioramaWorld({ activeScene, cameraProgress }: DioramaWorldProps) {
  const cameraX = (cameraProgress - 0.5) * -20;
  const cameraY = Math.sin(cameraProgress * Math.PI) * -14;
  const scale = 0.92 + cameraProgress * 0.2;

  return (
    <div className="diorama-viewport">
      <div className="world-grid" />
      {[0, 1, 2, 3, 4, 5].map((scene) => (
        <div
          key={scene}
          className={`diorama-scene scene-${scene} ${activeScene === scene ? "is-active" : ""}`}
          style={{
            transform: `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${scale})`,
          }}
        >
          {scene === 0 && <ProductDiorama />}
          {scene === 1 && <ProblemDiorama />}
          {scene === 2 && <JourneyDiorama />}
          {scene === 3 && <DomainsDiorama />}
          {scene === 4 && <ActionDiorama />}
          {scene === 5 && <ReadinessDiorama />}
        </div>
      ))}
      <div className="atmosphere atmosphere-one" />
      <div className="atmosphere atmosphere-two" />
    </div>
  );
}

function Island({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`diorama-island ${className}`}>{children}</div>;
}

function ProductDiorama() {
  return (
    <Island className="island-product">
      <div className="world-building building-main">
        <span className="building-glow" />
        <ShieldCheck size={34} />
      </div>
      <div className="world-building building-left"><FileText size={25} /></div>
      <div className="world-building building-right"><Database size={25} /></div>
      <div className="data-bridge bridge-left" />
      <div className="data-bridge bridge-right" />
      <div className="signal-node node-one" />
      <div className="signal-node node-two" />
      <div className="signal-node node-three" />
    </Island>
  );
}

function ProblemDiorama() {
  return (
    <Island className="island-problem">
      <div className="paper-stack paper-a"><FileText size={23} /></div>
      <div className="paper-stack paper-b"><FolderLock size={23} /></div>
      <div className="paper-stack paper-c"><ScanSearch size={23} /></div>
      <div className="gap-line gap-a" />
      <div className="gap-line gap-b" />
      <div className="gap-line gap-c" />
      <div className="risk-beacon beacon-a" />
      <div className="risk-beacon beacon-b" />
      <div className="world-building problem-center"><ShieldCheck size={32} /></div>
    </Island>
  );
}

function JourneyDiorama() {
  const nodes = [Building2, FileCheck2, ScanSearch, Check];
  return (
    <Island className="island-journey">
      <div className="journey-path" />
      {nodes.map((Icon, index) => (
        <div className={`journey-node journey-node-${index + 1}`} key={index}>
          <span>{index + 1}</span>
          <Icon size={23} />
        </div>
      ))}
      <div className="path-orb orb-a" />
      <div className="path-orb orb-b" />
    </Island>
  );
}

function DomainsDiorama() {
  const domains = [
    { Icon: Building2, className: "domain-org" },
    { Icon: UsersRound, className: "domain-people" },
    { Icon: KeyRound, className: "domain-physical" },
    { Icon: Network, className: "domain-tech" },
  ];
  return (
    <Island className="island-domains">
      <div className="domain-hub"><ShieldCheck size={31} /></div>
      {domains.map(({ Icon, className }) => (
        <div className={`domain-tower ${className}`} key={className}>
          <Icon size={25} />
        </div>
      ))}
      <div className="domain-ring" />
    </Island>
  );
}

function ActionDiorama() {
  return (
    <Island className="island-action">
      <div className="action-bay evidence-bay"><FolderLock size={27} /></div>
      <div className="action-bay remediation-bay"><FileCheck2 size={27} /></div>
      <div className="action-bay document-bay"><FileText size={27} /></div>
      <div className="human-console"><Fingerprint size={29} /></div>
      <div className="ai-core"><Bot size={31} /><span /></div>
      <div className="approval-gate"><ShieldCheck size={25} /></div>
      <div className="ai-line ai-line-a" />
      <div className="ai-line ai-line-b" />
    </Island>
  );
}

function ReadinessDiorama() {
  return (
    <Island className="island-readiness">
      <div className="readiness-vault"><ShieldCheck size={36} /></div>
      <div className="vault-ring ring-a" />
      <div className="vault-ring ring-b" />
      <div className="ready-card ready-a"><FileCheck2 size={22} /></div>
      <div className="ready-card ready-b"><Database size={22} /></div>
      <div className="ready-card ready-c"><Sparkles size={22} /></div>
      <div className="ready-check"><Check size={25} /></div>
    </Island>
  );
}
