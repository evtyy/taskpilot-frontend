import { useEffect, useState } from "react";
import { checkHealth } from "../api/client";

export type BackendStatus = "checking" | "online" | "offline";

// Polls GET /health on an interval and exposes a live connection status.
// This doubles as a small demo of async polling + error handling.
export function useBackendStatus(intervalMs = 15000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      const ok = await checkHealth();
      if (!cancelled) setStatus(ok ? "online" : "offline");
    }

    ping();
    const id = setInterval(ping, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
