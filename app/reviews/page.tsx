// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import {
  GitPullRequest,
  GitMerge,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Loader2,
  ExternalLink,
  RefreshCw,
  Activity,
} from "lucide-react";
import type { ReviewItem, WorkflowRun, ReviewsResponse } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = ["github", "gerrit", "health"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  github: "GitHub",
  gerrit: "Gerrit",
  health: "Health",
};

const CI_COLORS: Record<string, string> = {
  success: "text-[var(--color-success)]",
  failure: "text-[var(--color-error)]",
  pending: "text-[var(--color-warning)]",
  unknown: "text-[var(--color-text-tertiary)]",
};

const CI_BG: Record<string, string> = {
  success: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  failure: "bg-[var(--color-error)]/15 text-[var(--color-error)]",
  pending: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  unknown:
    "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-tertiary)]",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-[var(--color-error)]/20 text-[var(--color-error)]",
  high: "bg-[var(--color-error)]/15 text-[var(--color-error)]",
  medium: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  low: "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-secondary)]",
  unknown:
    "bg-[var(--color-text-tertiary)]/15 text-[var(--color-text-tertiary)]",
};

const REFRESH_INTERVAL_MS = 60_000;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CIStatusIcon({ status }: { status: string }) {
  const cls = `h-3.5 w-3.5 ${CI_COLORS[status] ?? CI_COLORS.unknown}`;
  switch (status) {
    case "success":
      return <CheckCircle className={cls} />;
    case "failure":
      return <XCircle className={cls} />;
    case "pending":
      return <Clock className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

function CIBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${CI_BG[status] ?? CI_BG.unknown}`}
    >
      <CIStatusIcon status={status} />
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.unknown}`}
    >
      {severity}
    </span>
  );
}

function GerritScores({ scores }: { scores: { cr: number; v: number } }) {
  const crColor =
    scores.cr > 0
      ? "text-[var(--color-success)]"
      : scores.cr < 0
        ? "text-[var(--color-error)]"
        : "text-[var(--color-text-tertiary)]";
  const vColor =
    scores.v > 0
      ? "text-[var(--color-success)]"
      : scores.v < 0
        ? "text-[var(--color-error)]"
        : "text-[var(--color-text-tertiary)]";

  return (
    <div className="flex items-center gap-2 text-[10px] font-medium">
      <span className={crColor}>
        CR{scores.cr > 0 ? "+" : ""}
        {scores.cr}
      </span>
      <span className={vColor}>
        V{scores.v > 0 ? "+" : ""}
        {scores.v}
      </span>
    </div>
  );
}

