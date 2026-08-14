import type { BackendStatus } from "../hooks/useBackendStatus";

const COPY: Record<BackendStatus, string> = {
  checking: "connecting…",
  online: "backend online",
  offline: "backend unreachable",
};

export function ConnectionStatus({ status }: { status: BackendStatus }) {
  return (
    <div className={`status-pill status-pill--${status}`}>
      <span className="status-dot" />
      <span className="status-text">{COPY[status]}</span>
    </div>
  );
}
