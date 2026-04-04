// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { NextResponse } from "next/server";
import { readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { CodingJob, JobsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const JOBS_FILE = join(
  process.env.JOBS_DATA_DIR || "/app/data/jobs",
  "jobs.json",
);

const ALLOWED_REPOS = [
  "askb/zeroclaw-mission-control",
  "askb/zeroclaw-dashboard",
  "askb/askb-ha-config",
];

const ALLOWED_MODELS = [
  "openrouter/moonshotai/kimi-k2",
  "openrouter/google/gemini-2.5-flash",
  "openrouter/deepseek/deepseek-r1",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJobs(): Promise<{
  jobs: CodingJob[];
  lastUpdated: string | null;
}> {
  try {
    const [raw, fileStats] = await Promise.all([
      readFile(JOBS_FILE, "utf-8"),
      stat(JOBS_FILE),
    ]);
    const parsed = JSON.parse(raw);
    const jobs: CodingJob[] = Array.isArray(parsed) ? parsed : parsed.jobs ?? [];
    return {
      jobs,
      lastUpdated: fileStats.mtime.toISOString(),
    };
  } catch {
    return { jobs: [], lastUpdated: null };
  }
}

async function writeJobs(jobs: CodingJob[]): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(JOBS_FILE), { recursive: true });
  await writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// GET /api/jobs — read all jobs
// ---------------------------------------------------------------------------

export async function GET() {
  const { jobs, lastUpdated } = await readJobs();

  const response: JobsResponse = {
    jobs,
    source: jobs.length === 0 ? "empty" : "file",
    lastUpdated,
  };

  return NextResponse.json(response);
}

// ---------------------------------------------------------------------------
// POST /api/jobs — create a new queued job
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { task, repo, model } = body as {
      task?: string;
      repo?: string;
      model?: string;
    };

    // Validate required fields
    if (!task || typeof task !== "string" || task.trim().length === 0) {
      return NextResponse.json(
        { error: "Task description is required" },
        { status: 400 },
      );
    }

    if (!repo || !ALLOWED_REPOS.includes(repo)) {
      return NextResponse.json(
        { error: `Invalid repo. Allowed: ${ALLOWED_REPOS.join(", ")}` },
        { status: 400 },
      );
    }

    const selectedModel =
      model && ALLOWED_MODELS.includes(model)
        ? model
        : ALLOWED_MODELS[0];

    const job: CodingJob = {
      job_id: randomBytes(4).toString("hex"),
      task: task.trim(),
      repo,
      branch: "",
      status: "queued",
      started_at: null,
      completed_at: null,
      pr_url: null,
      pr_number: null,
      error: null,
      model: selectedModel,
      triggered_by: "dashboard",
    };

    const { jobs } = await readJobs();
    jobs.unshift(job);
    await writeJobs(jobs);

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 },
    );
  }
}
