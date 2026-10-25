import type { Conversation } from "@/lib/chat-types";

const GLOBAL_KEY = "barre-conversations";

function userKey(userId: string) {
  return `barre-conversations:${userId}`;
}

function safeParse(raw: string | null): Conversation[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is Conversation =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Conversation).id === "string" &&
        typeof (item as Conversation).title === "string" &&
        Array.isArray((item as Conversation).messages),
    );
  } catch {
    return [];
  }
}

/** Load chats for this user, plus any older device-local chats. */
export function loadLocalConversations(userId: string): Conversation[] {
  if (typeof window === "undefined") return [];

  const byUser = safeParse(window.localStorage.getItem(userKey(userId)));
  const legacy = safeParse(window.localStorage.getItem(GLOBAL_KEY));

  return mergeConversations(byUser, legacy);
}

export function saveLocalConversations(
  userId: string,
  conversations: Conversation[],
) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(conversations);
  window.localStorage.setItem(userKey(userId), payload);
  // Keep a device copy so chats still show if auth user id changes
  window.localStorage.setItem(GLOBAL_KEY, payload);
}

export function mergeConversations(
  ...lists: Conversation[][]
): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const list of lists) {
    for (const conversation of list) {
      const existing = map.get(conversation.id);
      if (!existing) {
        map.set(conversation.id, conversation);
        continue;
      }

      const existingTime = Date.parse(existing.updatedAt) || 0;
      const nextTime = Date.parse(conversation.updatedAt) || 0;
      const preferNext =
        nextTime > existingTime ||
        (nextTime === existingTime &&
          conversation.messages.length > existing.messages.length);

      map.set(
        conversation.id,
        preferNext
          ? {
              ...conversation,
              messages:
                conversation.messages.length >= existing.messages.length
                  ? conversation.messages
                  : existing.messages,
            }
          : {
              ...existing,
              messages:
                existing.messages.length >= conversation.messages.length
                  ? existing.messages
                  : conversation.messages,
            },
      );
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
  );
}