function AgeBadge({ days }: { days: number }) {
  const isStale = days > 14;
  return (
    <span
      className={`text-[10px] ${
        isStale
          ? "font-medium text-[var(--color-warning)]"
          : "text-[var(--color-text-tertiary)]"
      }`}
    >
      {isStale && "⚠️ "}
      {days}d
    </span>
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

function SkeletonSection() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-[var(--color-border-subtle)] py-8 text-xs text-[var(--color-text-tertiary)]">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function ReviewRow({
  item,
  showScores,
}: {
  item: ReviewItem;
  showScores?: boolean;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3 transition-colors hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]"
    >
      <GitPullRequest
        className={`h-4 w-4 shrink-0 ${
          item.needs_attention
            ? "text-[var(--color-warning)]"
            : "text-[var(--color-text-tertiary)]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {item.title}
          </span>
          {item.needs_attention && (
            <span className="shrink-0 rounded-full bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-warning)]">
              needs attention
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span className="font-medium text-[var(--color-text-secondary)]">
            {item.repo.split("/").pop()}
          </span>
          <span>·</span>
          <span>{item.author}</span>
          {item.labels && item.labels.length > 0 && (
            <>
              <span>·</span>
              {item.labels.slice(0, 2).map((label) => (
                <span
                  key={label}
                  className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-[10px]"
                >
                  {label}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {showScores && item.scores ? (
          <GerritScores scores={item.scores} />
        ) : (
          <CIBadge status={item.ci_status} />
        )}
        <AgeBadge days={item.age_days} />
        <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  );
}

function WorkflowRow({ run }: { run: WorkflowRun }) {
  return (
    <a
      href={run.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3 transition-colors hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]"
    >
      <XCircle className="h-4 w-4 shrink-0 text-[var(--color-error)]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {run.name}
          </span>
          <span className="shrink-0 rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
            {run.branch}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span className="font-medium text-[var(--color-text-secondary)]">
            {run.repo.split("/").pop()}
          </span>
          {run.error && (
            <>
              <span>·</span>
              <span className="truncate text-[var(--color-error)]">
                {run.error}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CIBadge status="failure" />
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {timeAgo(new Date(run.created_at))}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  );
}

function DependabotRow({
  alert,
}: {
  alert: { repo: string; package: string; severity: string; url: string };
}) {
  return (
    <a
      href={alert.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3 transition-colors hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]"
    >
      <Shield className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {alert.package}
        </span>
        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          {alert.repo.split("/").pop()}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <SeverityBadge severity={alert.severity} />
        <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <Icon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
      <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
        {title}
      </h3>
      <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] text-[var(--color-text-tertiary)]">
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

function GitHubTab({ data }: { data: ReviewsResponse }) {
  return (
    <div className="space-y-6">
      {/* Incoming PRs */}
      <div>
        <SectionHeader
          icon={GitPullRequest}
          title="Incoming PRs"
          count={data.github.incoming_prs.length}
        />
        {data.github.incoming_prs.length > 0 ? (
          <div className="space-y-2">
            {data.github.incoming_prs.map((pr) => (
              <ReviewRow key={pr.id} item={pr} />
            ))}
          </div>
        ) : (
          <EmptyState message="No incoming PRs — inbox zero! 🎉" />
        )}
      </div>

      {/* My PRs */}
      <div>
        <SectionHeader
          icon={GitPullRequest}
          title="My Open PRs"
          count={data.github.my_prs.length}
        />
        {data.github.my_prs.length > 0 ? (
          <div className="space-y-2">
            {data.github.my_prs.map((pr) => (
              <ReviewRow key={pr.id} item={pr} />
            ))}
          </div>
        ) : (
          <EmptyState message="No open PRs" />
        )}
      </div>

      {/* Failed Workflows */}
      <div>
        <SectionHeader
          icon={XCircle}
          title="Failed Workflows"
          count={data.github.failed_workflows.length}
        />
        {data.github.failed_workflows.length > 0 ? (
          <div className="space-y-2">
            {data.github.failed_workflows.map((wf) => (
              <WorkflowRow key={wf.id} run={wf} />
            ))}
          </div>
        ) : (
          <EmptyState message="All workflows passing ✅" />
        )}
      </div>

      {/* Dependabot Alerts */}
      <div>
        <SectionHeader
          icon={Shield}
          title="Dependabot Alerts"
          count={data.github.dependabot_alerts.length}
        />
        {data.github.dependabot_alerts.length > 0 ? (
          <div className="space-y-2">
            {data.github.dependabot_alerts.map((alert, i) => (
              <DependabotRow key={`${alert.repo}-${alert.package}-${i}`} alert={alert} />
            ))}
          </div>
        ) : (
          <EmptyState message="No security alerts" />
        )}
      </div>
    </div>
  );
}

function GerritTab({ data }: { data: ReviewsResponse }) {
  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <div>
        <SectionHeader
          icon={GitPullRequest}
          title="Pending Reviews"
          count={data.gerrit.pending_reviews.length}
        />
        {data.gerrit.pending_reviews.length > 0 ? (
          <div className="space-y-2">
            {data.gerrit.pending_reviews.map((review) => (
              <ReviewRow key={review.id} item={review} showScores />
            ))}
          </div>
        ) : (
          <EmptyState message="No pending Gerrit reviews" />
        )}
      </div>

      {/* My Open Changes */}
      <div>
        <SectionHeader
          icon={GitPullRequest}
          title="My Open Changes"
          count={data.gerrit.my_changes.length}
        />
        {data.gerrit.my_changes.length > 0 ? (
          <div className="space-y-2">
            {data.gerrit.my_changes.map((change) => (
              <ReviewRow key={change.id} item={change} showScores />
            ))}
          </div>
        ) : (
          <EmptyState message="No open changes" />
        )}
      </div>

      {/* Recently Merged */}
      <div>
        <SectionHeader
          icon={GitMerge}
          title="Recently Merged (24h)"
          count={data.gerrit.recently_merged.length}
        />
        {data.gerrit.recently_merged.length > 0 ? (
          <div className="space-y-2">
            {data.gerrit.recently_merged.map((change) => (
              <ReviewRow key={change.id} item={change} showScores />
            ))}
          </div>
        ) : (
          <EmptyState message="No recent merges" />
        )}
      </div>
    </div>
  );
}

function HealthTab({ data }: { data: ReviewsResponse }) {
  const allItems = [
    ...data.github.incoming_prs,
    ...data.github.my_prs,
    ...data.gerrit.pending_reviews,
    ...data.gerrit.my_changes,
  ];
  const staleItems = allItems.filter((item) => item.age_days > 14);
  const failedCI = allItems.filter((item) => item.ci_status === "failure");

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stale Items (>14d)"
          value={staleItems.length}
          icon={AlertTriangle}
          color={
            staleItems.length > 0
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-success)]"
          }
        />
        <StatCard
          label="Failed CI"
          value={failedCI.length + data.github.failed_workflows.length}
          icon={XCircle}
          color={
            failedCI.length + data.github.failed_workflows.length > 0
              ? "text-[var(--color-error)]"
              : "text-[var(--color-success)]"
          }
        />
        <StatCard
          label="Security Alerts"
          value={data.github.dependabot_alerts.length}
          icon={Shield}
          color={
            data.github.dependabot_alerts.length > 0
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-success)]"
          }
        />
        <StatCard
          label="Needs Attention"
          value={data.summary.my_prs_attention}
          icon={Activity}
          color={
            data.summary.my_prs_attention > 0
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-success)]"
          }
        />
      </div>

      {/* Stale items list */}
      {staleItems.length > 0 && (
        <div>
          <SectionHeader
            icon={AlertTriangle}
            title="Stale Items (>14 days)"
            count={staleItems.length}
          />
          <div className="space-y-2">
            {staleItems.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
                showScores={item.source === "gerrit"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed CI items */}
      {(failedCI.length > 0 || data.github.failed_workflows.length > 0) && (
        <div>
          <SectionHeader
            icon={XCircle}
            title="Failed CI"
            count={failedCI.length + data.github.failed_workflows.length}
          />
          <div className="space-y-2">
            {failedCI.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
                showScores={item.source === "gerrit"}
              />
            ))}
            {data.github.failed_workflows.map((wf) => (
              <WorkflowRow key={wf.id} run={wf} />
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {staleItems.length === 0 &&
        failedCI.length === 0 &&
        data.github.failed_workflows.length === 0 &&
        data.github.dependabot_alerts.length === 0 && (
          <EmptyState message="All clear — no stale items, CI failures, or security alerts 🎉" />
        )}
    </div>
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
    <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("github");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const resp = await fetch("/api/reviews");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result: ReviewsResponse = await resp.json();

        if (mountedRef.current) {
          setData(result);
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
    },
    [],
  );

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const summaryLine = data
    ? [
        data.summary.incoming_prs > 0 &&
          `${data.summary.incoming_prs} PR${data.summary.incoming_prs !== 1 ? "s" : ""}`,
        data.summary.failed_workflows > 0 &&
          `${data.summary.failed_workflows} workflow${data.summary.failed_workflows !== 1 ? "s" : ""} failed`,
        data.summary.gerrit_reviews > 0 &&
          `${data.summary.gerrit_reviews} Gerrit review${data.summary.gerrit_reviews !== 1 ? "s" : ""}`,
        data.summary.dependabot_alerts > 0 &&
          `${data.summary.dependabot_alerts} alert${data.summary.dependabot_alerts !== 1 ? "s" : ""}`,
        data.summary.stale_items > 0 &&
          `${data.summary.stale_items} stale`,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <Header
        title="Reviews"
        subtitle="Code review dashboard — GitHub PRs &amp; Gerrit changes"
      />

      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-1.5">
        <div className="flex items-center gap-3">
          {/* Source badge */}
          {data && (
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
              {data.source === "live"
                ? "📡 Live"
                : data.source === "stale"
                  ? "📦 Cached"
                  : "🎭 Demo"}
            </span>
          )}

          {/* Summary line */}
          {summaryLine && (
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {summaryLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              Updated {timeAgo(lastUpdated)}
            </span>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>

          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--color-text-tertiary)]" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Error state */}
        {error && !loading && (
          <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]">
            Failed to load reviews: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {TABS.map((tab) => (
                <div
                  key={tab}
                  className="h-8 w-20 animate-pulse rounded-md bg-[var(--color-bg-tertiary)]"
                />
              ))}
            </div>
            <SkeletonSection />
            <SkeletonSection />
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Tab bar */}
            <div className="mb-6 flex gap-1 rounded-lg bg-[var(--color-bg-tertiary)] p-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                // Count for tab badges
                let tabCount = 0;
                if (tab === "github") {
                  tabCount =
                    data.summary.incoming_prs +
                    data.summary.my_prs_attention +
                    data.summary.failed_workflows;
                } else if (tab === "gerrit") {
                  tabCount = data.summary.gerrit_reviews;
                } else {
                  tabCount =
                    data.summary.stale_items +
                    data.summary.dependabot_alerts;
                }

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                    {tabCount > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          isActive
                            ? "bg-[var(--color-accent)]/15 text-[var(--color-text-accent)]"
                            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {tabCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "github" && <GitHubTab data={data} />}
            {activeTab === "gerrit" && <GerritTab data={data} />}
            {activeTab === "health" && <HealthTab data={data} />}
          </>
        )}
      </div>
    </>
  );
}
