// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReviewItem, WorkflowRun, ReviewsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com";
const GERRIT_API = "https://git.opendaylight.org/gerrit";

const GITHUB_REPOS = [
  "askb/zeroclaw-mission-control",
  "askb/zeroclaw-dashboard",
  "askb/askb-ha-config",
  "askb/packer-build-action",
  "askb/lfreleng-actions",
];

const GERRIT_PROJECTS = ["releng/builder", "releng/global-jjb"];

const REVIEWS_FILE = join(
  process.env.REVIEWS_DATA_DIR || "/app/data",
  "reviews.json",
);

/** In-memory cache: { data, timestamp } */
let cache: { data: ReviewsResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000),
  );
}

async function githubFetch(
  endpoint: string,
  token: string,
): Promise<unknown> {
  const resp = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}: ${endpoint}`);
  return resp.json();
}

async function gerritFetch(
  endpoint: string,
  user?: string,
  pass?: string,
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (user && pass) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }
  const resp = await fetch(`${GERRIT_API}${endpoint}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new Error(`Gerrit ${resp.status}: ${endpoint}`);
  // Gerrit prefixes JSON with )]}' — strip it
  const text = await resp.text();
  const cleaned = text.replace(/^\)\]\}'\n?/, "");
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// GitHub data fetchers
// ---------------------------------------------------------------------------

interface GHIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  user: { login: string };
  repository_url: string;
  created_at: string;
  labels: Array<{ name: string }>;
  pull_request?: { merged_at: string | null };
  draft?: boolean;
}

interface GHWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  html_url: string;
  conclusion: string | null;
  created_at: string;
  display_title: string;
}

interface GHAlert {
  number: number;
  html_url: string;
  security_advisory: { severity: string; summary: string };
  dependency: { package: { name: string } };
}

async function fetchGitHubIncomingPRs(token: string): Promise<ReviewItem[]> {
  const query = encodeURIComponent(
    `is:pr is:open review-requested:askb archived:false`,
  );
  const data = (await githubFetch(
    `/search/issues?q=${query}&per_page=30&sort=updated`,
    token,
  )) as { items: GHIssue[] };

  return data.items.map((pr) => {
    const repoMatch = pr.repository_url.match(/repos\/(.+)$/);
    const repo = repoMatch ? repoMatch[1] : "unknown";
    return {
      id: `gh-pr-${pr.id}`,
      source: "github" as const,
      type: "incoming_pr" as const,
      repo,
      title: pr.title,
      author: pr.user.login,
      url: pr.html_url,
      age_days: daysSince(pr.created_at),
      ci_status: "unknown" as const,
      needs_attention: daysSince(pr.created_at) > 3,
      labels: pr.labels.map((l) => l.name),
      created_at: pr.created_at,
    };
  });
}

async function fetchGitHubMyPRs(token: string): Promise<ReviewItem[]> {
  const query = encodeURIComponent(
    `is:pr is:open author:askb archived:false`,
  );
  const data = (await githubFetch(
    `/search/issues?q=${query}&per_page=30&sort=updated`,
    token,
  )) as { items: GHIssue[] };

  return data.items.map((pr) => {
    const repoMatch = pr.repository_url.match(/repos\/(.+)$/);
    const repo = repoMatch ? repoMatch[1] : "unknown";
    const hasReviewLabel = pr.labels.some(
      (l) => l.name === "changes-requested" || l.name === "needs-work",
    );
    return {
      id: `gh-mypr-${pr.id}`,
      source: "github" as const,
      type: "my_pr" as const,
      repo,
      title: pr.title,
      author: pr.user.login,
      url: pr.html_url,
      age_days: daysSince(pr.created_at),
      ci_status: "unknown" as const,
      needs_attention: hasReviewLabel || daysSince(pr.created_at) > 7,
      labels: pr.labels.map((l) => l.name),
      created_at: pr.created_at,
    };
  });
}

