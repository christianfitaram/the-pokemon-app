import { createSocket, Socket } from "node:dgram";

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

const counters = new Map<string, number>();
const statsdHost = process.env.STATSD_HOST?.trim() || null;
const statsdPort = Number(process.env.STATSD_PORT || "8125");
const metricsPrefix = process.env.METRICS_PREFIX?.trim() || "pokemon_app";
const shouldSendStatsD =
  process.env.METRICS_BACKEND === "statsd" || Boolean(statsdHost);
let statsdSocket: Socket | null = null;

function getStatsDSocket() {
  if (!shouldSendStatsD || !statsdHost) return null;
  if (!statsdSocket) {
    statsdSocket = createSocket("udp4");
    statsdSocket.unref();
  }
  return statsdSocket;
}

function toTagString(tags: Record<string, string | number | boolean> = {}) {
  const entries = Object.entries(tags)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}:${String(value)}`);

  return entries.length > 0 ? `|#${entries.join(",")}` : "";
}

function toMetricName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.]/g, "_");
}

function sendStatsDMetric(
  name: string,
  value: number,
  type: "c" | "ms",
  tags?: Record<string, string | number | boolean>
) {
  const socket = getStatsDSocket();
  if (!socket || !statsdHost || Number.isNaN(statsdPort)) {
    return;
  }

  const metric = `${metricsPrefix}.${toMetricName(name)}:${value}|${type}${toTagString(tags)}`;
  const payload = Buffer.from(metric);
  socket.send(payload, statsdPort, statsdHost, () => {
    // Ignore UDP send errors to keep observability non-blocking.
  });
}

export function startTimer(): number {
  return Date.now();
}

export function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

export function incrementCounter(counterName: string): number {
  const next = (counters.get(counterName) ?? 0) + 1;
  counters.set(counterName, next);
  sendStatsDMetric(counterName, 1, "c");
  return next;
}

export function observeDuration(
  metricName: string,
  durationMs: number,
  tags: Record<string, string | number | boolean> = {}
) {
  sendStatsDMetric(metricName, Math.max(0, Math.round(durationMs)), "ms", tags);
}

export function logEvent(level: LogLevel, event: string, payload: LogPayload = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
}

export function getCounterSnapshot(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}
