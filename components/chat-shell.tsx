"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Composer } from "@/components/composer";
import { MessageList } from "@/components/message-list";
import { Sidebar } from "@/components/sidebar";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Button } from "@/components/ui/button";
import { IconMenu, IconSidebarOpen } from "@/components/icons";
import {
  type ChatMessage,
  type Conversation,
  createId,
} from "@/lib/chat-types";
import {
  loadLocalConversations,
  mergeConversations,
  saveLocalConversations,
} from "@/lib/chat-storage";

type ChatUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type ChatShellProps = {
  user: ChatUser;
};

export function ChatShell({ user }: ChatShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("nvidia/nemotron-3.5-lightning:free");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySource, setHistorySource] = useState<
    "local" | "database" | "mixed"
  >("local");
  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const streamBufferRef = useRef("");
  const streamTargetRef = useRef<{
    conversationId: string;
    assistantId: string;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const sawFirstTokenRef = useRef(false);
  const loadedIdsRef = useRef(new Set<string>());

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  // Keep a durable local copy so chats still appear when Neon is down
  useEffect(() => {
    if (loadingHistory) return;
    saveLocalConversations(user.id, conversations);
  }, [conversations, loadingHistory, user.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const local = loadLocalConversations(user.id);
      if (!cancelled && local.length > 0) {
        setConversations(local);
        for (const conversation of local) {
          if (conversation.messages.length > 0) {
            loadedIdsRef.current.add(conversation.id);
          }
        }
        setHistorySource("local");
      }

      try {
        const response = await fetch("/api/conversations");
        if (!response.ok) throw new Error("Failed to load chats");
        const data = (await response.json()) as {
          conversations: Conversation[];
          source?: string;
        };

        if (cancelled) return;

        if (data.source === "unavailable") {
          setConversations((prev) =>
            prev.length > 0 ? prev : local,
          );
          setHistorySource("local");
          return;
        }

        const merged = mergeConversations(local, data.conversations);
        setConversations(merged);
        setHistorySource(local.length > 0 ? "mixed" : "database");

        // Prefetch full threads for server rows that only have titles
        for (const conversation of data.conversations) {
          if (!loadedIdsRef.current.has(conversation.id)) {
            void fetch(`/api/conversations/${conversation.id}`)
              .then(async (res) => {
                if (!res.ok) return null;
                return (await res.json()) as { conversation: Conversation };
              })
              .then((payload) => {
                if (!payload?.conversation || cancelled) return;
                loadedIdsRef.current.add(payload.conversation.id);
                setConversations((prev) =>
                  mergeConversations(prev, [payload.conversation]),
                );
              })
              .catch(() => undefined);
          }
        }
      } catch {
        if (!cancelled) {
          setConversations((prev) => (prev.length > 0 ? prev : local));
          setHistorySource("local");
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const loadConversationMessages = useCallback(async (id: string) => {
    if (loadedIdsRef.current.has(id)) return;

    const local = conversationsRef.current.find((c) => c.id === id);
    if (local && local.messages.length > 0) {
      loadedIdsRef.current.add(id);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) return;
      const data = (await response.json()) as { conversation: Conversation };
      loadedIdsRef.current.add(id);
      setConversations((prev) =>
        mergeConversations(prev, [data.conversation]),
      );
    } catch {
      // keep list item; messages may stay empty until retry
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    void loadConversationMessages(activeId);
  }, [activeId, loadConversationMessages]);

  const flushStreamToUi = useCallback(() => {
    setStreamingContent(streamBufferRef.current);
  }, []);

  const commitStreamToConversation = useCallback((content: string) => {
    const target = streamTargetRef.current;
    if (!target) return;
    const { conversationId, assistantId } = target;
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id !== conversationId
          ? conversation
          : {
              ...conversation,
              updatedAt: new Date().toISOString(),
              messages: conversation.messages.map((message) =>
                message.id === assistantId
                  ? { ...message, content }
                  : message,
              ),
            },
      ),
    );
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const snapshot = streamBufferRef.current;
    if (snapshot.trim()) {
      commitStreamToConversation(snapshot);
    }
    streamTargetRef.current = null;
    setStreamingContent("");
    setStreamingId(null);
    setIsGenerating(false);
  }, [commitStreamToConversation]);

  const upsertConversation = useCallback(
    (
      conversationId: string,
      updater: (conversation: Conversation) => Conversation,
    ) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? updater(conversation)
            : conversation,
        ),
      );
    },
    [],
  );

  const persistMessages = useCallback(
    async (
      conversationId: string,
      msgs: ChatMessage[],
      replaceFrom?: string | null,
    ) => {
      try {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            ...(replaceFrom !== undefined ? { replaceFrom } : {}),
          }),
        });
      } catch {
        // UI already has the messages; sync can retry later
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (
      raw: string,
      options?: { conversationId?: string; replaceFrom?: string },
    ) => {
      const content = raw.trim();
      if (!content || isGenerating) return;

      stopGeneration();

      let conversationId = options?.conversationId ?? activeId;
      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: createId("msg"),
        role: "user",
        content,
        createdAt: now,
      };

      let historyForApi: ChatMessage[] = [];
      let isNewConversation = false;

      if (!conversationId) {
        isNewConversation = true;
        conversationId = createId("chat");
        const title =
          content.length > 42 ? `${content.slice(0, 42).trim()}…` : content;
        const conversation: Conversation = {
          id: conversationId,
          title,
          updatedAt: now,
          messages: [userMessage],
        };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversationId);
        loadedIdsRef.current.add(conversationId);
        historyForApi = [userMessage];

        void fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: conversationId,
            title,
            message: userMessage,
          }),
        });
      } else if (options?.replaceFrom) {
        const existing = conversationsRef.current.find(
          (c) => c.id === conversationId,
        );
        const index =
          existing?.messages.findIndex((m) => m.id === options.replaceFrom) ??
          -1;
        const kept =
          existing && index >= 0
            ? existing.messages.slice(0, index)
            : (existing?.messages ?? []);
        historyForApi = [...kept, userMessage];
        upsertConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: now,
          messages: historyForApi,
        }));
        void persistMessages(conversationId, [userMessage], options.replaceFrom);
      } else {
        const existing = conversationsRef.current.find(
          (c) => c.id === conversationId,
        );
        historyForApi = [...(existing?.messages ?? []), userMessage];
        upsertConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: now,
          messages: historyForApi,
        }));
        if (!isNewConversation) {
          void persistMessages(conversationId, [userMessage]);
        }
      }

      setInput("");
      setIsGenerating(true);

      const assistantId = createId("msg");
      const targetId = conversationId;
      const controller = new AbortController();
      abortRef.current = controller;
      streamBufferRef.current = "";
      sawFirstTokenRef.current = false;
      streamTargetRef.current = { conversationId: targetId, assistantId };
      setStreamingContent("");

      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id !== targetId
            ? conversation
            : {
                ...conversation,
                updatedAt: new Date().toISOString(),
                messages: [...conversation.messages, assistantPlaceholder],
              },
        ),
      );
      setStreamingId(assistantId);

      const apiMessages = historyForApi
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            m.content.trim().length > 0,
        )
        .map((m) => ({ role: m.role, content: m.content.trim() }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: apiMessages,
          }),
        });

        if (!response.ok) {
          let errorText = "Request failed";
          try {
            const data = (await response.json()) as { error?: string };
            if (data.error) errorText = data.error;
          } catch {
            // ignore
          }
          throw new Error(errorText);
        }

        if (!response.body) {
          throw new Error("No response stream received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBufferRef.current += decoder.decode(value, { stream: true });

          // Paint the first token immediately; batch the rest per animation frame.
          if (!sawFirstTokenRef.current) {
            sawFirstTokenRef.current = true;
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            flushStreamToUi();
            continue;
          }

          if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              flushStreamToUi();
            });
          }
        }

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        const finalContent =
          streamBufferRef.current.trim() ||
          "No content was returned. The free model may be busy — try again.";

        commitStreamToConversation(finalContent);
        setStreamingContent("");

        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: finalContent,
          createdAt: assistantPlaceholder.createdAt,
        };
        void persistMessages(targetId, [assistantMessage]);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error instanceof Error ? error.message : "Something went wrong";
          const errorContent =
            streamBufferRef.current.trim() || `Error: ${message}`;
          commitStreamToConversation(errorContent);
          setStreamingContent("");
          void persistMessages(targetId, [
            {
              id: assistantId,
              role: "assistant",
              content: errorContent,
              createdAt: assistantPlaceholder.createdAt,
            },
          ]);
        } else {
          const snapshot = streamBufferRef.current.trim();
          if (snapshot) {
            commitStreamToConversation(snapshot);
          } else {
            upsertConversation(targetId, (conversation) => ({
              ...conversation,
              messages: conversation.messages.filter(
                (m) => m.id !== assistantId,
              ),
            }));
          }
          setStreamingContent("");
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        streamTargetRef.current = null;
        setStreamingId(null);
        setIsGenerating(false);
      }
    },
    [
      activeId,
      commitStreamToConversation,
      flushStreamToUi,
      isGenerating,
      model,
      persistMessages,
      stopGeneration,
      upsertConversation,
    ],
  );

  const handleRename = (id: string) => {
    const current = conversations.find((c) => c.id === id);
    if (!current) return;
    const next = window.prompt("Rename conversation", current.title);
    if (!next?.trim()) return;
    const title = next.trim();
    upsertConversation(id, (conversation) => ({
      ...conversation,
      title,
      updatedAt: new Date().toISOString(),
    }));
    void fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  };

  const handleDelete = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    loadedIdsRef.current.delete(id);
    if (activeId === id) setActiveId(null);
    void fetch(`/api/conversations/${id}`, { method: "DELETE" });
  };

  const handleRegenerate = () => {
    if (!activeConversation || isGenerating) return;
    const lastUser = [...activeConversation.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUser) return;
    void sendMessage(lastUser.content, {
      conversationId: activeConversation.id,
      replaceFrom: lastUser.id,
    });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        conversations={conversations}
        activeId={activeId}
        user={user}
        onCloseMobile={() => setSidebarOpen(false)}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        onNewChat={() => {
          stopGeneration();
          setActiveId(null);
          setInput("");
          setSidebarOpen(false);
        }}
        onSelect={setActiveId}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-3 md:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <IconMenu className="h-5 w-5" />
          </Button>
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 text-muted hover:text-foreground md:inline-flex"
              onClick={() => setCollapsed(false)}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <IconSidebarOpen className="h-[18px] w-[18px]" />
            </Button>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {activeConversation?.title ?? "New chat"}
            </p>
            <p className="truncate text-xs text-muted">
              {loadingHistory
                ? "Loading history…"
                : historySource === "local"
                  ? "Saved on this device"
                  : "Barre AI"}
            </p>
          </div>
        </header>

        {!activeConversation || activeConversation.messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <MessageList
            messages={activeConversation.messages}
            streamingId={streamingId}
            streamingContent={streamingContent}
            onCopy={(content) => navigator.clipboard.writeText(content)}
            onRegenerate={handleRegenerate}
            onEdit={(messageId, content) =>
              void sendMessage(content, {
                conversationId: activeConversation.id,
                replaceFrom: messageId,
              })
            }
          />
        )}

        <Composer
          value={input}
          onChange={setInput}
          onSend={() => void sendMessage(input)}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          model={model}
          onModelChange={setModel}
        />
      </main>
    </div>
  );
}
