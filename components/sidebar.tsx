"use client";

import { useMemo, useState } from "react";
import { BarreIcon, BarreLogo } from "@/components/barre-logo";
import {
  IconLogout,
  IconMore,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSidebar,
  IconSidebarOpen,
  IconTrash,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/auth-actions";
import {
  type Conversation,
  groupConversationsByDate,
} from "@/lib/chat-types";
import { cn } from "@/lib/utils";

type SidebarUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

type SidebarProps = {
  open: boolean;
  collapsed: boolean;
  conversations: Conversation[];
  activeId: string | null;
  user: SidebarUser;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
};

export function Sidebar({
  open,
  collapsed,
  conversations,
  activeId,
  user,
  onCloseMobile,
  onToggleCollapsed,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const displayName = user.name?.trim() || user.email || "Account";
  const displayEmail = user.email ?? "Signed in";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const groups = useMemo(() => groupConversationsByDate(filtered), [filtered]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-out md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-[68px]" : "md:w-[280px]",
          "w-[280px]",
        )}
      >
        {/* Header — expanded: brand + panel; collapsed: ChatGPT-style open icon */}
        <div
          className={cn(
            "flex items-center gap-1 px-2.5 pt-3 pb-2",
            collapsed ? "md:flex-col md:items-center md:gap-2" : "justify-between",
          )}
        >
          {!collapsed && <BarreLogo className="min-w-0 flex-1 px-0.5" />}

          <div
            className={cn(
              "flex items-center gap-0.5",
              collapsed && "md:w-full md:flex-col md:gap-1",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <IconSidebar className="h-[18px] w-[18px]" />
            </Button>

            {/* Collapsed rail: text brand + ChatGPT-style open-sidebar icon */}
            {collapsed && (
              <>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  className="hidden rounded-xl px-1.5 py-1 transition-colors hover:bg-muted-bg md:inline-flex"
                  aria-label="Expand sidebar"
                  title="Open sidebar"
                >
                  <BarreLogo collapsed />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-9 w-9 text-muted hover:text-foreground md:inline-flex"
                  onClick={onToggleCollapsed}
                  aria-label="Open sidebar"
                  title="Open sidebar"
                >
                  <IconSidebarOpen className="h-[18px] w-[18px]" />
                </Button>
              </>
            )}

            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 text-muted hover:text-foreground md:inline-flex"
                onClick={onToggleCollapsed}
                aria-label="Collapse sidebar"
                title="Close sidebar"
              >
                <IconSidebar className="h-[18px] w-[18px]" />
              </Button>
            )}
          </div>
        </div>

        {/* New chat */}
        <div className={cn("px-2.5", collapsed && "md:px-2")}>
          <Button
            variant="accent"
            className={cn(
              "w-full justify-start shadow-none",
              collapsed && "md:justify-center md:px-0",
            )}
            onClick={onNewChat}
            title="New chat"
          >
            <IconPlus className="h-4 w-4" />
            {!collapsed && <span>New chat</span>}
          </Button>
        </div>

        {/* Search — hidden when collapsed */}
        {!collapsed && (
          <div className="mt-3 px-2.5">
            <label className="relative block">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="h-10 w-full rounded-xl border border-border bg-panel/80 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/40 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
          </div>
        )}

        {/* Conversation list */}
        <div className="scrollbar-thin mt-3 flex-1 overflow-y-auto px-2 pb-3">
          {groups.length === 0
            ? !collapsed && (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  No conversations yet
                </p>
              )
            : groups.map((group) => (
                <div key={group.label} className="mb-3">
                  {!collapsed && (
                    <p className="px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((conversation) => {
                      const initial = conversation.title.trim().charAt(0).toUpperCase() || "·";
                      return (
                        <li key={conversation.id} className="relative">
                          <button
                            onClick={() => {
                              onSelect(conversation.id);
                              onCloseMobile();
                            }}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                              activeId === conversation.id
                                ? "bg-accent-soft text-foreground"
                                : "text-foreground/90 hover:bg-muted-bg",
                              collapsed && "md:justify-center md:px-2",
                            )}
                            title={conversation.title}
                          >
                            {collapsed ? (
                              <span
                                className={cn(
                                  "hidden h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold md:flex",
                                  activeId === conversation.id
                                    ? "bg-accent text-[#041112]"
                                    : "bg-muted-bg text-muted",
                                )}
                              >
                                {initial}
                              </span>
                            ) : (
                              <>
                                <span className="min-w-0 flex-1 truncate">
                                  {conversation.title}
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuId((id) =>
                                      id === conversation.id
                                        ? null
                                        : conversation.id,
                                    );
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setMenuId((id) =>
                                        id === conversation.id
                                          ? null
                                          : conversation.id,
                                      );
                                    }
                                  }}
                                  className="rounded-lg p-1 opacity-0 transition-opacity hover:bg-border group-hover:opacity-100 focus:opacity-100"
                                  aria-label="Chat options"
                                >
                                  <IconMore className="h-4 w-4" />
                                </span>
                              </>
                            )}
                          </button>

                          {menuId === conversation.id && !collapsed && (
                            <div className="absolute top-10 right-2 z-20 w-40 overflow-hidden rounded-xl border border-border bg-panel shadow-[var(--shadow)]">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted-bg"
                                onClick={() => {
                                  onRename(conversation.id);
                                  setMenuId(null);
                                }}
                              >
                                <IconPencil className="h-4 w-4" />
                                Rename
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
                                onClick={() => {
                                  onDelete(conversation.id);
                                  setMenuId(null);
                                }}
                              >
                                <IconTrash className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
        </div>

        <div className="border-t border-sidebar-border p-2.5">
          <div
            className={cn(
              "rounded-2xl bg-muted-bg/60 px-3 py-2.5",
              collapsed && "md:px-1.5 md:py-2",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-3",
              )}
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <BarreIcon
                  size="sm"
                  rounded="rounded-full"
                  className="h-10 w-10 shrink-0"
                />
              )}
              {!collapsed ? (
                <div className="min-w-0 flex-1 pl-0.5">
                  <p className="truncate text-sm font-semibold leading-snug">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] leading-snug text-muted">
                    {displayEmail}
                  </p>
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                "flex items-center",
                collapsed
                  ? "mt-2 flex-col gap-1"
                  : "mt-2.5 justify-between gap-1 border-t border-border/60 pt-2",
              )}
            >
              <div className={cn("flex items-center gap-0.5", collapsed && "flex-col")}>
                <ThemeToggle
                  className="h-8 w-8"
                  iconClassName="h-[18px] w-[18px]"
                />
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-foreground"
                    aria-label="Settings"
                    title="Settings"
                  >
                    <IconSettings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!collapsed && (
                <Button
                  variant="ghost"
                  className="h-8 gap-1.5 px-2.5 text-muted hover:text-foreground"
                  aria-label="Log out"
                  title="Log out and return to sign-in"
                  onClick={() => void signOutAction()}
                >
                  <IconLogout className="h-4 w-4" />
                  <span className="text-xs font-medium">Log out</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
