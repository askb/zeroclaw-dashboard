// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import { RefreshCw, Monitor, Coffee, Users, Server, Wifi, WifiOff } from "lucide-react";

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle" | "offline";
  description?: string;
  skills?: string[];
}

const COLORS: Record<string, string> = {
  orchestrator: "#7c3aed",
  main: "#7c3aed",
  coder: "#3b82f6",
  researcher: "#10b981",
  security: "#ef4444",
  default: "#6b7280",
};

const STATUS_COLORS: Record<string, string> = {
  online: "#10b981",
  busy: "#f59e0b",
  idle: "#6b7280",
  offline: "#ef4444",
};

const ROOMS = {
  desks:   { x: 40, y: 60, w: 280, h: 200, label: "🖥️ Dev Area", color: "#16213e" },
  cooler:  { x: 380, y: 60, w: 180, h: 140, label: "☕ Break Room", color: "#0f3460" },
  meeting: { x: 40, y: 300, w: 220, h: 140, label: "🤝 War Room", color: "#1e1e3e" },
  server:  { x: 380, y: 240, w: 180, h: 200, label: "🖧 Server Room", color: "#1a2a1a" },
};

function statusToRoom(status: string): keyof typeof ROOMS {
  switch (status) {
    case "online": return "desks";
    case "busy": return "meeting";
    case "idle": return "cooler";
    default: return "server";
  }
}

