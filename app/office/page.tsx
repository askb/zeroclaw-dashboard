// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import type { Agent } from "@/lib/types";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const POLL_MS = 10_000;
const SPRITE = 12;
const DOT_R = 2;
const MOBILE_BP = 768;

/** Role → sprite colour (orchestrator=purple, coder=blue, etc.) */
const ROLE_CLR: Record<string, string> = {
  orchestrator: "#9b59b6",
  coder: "#3498db",
  researcher: "#2ecc71",
  security: "#e74c3c",
};

/** Status → indicator dot colour */
const STAT_CLR: Record<string, string> = {
  online: "#22c55e",
  busy: "#eab308",
  idle: "#8b8b9e",
  offline: "#ef4444",
};

/** Status → human-readable room name */
const LOC: Record<string, string> = {
  online: "Main Desk",
  busy: "Meeting Room",
  idle: "Water Cooler",
  offline: "Offline",
};

/* Retro pixel-art colour palette */
const PAL = {
  floor: "#1a1a2e",
  walls: "#2a2a4a",
  grid: "#222244",
  desk: "#16213e",
  cooler: "#0f3460",
  meeting: "#1e1e3e",
  server: "#1a2a1a",
  txt: "#ededef",
  dim: "#5e5e72",
} as const;

interface RoomDef {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill: string;
}

