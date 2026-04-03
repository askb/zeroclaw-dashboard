// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  MessageCircle,
  Search,
  Hash,
  Bot,
  User,
  Loader2,
  Smartphone,
} from "lucide-react";
import type {
  Conversation,
  ConversationMessage,
  ConversationsResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ChannelFilter = "all" | "telegram" | "discord";

const CHANNEL_FILTERS: { id: ChannelFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🗂️" },
  { id: "telegram", label: "Telegram", icon: "📱" },
  { id: "discord", label: "Discord", icon: "💬" },
];

const REFRESH_INTERVAL = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Minimal markdown-to-JSX: renders **bold**, `code`, and ```code blocks```. */
function renderContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on fenced code blocks first
  const blocks = text.split(/(```[\s\S]*?```)/g);

  blocks.forEach((block, bi) => {
    if (block.startsWith("```")) {
      const inner = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      parts.push(
        <pre
          key={`cb-${bi}`}
          className="my-2 overflow-x-auto rounded-md bg-[var(--color-bg-primary)] p-3 text-xs leading-relaxed font-mono text-[var(--color-text-secondary)]"
        >
          {inner}
        </pre>,
      );
      return;
    }

    // Handle inline formatting within non-code-block segments
    const inlineParts = block.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    inlineParts.forEach((seg, si) => {
      if (seg.startsWith("`") && seg.endsWith("`")) {
        parts.push(
          <code
            key={`ic-${bi}-${si}`}
            className="rounded bg-[var(--color-bg-primary)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--color-accent)]"
          >
            {seg.slice(1, -1)}
          </code>,
        );
      } else if (seg.startsWith("**") && seg.endsWith("**")) {
        parts.push(
          <strong key={`b-${bi}-${si}`} className="font-semibold">
            {seg.slice(2, -2)}
          </strong>,
        );
      } else {
        // Preserve newlines
        const lines = seg.split("\n");
        lines.forEach((line, li) => {
          if (li > 0) parts.push(<br key={`br-${bi}-${si}-${li}`} />);
          parts.push(<span key={`t-${bi}-${si}-${li}`}>{line}</span>);
        });
      }
    });
  });

  return parts;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const channelIcon =
    conversation.channel === "telegram" ? (
      <Smartphone className="h-4 w-4 text-blue-400" />
    ) : (
      <MessageCircle className="h-4 w-4 text-indigo-400" />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-lg p-3 text-left transition-colors ${
        isSelected
          ? "bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/30"
          : "border border-transparent hover:bg-[var(--color-bg-hover)]"
      }`}
    >
      <div className="mt-0.5 shrink-0">{channelIcon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {conversation.title}
          </span>
        </div>
        {conversation.discord_channel && (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
            <Hash className="h-2.5 w-2.5" />
            {conversation.discord_channel.replace("#", "")}
          </div>
        )}
        <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
          {conversation.preview}
        </p>
        <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">
          {formatTime(conversation.updated_at)}
        </span>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isAgent = message.role === "agent";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-3 py-1 text-[10px] text-[var(--color-text-tertiary)]">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2.5 ${isAgent ? "justify-start" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isAgent
            ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
        }`}
      >
        {isAgent ? (
          <Bot className="h-3.5 w-3.5" />
        ) : (
          <User className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
          isAgent
            ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
            : "border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-text-primary)]"
        }`}
      >
        {/* Sender + time */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[var(--color-text-primary)]">
            {isAgent ? message.agent ?? "Agent" : "You"}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Content */}
        <div className="text-xs leading-relaxed">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      {/* Left panel skeleton */}
      <div className="w-[300px] shrink-0 border-r border-[var(--color-border-subtle)] p-4">
        <div className="mb-4 h-9 animate-pulse rounded-md bg-[var(--color-bg-tertiary)]" />
        <div className="mb-4 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-full bg-[var(--color-bg-tertiary)]"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3"
            >
              <div className="mb-2 h-3 w-3/4 rounded bg-[var(--color-bg-tertiary)]" />
              <div className="h-2 w-full rounded bg-[var(--color-bg-tertiary)]" />
              <div className="mt-2 h-2 w-1/4 rounded bg-[var(--color-bg-tertiary)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--color-bg-tertiary)]" />
              <div className="max-w-[60%] animate-pulse rounded-lg bg-[var(--color-bg-tertiary)] p-4">
                <div className="mb-2 h-2 w-16 rounded bg-[var(--color-bg-secondary)]" />
                <div className="space-y-1">
                  <div className="h-2 w-48 rounded bg-[var(--color-bg-secondary)]" />
                  <div className="h-2 w-32 rounded bg-[var(--color-bg-secondary)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ConversationsPage() {
  const [data, setData] = useState<ConversationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // ------ Data fetching ------

  const fetchData = useCallback(
    async (filter: ChannelFilter) => {
      try {
        const url = `/api/conversations?channel=${filter}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        const json = (await resp.json()) as ConversationsResponse;
        if (mountedRef.current) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchData(channelFilter);
    const timer = setInterval(() => fetchData(channelFilter), REFRESH_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchData, channelFilter]);

  // Scroll to bottom when selecting a conversation
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId]);

  // ------ Derived state ------

  const conversations = data?.conversations ?? [];

  const filtered = search
    ? conversations.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
        );
      })
    : conversations;

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

  // ------ Render ------

  return (
    <>
      <Header
        title="Conversations"
        subtitle="Telegram &amp; Discord message history"
      />

      {/* Source badge bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-1.5">
        {data && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              data.source === "live"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-yellow-500/15 text-yellow-400"
            }`}
          >
            {data.source === "live" ? "📡 Live" : "🎭 Demo"}
          </span>
        )}
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
          {data ? ` of ${data.total}` : ""}
        </span>
        {loading && (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--color-text-tertiary)]" />
        )}
      </div>

      {/* Loading state */}
      {loading && !data && <LoadingSkeleton />}

      {/* Error state */}
      {error && !loading && (
        <div className="m-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load conversations: {error}
        </div>
      )}

      {/* Main content */}
      {!loading || data ? (
        <div className="flex flex-1 overflow-hidden">
          {/* ---- Left panel: conversation list ---- */}
          <div className="flex w-[300px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
            {/* Search */}
            <div className="p-3 pb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="h-8 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] pl-9 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            </div>

            {/* Channel filters */}
            <div className="flex gap-1.5 px-3 py-3">
              {CHANNEL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChannelFilter(f.id)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    channelFilter === f.id
                      ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                      : "border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {filtered.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="mb-2 h-8 w-8 text-[var(--color-text-tertiary)]" />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    No conversations found
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                    {search
                      ? "Try a different search term"
                      : "Conversations will appear here"}
                  </p>
                </div>
              )}
              {filtered.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))}
            </div>
          </div>

          {/* ---- Right panel: message thread ---- */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-primary)]">
            {selected ? (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-5 py-3">
                  {selected.channel === "telegram" ? (
                    <Smartphone className="h-4 w-4 text-blue-400" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-indigo-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {selected.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
                      <span className="capitalize">{selected.channel}</span>
                      {selected.discord_channel && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Hash className="h-2.5 w-2.5" />
                            {selected.discord_channel.replace("#", "")}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{selected.messages.length} messages</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="mx-auto max-w-3xl space-y-4">
                    {selected.messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={threadEndRef} />
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-[var(--color-text-tertiary)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select a conversation to view history
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {filtered.length} conversation
                  {filtered.length !== 1 ? "s" : ""} available
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
