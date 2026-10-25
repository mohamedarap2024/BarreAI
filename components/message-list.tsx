"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";
import { IconCheck, IconCopy, IconPencil, IconRefresh } from "@/components/icons";
import { cn } from "@/lib/utils";

type MessageListProps = {
  messages: ChatMessage[];
  streamingId?: string | null;
  /** Live token buffer — keeps the bubble updating without rewriting all chats. */
  streamingContent?: string;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, content: string) => void;
};

export function MessageList({
  messages,
  streamingId = null,
  streamingContent = "",
  onCopy,
  onRegenerate,
  onEdit,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = distance < 96;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({
      behavior: streamingId ? "auto" : "smooth",
    });
  }, [messages, streamingId, streamingContent]);

  return (
    <div ref={containerRef} className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const isStreaming = streamingId === message.id;
          const isLastAssistant =
            message.role === "assistant" &&
            index === messages.length - 1 &&
            !isStreaming;

          return (
            <div
              key={message.id}
              className={cn(
                "group flex flex-col gap-2",
                !isStreaming && "animate-fade-up",
                isUser ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-7 sm:max-w-[85%]",
                  isUser
                    ? "whitespace-pre-wrap bg-user-bubble text-foreground"
                    : "border border-border bg-panel text-foreground shadow-[var(--shadow)]",
                )}
              >
                {editingId === message.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="min-h-24 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          onEdit?.(message.id, draft.trim());
                          setEditingId(null);
                        }}
                        disabled={!draft.trim()}
                      >
                        Save & resend
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : isUser ? (
                  message.content
                ) : isStreaming ? (
                  streamingContent || message.content ? (
                    <MarkdownMessage
                      content={streamingContent || message.content}
                      streaming
                    />
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-muted">
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Thinking…</span>
                    </span>
                  )
                ) : (
                  <MarkdownMessage content={message.content} />
                )}
              </div>

              {!editingId && !isStreaming && (
                <div
                  className={cn(
                    "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Copy message"
                    onClick={async () => {
                      onCopy(message.content);
                      setCopiedId(message.id);
                      window.setTimeout(() => setCopiedId(null), 1500);
                    }}
                  >
                    {copiedId === message.id ? (
                      <IconCheck className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <IconCopy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {isUser && onEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label="Edit message"
                      onClick={() => {
                        setEditingId(message.id);
                        setDraft(message.content);
                      }}
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isLastAssistant && onRegenerate && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label="Regenerate"
                      onClick={onRegenerate}
                    >
                      <IconRefresh className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