/** Room rectangles as fractions of canvas size */
const ROOMS: Record<string, RoomDef> = {
  desk: {
    x: 0.02,
    y: 0.02,
    w: 0.58,
    h: 0.44,
    label: "MAIN DESK AREA",
    fill: PAL.desk,
  },
  cooler: {
    x: 0.64,
    y: 0.02,
    w: 0.34,
    h: 0.4,
    label: "WATER COOLER",
    fill: PAL.cooler,
  },
  meeting: {
    x: 0.02,
    y: 0.52,
    w: 0.58,
    h: 0.46,
    label: "MEETING ROOM",
    fill: PAL.meeting,
  },
  server: {
    x: 0.64,
    y: 0.48,
    w: 0.34,
    h: 0.5,
    label: "SERVER ROOM",
    fill: PAL.server,
  },
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function agentColor(a: Agent): string {
  const k = a.id.toLowerCase();
  if (k.includes("orchestrator") || k.includes("manager") || k.includes("main"))
    return ROLE_CLR.orchestrator;
  if (k.includes("code") || k.includes("architect")) return ROLE_CLR.coder;
  if (k.includes("research")) return ROLE_CLR.researcher;
  if (k.includes("security")) return ROLE_CLR.security;
  return "#7f8c8d";
}

function roomForStatus(s: string): string {
  switch (s) {
    case "online":
      return "desk";
    case "busy":
      return "meeting";
    case "idle":
      return "cooler";
    default:
      return "desk";
  }
}

/* ================================================================== */
/*  Canvas painter (pure – no React dependency)                        */
/* ================================================================== */

function paint(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  agents: Agent[],
  gwOk: boolean,
  t: number,
) {
  /* ---- floor ---- */
  ctx.fillStyle = PAL.floor;
  ctx.fillRect(0, 0, W, H);

  /* ---- subtle pixel grid ---- */
  ctx.strokeStyle = PAL.grid;
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx <= W; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy <= H; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  /* ---- rooms ---- */
  for (const r of Object.values(ROOMS)) {
    const rx = r.x * W;
    const ry = r.y * H;
    const rw = r.w * W;
    const rh = r.h * H;
    ctx.fillStyle = r.fill;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = PAL.walls;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillStyle = PAL.dim;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(r.label, rx + 8, ry + 6);
  }

  /* ---- outer walls ---- */
  ctx.strokeStyle = PAL.walls;
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  /* ---- furniture hints ---- */
  {
    const rm = ROOMS.desk;
    const rx = rm.x * W;
    const ry = rm.y * H;
    const rw = rm.w * W;
    const rh = rm.h * H;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#2a2a4a";
      ctx.fillRect(rx + rw * 0.1 + i * rw * 0.28, ry + rh * 0.45, rw * 0.22, rh * 0.12);
    }
  }
  {
    const rm = ROOMS.meeting;
    const rx = rm.x * W;
    const ry = rm.y * H;
    const rw = rm.w * W;
    const rh = rm.h * H;
    ctx.fillStyle = "#2a2a3e";
    ctx.fillRect(rx + rw * 0.25, ry + rh * 0.35, rw * 0.5, rh * 0.3);
  }
  {
    const rm = ROOMS.cooler;
    const rx = rm.x * W;
    const ry = rm.y * H;
    const rw = rm.w * W;
    const rh = rm.h * H;
    ctx.fillStyle = "#1a4a6a";
    ctx.fillRect(rx + rw * 0.7, ry + rh * 0.6, rw * 0.15, rh * 0.2);
  }

  /* ---- server-room racks ---- */
  {
    const rm = ROOMS.server;
    const rx = rm.x * W;
    const ry = rm.y * H;
    const rw = rm.w * W;
    const rh = rm.h * H;
    const n = 3;
    const rackW = 16;
    const rackH = 30;
    const gap = (rw - n * rackW) / (n + 1);
    for (let i = 0; i < n; i++) {
      const sx = rx + gap + i * (rackW + gap);
      const sy = ry + rh * 0.38;
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(sx, sy, rackW, rackH);
      ctx.strokeStyle = "#2a4a2a";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, rackW, rackH);
      const on1 = Math.sin(t / 300 + i * 1.5) > 0;
      ctx.fillStyle = gwOk
        ? on1
          ? "#22c55e"
          : "#0a3a0a"
        : on1
          ? "#ef4444"
          : "#3a0a0a";
      ctx.fillRect(sx + 3, sy + 5, 4, 3);
      ctx.fillRect(sx + 9, sy + 5, 4, 3);
      ctx.fillStyle = Math.sin(t / 500 + i * 2) > 0 ? "#3b82f6" : "#0a0a3a";
      ctx.fillRect(sx + 3, sy + 11, 4, 3);
    }
    ctx.fillStyle = gwOk ? "#22c55e" : "#ef4444";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(gwOk ? "GW ONLINE" : "GW OFFLINE", rx + 8, ry + rh - 8);
  }

  /* ---- agent sprites ---- */
  const groups: Record<string, Agent[]> = {};
  for (const a of agents) {
    if (a.status === "offline") continue;
    const key = roomForStatus(a.status);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  for (const [key, list] of Object.entries(groups)) {
    const rm = ROOMS[key];
    if (!rm) continue;
    const rx = rm.x * W;
    const ry = rm.y * H;
    const rw = rm.w * W;
    const rh = rm.h * H;
    const cols = Math.max(1, Math.ceil(Math.sqrt(list.length)));
    const rows = Math.max(1, Math.ceil(list.length / cols));
    const cellW = rw / (cols + 1);
    const cellH = (rh - 24) / (rows + 1);

    list.forEach((agent, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = rx + cellW * (col + 1) - SPRITE / 2;
      let ay = ry + 24 + cellH * (row + 0.5) - SPRITE / 2;

      /* idle bob (1px up/down every ~500ms) */
      if (agent.status === "idle") {
        ay += Math.sin(t / 500 + i * 1.2) * 1.5;
      }

      /* sprite body (12×12 coloured square) */
      ctx.fillStyle = agentColor(agent);
      ctx.fillRect(ax, ay, SPRITE, SPRITE);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ax, ay, SPRITE, SPRITE);

      /* status dot (4px) above sprite */
      ctx.fillStyle = STAT_CLR[agent.status] ?? "#8b8b9e";
      ctx.beginPath();
      ctx.arc(ax + SPRITE / 2, ay - 5, DOT_R, 0, Math.PI * 2);
      ctx.fill();

      /* blinking cursor for online agents (toggles every 600ms) */
      if (agent.status === "online" && Math.floor(t / 600) % 2 === 0) {
        ctx.fillStyle = PAL.txt;
        ctx.fillRect(ax + SPRITE + 3, ay + 2, 2, 8);
      }

      /* spinning indicator for busy agents */
      if (agent.status === "busy") {
        const angle = (t / 200) % (Math.PI * 2);
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ax + SPRITE + 7, ay + SPRITE / 2, 4, angle, angle + Math.PI * 1.5);
        ctx.stroke();
      }

      /* name below sprite (10px monospace) */
      ctx.fillStyle = PAL.txt;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(agent.name, ax + SPRITE / 2, ay + SPRITE + 3);
      ctx.textAlign = "left";
    });
  }
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

interface GwStatus {
  ok: boolean;
  status: string;
  agentCount: number;
  sessionCount: number;
}