export default function OfficePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [source, setSource] = useState<"live" | "mock">("mock");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 480 });

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
      setSource(data.source || "mock");
    } catch {
      setAgents([
        { id: "orchestrator", name: "Orchestrator", role: "Manager", status: "online" },
        { id: "coder", name: "Code Architect", role: "Developer", status: "busy" },
        { id: "researcher", name: "Researcher", role: "Analyst", status: "idle" },
        { id: "security", name: "Security", role: "Auditor", status: "online" },
      ]);
      setSource("mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); const i = setInterval(fetchAgents, 10000); return () => clearInterval(i); }, [fetchAgents]);

  // Animation tick
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 400); return () => clearInterval(i); }, []);

  // Responsive canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const w = Math.min(width - 32, 600);
      const h = Math.min(height - 32, 480);
      setCanvasSize({ w: Math.max(w, 300), h: Math.max(h, 240) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = canvasSize;
    const sx = w / 600, sy = h / 480;

    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#222244";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40 * sx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40 * sy) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Walls
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Rooms
    Object.values(ROOMS).forEach(room => {
      const rx = room.x * sx, ry = room.y * sy, rw = room.w * sx, rh = room.h * sy;
      ctx.fillStyle = room.color;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = "#2a2a4a";
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = "#666";
      ctx.font = `${Math.round(11 * sx)}px monospace`;
      ctx.fillText(room.label, rx + 8 * sx, ry + 18 * sy);
    });

    // Furniture hints
    // Desks
    for (let i = 0; i < 3; i++) {
      const dx = (70 + i * 80) * sx, dy = 120 * sy;
      ctx.fillStyle = "#2a2a4a";
      ctx.fillRect(dx, dy, 50 * sx, 20 * sy);
    }
    // Cooler
    ctx.fillStyle = "#0f4460";
    ctx.fillRect(440 * sx, 140 * sy, 20 * sx, 20 * sy);
    // Meeting table
    ctx.fillStyle = "#2a2a3e";
    ctx.fillRect(100 * sx, 350 * sy, 80 * sx, 40 * sy);

    // Group agents by room
    const roomAgents: Record<string, AgentData[]> = { desks: [], cooler: [], meeting: [], server: [] };
    agents.forEach(a => {
      const room = statusToRoom(a.status);
      roomAgents[room].push(a);
    });

    // Draw agents
    Object.entries(roomAgents).forEach(([roomKey, roomAs]) => {
      const room = ROOMS[roomKey as keyof typeof ROOMS];
      roomAs.forEach((agent, i) => {
        const cols = Math.ceil(Math.sqrt(roomAs.length));
        const row = Math.floor(i / cols), col = i % cols;
        const spacing = 60;
        const ax = (room.x + 40 + col * spacing) * sx;
        const ay = (room.y + 50 + row * spacing) * sy;
        const size = 14 * sx;
        const color = COLORS[agent.id] || COLORS.default;
        const isHovered = hoveredAgent === agent.id;

        // Idle bob animation
        let bobY = 0;
        if (agent.status === "idle") bobY = Math.sin(tick * 0.5 + i) * 2 * sy;

        // Agent sprite
        ctx.fillStyle = color;
        ctx.fillRect(ax - size / 2, ay - size / 2 + bobY, size, size);
        ctx.strokeStyle = isHovered ? "#fff" : "#000";
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeRect(ax - size / 2, ay - size / 2 + bobY, size, size);

        // Status dot
        const dotSize = 4 * sx;
        ctx.fillStyle = STATUS_COLORS[agent.status] || "#666";
        ctx.beginPath();
        ctx.arc(ax, ay - size / 2 - dotSize + bobY, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Blinking cursor for online agents
        if (agent.status === "online" && tick % 3 !== 0) {
          ctx.fillStyle = "#10b981";
          ctx.fillRect(ax + size / 2 + 3 * sx, ay - 3 * sy + bobY, 2 * sx, 8 * sy);
        }

        // Busy spinner
        if (agent.status === "busy") {
          const angle = tick * 0.8;
          const sr = 6 * sx;
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay + bobY, sr, angle, angle + Math.PI * 1.5);
          ctx.stroke();
        }

        // Name label
        ctx.fillStyle = "#e0e0e0";
        ctx.font = `${Math.round(10 * sx)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(agent.name.substring(0, 12), ax, ay + size / 2 + 14 * sy + bobY);
        ctx.textAlign = "start";
      });
    });

    // Server room decoration
    const srx = 400 * sx, sry = 280 * sy;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? "#10b981" : "#2a3a2a";
      ctx.fillRect(srx + i * 30 * sx, sry, 20 * sx, 40 * sy);
      // Blinking LED
      ctx.fillStyle = tick % (4 + i) < 2 ? "#10b981" : "#064e3b";
      ctx.fillRect(srx + 4 * sx + i * 30 * sx, sry + 4 * sy, 4 * sx, 4 * sy);
    }
    ctx.fillStyle = "#666";
    ctx.font = `${Math.round(9 * sx)}px monospace`;
    ctx.fillText("Gateway", srx, sry + 55 * sy);

  }, [agents, tick, canvasSize, hoveredAgent]);

  // Canvas mouse tracking for hover
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const { w, h } = canvasSize;
    const sx = w / 600, sy = h / 480;

    let found: string | null = null;
    const roomAgents: Record<string, AgentData[]> = { desks: [], cooler: [], meeting: [], server: [] };
    agents.forEach(a => roomAgents[statusToRoom(a.status)].push(a));

    Object.entries(roomAgents).forEach(([roomKey, roomAs]) => {
      const room = ROOMS[roomKey as keyof typeof ROOMS];
      roomAs.forEach((agent, i) => {
        const cols = Math.ceil(Math.sqrt(roomAs.length));
        const row = Math.floor(i / cols), col = i % cols;
        const ax = (room.x + 40 + col * 60) * sx;
        const ay = (room.y + 50 + row * 60) * sy;
        const size = 14 * sx;
        if (mx >= ax - size && mx <= ax + size && my >= ay - size && my <= ay + size) {
          found = agent.id;
        }
      });
    });
    setHoveredAgent(found);
  }, [agents, canvasSize]);

  const counts = {
    online: agents.filter(a => a.status === "online").length,
    busy: agents.filter(a => a.status === "busy").length,
    idle: agents.filter(a => a.status === "idle").length,
    offline: agents.filter(a => a.status === "offline").length,
  };

  return (
    <>
      <Header
        title="Office"
        subtitle="2D pixel-art office — agents at desks, coolers, and meetings"
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex flex-1 items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-accent-muted)]" />
              <span className="text-sm text-[var(--color-text-tertiary)]">Loading office...</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="rounded-xl border border-[var(--color-border)] cursor-crosshair"
              onMouseMove={onMouseMove}
              onMouseLeave={() => setHoveredAgent(null)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Agents</h3>
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${source === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"}`}>
                {source === "live" ? "📡 Live" : "🎭 Demo"}
              </span>
              <button onClick={fetchAgents} className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Counts */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { label: "Online", count: counts.online, icon: Monitor, color: "#10b981" },
              { label: "Busy", count: counts.busy, icon: Users, color: "#f59e0b" },
              { label: "Idle", count: counts.idle, icon: Coffee, color: "#6b7280" },
              { label: "Offline", count: counts.offline, icon: WifiOff, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-tertiary)] p-2">
                <s.icon className="h-3 w-3" style={{ color: s.color }} />
                <span className="text-xs text-[var(--color-text-secondary)]">{s.count} {s.label}</span>
              </div>
            ))}
          </div>

          {/* Agent list */}
          <div className="space-y-2">
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`rounded-lg border p-2 transition-colors ${
                  hoveredAgent === agent.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-primary)]"
                }`}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[agent.status] }}
                  />
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    {agent.name}
                  </span>
                </div>
                <div className="ml-4.5 mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                  {agent.role} · {agent.status}
                </div>
              </div>
            ))}
          </div>

          {/* Gateway status */}
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2">
            <div className="flex items-center gap-2">
              <Server className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-[var(--color-text-secondary)]">Gateway</span>
              <Wifi className="ml-auto h-3 w-3 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
