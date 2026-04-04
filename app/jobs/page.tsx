// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import {
  Hammer,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  ExternalLink,
} from "lucide-react";
import type { CodingJob, JobsResponse } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 30_000;

const ALLOWED_REPOS = [
  "askb/zeroclaw-mission-control",
  "askb/zeroclaw-dashboard",
  "askb/askb-ha-config",
];

const ALLOWED_MODELS = [
  { value: "openrouter/moonshotai/kimi-k2", label: "Kimi K2" },
  { value: "openrouter/google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "openrouter/deepseek/deepseek-r1", label: "DeepSeek R1" },
];

type JobStatus = CodingJob["status"];

const STATUS_CONFIG: Record<
  JobStatus,
  { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  queued: {
    color: "text-[var(--color-text-tertiary)]",
    bg: "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-tertiary)]",
    icon: Clock,
  },
  started: {
    color: "text-blue-400",
    bg: "bg-blue-500/15 text-blue-400",
    icon: Loader2,
  },
  coding: {
    color: "text-blue-400",
    bg: "bg-blue-500/15 text-blue-400",
    icon: Loader2,
  },
  completed: {
    color: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
    icon: CheckCircle2,
  },
  partial: {
    color: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
    icon: AlertTriangle,
  },
  no_changes: {
    color: "text-[var(--color-text-tertiary)]",
    bg: "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-tertiary)]",
    icon: Clock,
  },
  rejected: {
    color: "text-[var(--color-text-tertiary)]",
    bg: "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-tertiary)]",
    icon: XCircle,
  },
  failed: {
    color: "text-[var(--color-error)]",
    bg: "bg-[var(--color-error)]/15 text-[var(--color-error)]",
    icon: XCircle,
  },
  timeout: {
    color: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
    icon: AlertTriangle,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}

function shortId(jobId: string): string {
  return jobId.slice(0, 8);
}

function modelLabel(model: string): string {
  const found = ALLOWED_MODELS.find((m) => m.value === model);
  if (found) return found.label;
  const parts = model.split("/");
  return parts[parts.length - 1] || model;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
  const Icon = config.icon;
  const isAnimated = status === "started" || status === "coding";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg}`}
    >
      <Icon className={`h-3 w-3 ${isAnimated ? "animate-spin" : ""}`} />
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <div>
        <div className="text-lg font-semibold text-[var(--color-text-primary)]">
          {value}
        </div>
        <div className="text-[10px] text-[var(--color-text-tertiary)]">
          {label}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3">
      <div className="h-4 w-4 rounded bg-[var(--color-bg-tertiary)]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--color-bg-tertiary)]" />
      </div>
      <div className="h-5 w-16 rounded-full bg-[var(--color-bg-tertiary)]" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-subtle)] py-16 text-center">
      <Hammer className="mb-3 h-8 w-8 text-[var(--color-text-tertiary)]" />
      <p className="text-sm text-[var(--color-text-secondary)]">
        No coding jobs yet.
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        Launch your first autonomous job!
      </p>
    </div>
  );
}

function JobCard({ job }: { job: CodingJob }) {
  return (
    <div className="group rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3 transition-colors hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]">
      {/* Top row: ID + status + PR link */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-secondary)]">
              {shortId(job.job_id)}
            </code>
            <StatusBadge status={job.status} />
            {job.pr_url && (
              <a
                href={job.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
              >
                <GitPullRequest className="h-3 w-3" />
                PR #{job.pr_number}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          {/* Task description */}
          <p className="mt-1.5 text-sm text-[var(--color-text-primary)] line-clamp-2">
            {job.task}
          </p>

          {/* Error message */}
          {job.error && (
            <p className="mt-1 text-[11px] text-[var(--color-error)] line-clamp-1">
              {job.error}
            </p>
          )}

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--color-text-tertiary)]">
            <span className="font-medium text-[var(--color-text-secondary)]">
              {job.repo.split("/").pop()}
            </span>
            <span>·</span>
            <span>{modelLabel(job.model)}</span>
            <span>·</span>
            <span>{job.triggered_by}</span>
            {job.started_at && (
              <>
                <span>·</span>
                <span title={job.started_at}>
                  {timeAgo(new Date(job.started_at))}
                </span>
              </>
            )}
            {job.started_at && (
              <>
                <span>·</span>
                <span>{formatDuration(job.started_at, job.completed_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Launch Job Modal
// ---------------------------------------------------------------------------

function LaunchJobModal({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: string, repo: string, model: string) => void;
  submitting: boolean;
}) {
  const [task, setTask] = useState("");
  const [repo, setRepo] = useState(ALLOWED_REPOS[0]);
  const [model, setModel] = useState(ALLOWED_MODELS[0].value);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Launch Coding Job
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Task */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Task Description
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the coding task..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Repo */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Repository
            </label>
            <select
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {ALLOWED_REPOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {ALLOWED_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(task, repo, model)}
            disabled={submitting || task.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {submitting ? "Launching…" : "Launch Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function JobsPage() {
  const [jobs, setJobs] = useState<CodingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: JobsResponse = await res.json();
      if (mountedRef.current) {
        setJobs(data.jobs);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    mountedRef.current = true;
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), REFRESH_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchJobs]);

  // Stats
  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "started" || j.status === "coding").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed" || j.status === "timeout").length,
  };

  // Launch handler
  const handleLaunchJob = async (task: string, repo: string, model: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, repo, model }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setModalOpen(false);
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to launch job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="Coding Jobs"
        subtitle="PopeBot autonomous coding — launch, track, and review"
      />

      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-1.5">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          {refreshing && (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--color-text-tertiary)]" />
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <Play className="h-3 w-3" />
          Launch Job
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        {!loading && jobs.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Jobs"
              value={stats.total}
              icon={Hammer}
              color="text-[var(--color-text-secondary)]"
            />
            <StatCard
              label="Running"
              value={stats.running}
              icon={Loader2}
              color="text-blue-400"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              color="text-[var(--color-success)]"
            />
            <StatCard
              label="Failed"
              value={stats.failed}
              icon={XCircle}
              color="text-[var(--color-error)]"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-xs text-[var(--color-error)]">
            <AlertTriangle className="mr-2 inline h-3.5 w-3.5" />
            Failed to load jobs: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && !error && <EmptyState />}

        {/* Job list */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.job_id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* Launch modal */}
      <LaunchJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleLaunchJob}
        submitting={submitting}
      />
    </>
  );
}