export default function OfficePage() {
  /* ---- refs (shared with animation loop) ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const dataRef = useRef<{ agents: Agent[]; gwOk: boolean }>({
    agents: [],
    gwOk: false,
  });
  const sizeRef = useRef({ w: 600, h: 480 });

  /* ---- state ---- */
  const [agents, setAgents] = useState<Agent[]>([]);
  const [source, setSource] = useState<"live" | "mock">("mock");
  const [gw, setGw] = useState<GwStatus>({
    ok: false,
    status: "unknown",
    agentCount: 0,
    sessionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(Date.now());

  /* keep animation-loop refs in sync with React state */
  useEffect(() => {
    dataRef.current = { agents, gwOk: gw.ok };
  }, [agents, gw.ok]);

  /* ---- data polling (agents + gateway every 10 s) ---- */
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const [aRes, gRes] = await Promise.all([
          fetch("/api/agents"),
          fetch("/api/gateway"),
        ]);
        if (!alive) return;
        const aJson = await aRes.json();
        const gJson = await gRes.json();
        setAgents(aJson.agents ?? []);
        setSource(aJson.source ?? "mock");
        setGw({
          ok: gJson.ok ?? false,
          status: gJson.status ?? "unknown",
          agentCount: gJson.agentCount ?? 0,
          sessionCount: gJson.sessionCount ?? 0,
        });
        setLastUpdated(new Date());
      } catch {
        /* keep stale data on network failure */
      } finally {
        if (alive) setLoading(false);
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ---- "seconds ago" ticker ---- */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  /* ---- responsive canvas + mobile breakpoint ---- */
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < MOBILE_BP);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const wrap = wrapRef.current;
    if (!wrap) {
      return () => window.removeEventListener("resize", checkMobile);
    }

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width < 1 || height < 1) continue;
        sizeRef.current = { w: width, h: height };
        const cvs = canvasRef.current;
        if (cvs) {
          const dpr = window.devicePixelRatio || 1;
          cvs.width = Math.floor(width * dpr);
          cvs.height = Math.floor(height * dpr);
          cvs.style.width = `${width}px`;
          cvs.style.height = `${height}px`;
        }
      }
    });
    ro.observe(wrap);

    return () => {
      window.removeEventListener("resize", checkMobile);
      ro.disconnect();
    };
  }, []);

  /* ---- animation loop (requestAnimationFrame) ---- */
  useEffect(() => {
    if (loading || isMobile) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const c = ctx; // capture narrowed non-null type for closure
    let active = true;
    function frame(t: number) {
      if (!active) return;
      const dpr = window.devicePixelRatio || 1;
      const { w, h } = sizeRef.current;
      c.save();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(c, w, h, dataRef.current.agents, dataRef.current.gwOk, t);
      c.restore();
      frameRef.current = requestAnimationFrame(frame);
    }

    frameRef.current = requestAnimationFrame(frame);
    return () => {
      active = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [loading, isMobile]);

  /* ---- derived values ---- */
  const counts = agents.reduce<Record<string, number>>((m, a) => {
    m[a.status] = (m[a.status] ?? 0) + 1;
    return m;
  }, {});

  const agoSec =
    lastUpdated != null
      ? Math.max(0, Math.round((now - lastUpdated.getTime()) / 1000))
      : null;

  /* ---- loading screen ---- */
  if (loading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title="Office"
          subtitle="2D pixel-art office — agents at desks, coolers, and meetings"
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-accent-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Loading office…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---- main layout ---- */
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Office"
        subtitle="2D pixel-art office — agents at desks, coolers, and meetings"
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ---- Canvas / mobile fallback ---- */}
        {!isMobile ? (
          <div className="relative flex-1 p-4">
            <div
              ref={wrapRef}
              className="h-full w-full overflow-hidden rounded-lg border border-[var(--color-border-subtle)]"
            >
              <canvas ref={canvasRef} className="block" />
            </div>
            <div
              className="absolute left-7 top-7 rounded px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
              style={{ backgroundColor: "rgba(26, 26, 36, 0.85)" }}
            >
              {source === "live" ? "📡 Live" : "🎭 Demo"}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            <span className="mb-2 inline-block rounded bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
              {source === "live" ? "📡 Live" : "🎭 Demo"}
            </span>
            {agents.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STAT_CLR[a.status] }}
                />
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: agentColor(a) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {a.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {a.role} · {LOC[a.status] ?? a.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---- Sidebar ---- */}
        <aside className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
          {/* Gateway health */}
          <section>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Gateway
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: gw.ok ? "#22c55e" : "#ef4444" }}
              />
              <span className="text-xs text-[var(--color-text-secondary)]">
                {gw.ok ? "Connected" : "Disconnected"}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              {gw.agentCount} agent{gw.agentCount !== 1 ? "s" : ""} ·{" "}
              {gw.sessionCount} session{gw.sessionCount !== 1 ? "s" : ""}
            </p>
          </section>

          {/* Status counts */}
          <section>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(["online", "busy", "idle", "offline"] as const).map((s) => (
                <div
                  key={s}
                  className="rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-center"
                >
                  <span className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--color-text-primary)]">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: STAT_CLR[s] }}
                    />
                    {counts[s] ?? 0}
                  </span>
                  <p className="text-[9px] capitalize text-[var(--color-text-tertiary)]">
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Agent list */}
          <section className="flex-1">
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Agents
            </h3>
            <div className="space-y-1">
              {agents.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-[var(--color-bg-hover)]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STAT_CLR[a.status] }}
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: agentColor(a) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                      {a.name}
                    </p>
                    <p className="truncate text-[9px] text-[var(--color-text-tertiary)]">
                      {LOC[a.status] ?? a.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Last updated */}
          {agoSec != null && (
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              Last updated: {agoSec}s ago
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