async function fetchFailedWorkflows(token: string): Promise<WorkflowRun[]> {
  const runs: WorkflowRun[] = [];

  for (const repo of GITHUB_REPOS) {
    try {
      const data = (await githubFetch(
        `/repos/${repo}/actions/runs?status=failure&per_page=5`,
        token,
      )) as { workflow_runs: GHWorkflowRun[] };

      for (const run of data.workflow_runs ?? []) {
        runs.push({
          id: `gh-wf-${run.id}`,
          repo,
          name: run.name,
          branch: run.head_branch,
          status: "failure",
          url: run.html_url,
          error: run.display_title,
          created_at: run.created_at,
        });
      }
    } catch {
      // Skip repos we can't access
    }
  }

  return runs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function fetchDependabotAlerts(
  token: string,
): Promise<
  Array<{ repo: string; package: string; severity: string; url: string }>
> {
  const alerts: Array<{
    repo: string;
    package: string;
    severity: string;
    url: string;
  }> = [];

  for (const repo of GITHUB_REPOS) {
    try {
      const data = (await githubFetch(
        `/repos/${repo}/dependabot/alerts?state=open&per_page=10`,
        token,
      )) as GHAlert[];

      for (const alert of data ?? []) {
        alerts.push({
          repo,
          package: alert.dependency?.package?.name ?? "unknown",
          severity: alert.security_advisory?.severity ?? "unknown",
          url: alert.html_url,
        });
      }
    } catch {
      // Skip repos without Dependabot access
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Gerrit data fetchers
// ---------------------------------------------------------------------------

interface GerritChange {
  _number: number;
  subject: string;
  project: string;
  owner: { name?: string; username?: string };
  created: string;
  updated: string;
  status: string;
  labels?: {
    "Code-Review"?: { all?: Array<{ value?: number }> };
    Verified?: { all?: Array<{ value?: number }> };
  };
}

function gerritChangeToReview(
  change: GerritChange,
  type: ReviewItem["type"],
): ReviewItem {
  const crVotes = change.labels?.["Code-Review"]?.all ?? [];
  const vVotes = change.labels?.Verified?.all ?? [];
  const crMax = crVotes.reduce(
    (m, v) => Math.max(m, v.value ?? 0),
    0,
  );
  const crMin = crVotes.reduce(
    (m, v) => Math.min(m, v.value ?? 0),
    0,
  );
  const vMax = vVotes.reduce(
    (m, v) => Math.max(m, v.value ?? 0),
    0,
  );
  const vMin = vVotes.reduce(
    (m, v) => Math.min(m, v.value ?? 0),
    0,
  );

  const cr = crMin < 0 ? crMin : crMax;
  const v = vMin < 0 ? vMin : vMax;

  let ciStatus: ReviewItem["ci_status"] = "unknown";
  if (v > 0) ciStatus = "success";
  else if (v < 0) ciStatus = "failure";
  else if (change.status === "NEW") ciStatus = "pending";

  return {
    id: `gerrit-${change._number}`,
    source: "gerrit",
    type,
    repo: change.project,
    title: change.subject,
    author: change.owner?.name ?? change.owner?.username ?? "unknown",
    url: `${GERRIT_API}/c/${change.project}/+/${change._number}`,
    age_days: daysSince(change.created),
    ci_status: ciStatus,
    needs_attention:
      type === "gerrit_review" ? daysSince(change.created) > 3 : cr < 0,
    scores: { cr, v },
    created_at: change.created,
  };
}

async function fetchGerritPendingReviews(
  user?: string,
  pass?: string,
): Promise<ReviewItem[]> {
  const query = encodeURIComponent(
    `status:open reviewer:self (${GERRIT_PROJECTS.map((p) => `project:${p}`).join(" OR ")})`,
  );
  const changes = (await gerritFetch(
    `/a/changes/?q=${query}&o=LABELS&o=DETAILED_ACCOUNTS&n=20`,
    user,
    pass,
  )) as GerritChange[];

  return (changes ?? []).map((c) =>
    gerritChangeToReview(c, "gerrit_review"),
  );
}

async function fetchGerritMyChanges(
  user?: string,
  pass?: string,
): Promise<ReviewItem[]> {
  const query = encodeURIComponent(
    `status:open owner:self (${GERRIT_PROJECTS.map((p) => `project:${p}`).join(" OR ")})`,
  );
  const changes = (await gerritFetch(
    `/a/changes/?q=${query}&o=LABELS&o=DETAILED_ACCOUNTS&n=20`,
    user,
    pass,
  )) as GerritChange[];

  return (changes ?? []).map((c) =>
    gerritChangeToReview(c, "my_change"),
  );
}

async function fetchGerritRecentlyMerged(
  user?: string,
  pass?: string,
): Promise<ReviewItem[]> {
  const query = encodeURIComponent(
    `status:merged -age:1d (${GERRIT_PROJECTS.map((p) => `project:${p}`).join(" OR ")})`,
  );
  const changes = (await gerritFetch(
    `/a/changes/?q=${query}&o=LABELS&o=DETAILED_ACCOUNTS&n=20`,
    user,
    pass,
  )) as GerritChange[];

  return (changes ?? []).map((c) =>
    gerritChangeToReview(c, "my_change"),
  );
}

// ---------------------------------------------------------------------------
// Mock / demo data
// ---------------------------------------------------------------------------

function getMockData(): ReviewsResponse {
  const now = new Date().toISOString();
  return {
    source: "demo",
    timestamp: now,
    summary: {
      incoming_prs: 3,
      my_prs_attention: 1,
      failed_workflows: 2,
      gerrit_reviews: 2,
      dependabot_alerts: 1,
      stale_items: 1,
    },
    github: {
      incoming_prs: [
        {
          id: "demo-pr-1",
          source: "github",
          type: "incoming_pr",
          repo: "askb/lfreleng-actions",
          title: "feat: add OpenStack cleanup action",
          author: "lf-contributor",
          url: "https://github.com/askb/lfreleng-actions/pull/42",
          age_days: 2,
          ci_status: "success",
          needs_attention: false,
          labels: ["enhancement"],
          created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        },
        {
          id: "demo-pr-2",
          source: "github",
          type: "incoming_pr",
          repo: "askb/packer-build-action",
          title: "fix: bastion SSH timeout handling",
          author: "infra-bot",
          url: "https://github.com/askb/packer-build-action/pull/15",
          age_days: 5,
          ci_status: "failure",
          needs_attention: true,
          labels: ["bug", "ci-failing"],
          created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
        },
        {
          id: "demo-pr-3",
          source: "github",
          type: "incoming_pr",
          repo: "askb/zeroclaw-dashboard",
          title: "chore: update dependencies",
          author: "dependabot[bot]",
          url: "https://github.com/askb/zeroclaw-dashboard/pull/8",
          age_days: 1,
          ci_status: "pending",
          needs_attention: false,
          labels: ["dependencies"],
          created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
        },
      ],
      my_prs: [
        {
          id: "demo-mypr-1",
          source: "github",
          type: "my_pr",
          repo: "askb/zeroclaw-mission-control",
          title: "feat: add reviews dashboard page",
          author: "askb",
          url: "https://github.com/askb/zeroclaw-mission-control/pull/20",
          age_days: 3,
          ci_status: "success",
          needs_attention: true,
          labels: ["feature"],
          created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        },
      ],
      failed_workflows: [
        {
          id: "demo-wf-1",
          repo: "askb/packer-build-action",
          name: "Build and Test",
          branch: "main",
          status: "failure",
          url: "https://github.com/askb/packer-build-action/actions/runs/12345",
          error: "Packer validate failed: missing variable",
          created_at: new Date(Date.now() - 3_600_000).toISOString(),
        },
        {
          id: "demo-wf-2",
          repo: "askb/lfreleng-actions",
          name: "Pre-commit Lint",
          branch: "feature/new-action",
          status: "failure",
          url: "https://github.com/askb/lfreleng-actions/actions/runs/12346",
          error: "shellcheck: SC2086 in scripts/build.sh",
          created_at: new Date(Date.now() - 7_200_000).toISOString(),
        },
      ],
      dependabot_alerts: [
        {
          repo: "askb/zeroclaw-dashboard",
          package: "next",
          severity: "high",
          url: "https://github.com/askb/zeroclaw-dashboard/security/dependabot/1",
        },
      ],
    },
    gerrit: {
      pending_reviews: [
        {
          id: "demo-gerrit-1",
          source: "gerrit",
          type: "gerrit_review",
          repo: "releng/builder",
          title: "Update JJB templates for ubuntu-24.04",
          author: "zxiiro",
          url: "https://git.opendaylight.org/gerrit/c/releng/builder/+/108001",
          age_days: 4,
          ci_status: "success",
          needs_attention: true,
          scores: { cr: 1, v: 1 },
          created_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
        },
        {
          id: "demo-gerrit-2",
          source: "gerrit",
          type: "gerrit_review",
          repo: "releng/global-jjb",
          title: "Add Maven 4.0 support to build templates",
          author: "lf-infra",
          url: "https://git.opendaylight.org/gerrit/c/releng/global-jjb/+/108050",
          age_days: 1,
          ci_status: "pending",
          needs_attention: false,
          scores: { cr: 0, v: 0 },
          created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
        },
      ],
      my_changes: [
        {
          id: "demo-gerrit-3",
          source: "gerrit",
          type: "my_change",
          repo: "releng/builder",
          title: "Migrate packer jobs to GitHub Actions",
          author: "askb",
          url: "https://git.opendaylight.org/gerrit/c/releng/builder/+/107990",
          age_days: 7,
          ci_status: "failure",
          needs_attention: true,
          scores: { cr: -1, v: 1 },
          created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
        },
      ],
      recently_merged: [
        {
          id: "demo-gerrit-4",
          source: "gerrit",
          type: "my_change",
          repo: "releng/builder",
          title: "Remove deprecated CentOS 8 packer templates",
          author: "askb",
          url: "https://git.opendaylight.org/gerrit/c/releng/builder/+/107985",
          age_days: 0,
          ci_status: "success",
          needs_attention: false,
          scores: { cr: 2, v: 1 },
          created_at: new Date(Date.now() - 12 * 3_600_000).toISOString(),
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// File-based fallback reader
// ---------------------------------------------------------------------------

async function readFromFile(): Promise<ReviewsResponse | null> {
  try {
    const raw = await readFile(REVIEWS_FILE, "utf-8");
    const data = JSON.parse(raw) as ReviewsResponse;
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Live data aggregator
// ---------------------------------------------------------------------------

async function fetchLiveData(): Promise<ReviewsResponse> {
  const githubToken = process.env.GITHUB_RO_TOKEN;
  const gerritUser = process.env.GERRIT_HTTP_USER;
  const gerritPass = process.env.GERRIT_HTTP_PASS;

  const hasGitHub = Boolean(githubToken);
  const hasGerrit = Boolean(gerritUser && gerritPass);

  // If no credentials at all, try file fallback then demo
  if (!hasGitHub && !hasGerrit) {
    const fileData = await readFromFile();
    if (fileData) return { ...fileData, source: "stale" };
    return getMockData();
  }

  // Fetch all data in parallel with individual error isolation
  const [incomingPRs, myPRs, failedWorkflows, dependabotAlerts] =
    await Promise.all([
      hasGitHub
        ? fetchGitHubIncomingPRs(githubToken!).catch(() => [] as ReviewItem[])
        : Promise.resolve([] as ReviewItem[]),
      hasGitHub
        ? fetchGitHubMyPRs(githubToken!).catch(() => [] as ReviewItem[])
        : Promise.resolve([] as ReviewItem[]),
      hasGitHub
        ? fetchFailedWorkflows(githubToken!).catch(() => [] as WorkflowRun[])
        : Promise.resolve([] as WorkflowRun[]),
      hasGitHub
        ? fetchDependabotAlerts(githubToken!).catch(
            () => [] as Array<{ repo: string; package: string; severity: string; url: string }>,
          )
        : Promise.resolve(
            [] as Array<{ repo: string; package: string; severity: string; url: string }>,
          ),
    ]);

  const [pendingReviews, myChanges, recentlyMerged] = await Promise.all([
    hasGerrit
      ? fetchGerritPendingReviews(gerritUser, gerritPass).catch(
          () => [] as ReviewItem[],
        )
      : Promise.resolve([] as ReviewItem[]),
    hasGerrit
      ? fetchGerritMyChanges(gerritUser, gerritPass).catch(
          () => [] as ReviewItem[],
        )
      : Promise.resolve([] as ReviewItem[]),
    hasGerrit
      ? fetchGerritRecentlyMerged(gerritUser, gerritPass).catch(
          () => [] as ReviewItem[],
        )
      : Promise.resolve([] as ReviewItem[]),
  ]);

  // Count stale items (>14 days)
  const allItems = [
    ...incomingPRs,
    ...myPRs,
    ...pendingReviews,
    ...myChanges,
  ];
  const staleItems = allItems.filter((item) => item.age_days > 14).length;

  const now = new Date().toISOString();

  return {
    source: "live",
    timestamp: now,
    summary: {
      incoming_prs: incomingPRs.length,
      my_prs_attention: myPRs.filter((p) => p.needs_attention).length,
      failed_workflows: failedWorkflows.length,
      gerrit_reviews: pendingReviews.length,
      dependabot_alerts: dependabotAlerts.length,
      stale_items: staleItems,
    },
    github: {
      incoming_prs: incomingPRs,
      my_prs: myPRs,
      failed_workflows: failedWorkflows,
      dependabot_alerts: dependabotAlerts,
    },
    gerrit: {
      pending_reviews: pendingReviews,
      my_changes: myChanges,
      recently_merged: recentlyMerged,
    },
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/reviews
 *
 * Aggregates code review data from GitHub and Gerrit.
 * Falls back to file-based data or demo data when credentials are unavailable.
 * Caches results in memory for 5 minutes.
 */
export async function GET() {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const data = await fetchLiveData();

    // Update cache
    cache = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch {
    // On total failure, return demo data
    const demo = getMockData();
    return NextResponse.json(demo);
  }
}
