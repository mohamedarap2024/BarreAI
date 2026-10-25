import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import type { ChatMessage, Conversation } from "@/lib/chat-types";

export async function listConversations(userId: string): Promise<Conversation[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    messages: [],
  }));
}

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    messages: messageRows.map(
      (m): ChatMessage => ({
        id: m.id,
        role: m.role as ChatMessage["role"],
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  };
}

export async function createConversation(input: {
  userId: string;
  id: string;
  title: string;
  message?: ChatMessage;
}) {
  const now = new Date();
  await db.insert(conversations).values({
    id: input.id,
    userId: input.userId,
    title: input.title,
    createdAt: now,
    updatedAt: now,
  });

  if (input.message) {
    await db.insert(messages).values({
      id: input.message.id,
      conversationId: input.id,
      role: input.message.role,
      content: input.message.content,
      createdAt: new Date(input.message.createdAt),
    });
  }
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
) {
  const result = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .returning({ id: conversations.id });

  return result.length > 0;
}

export async function deleteConversation(
  userId: string,
  conversationId: string,
) {
  const result = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .returning({ id: conversations.id });

  return result.length > 0;
}

export async function appendMessages(
  userId: string,
  conversationId: string,
  newMessages: ChatMessage[],
) {
  const [owned] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  if (!owned) return false;

  if (newMessages.length > 0) {
    await db.insert(messages).values(
      newMessages.map((m) => ({
        id: m.id,
        conversationId,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })),
    );
  }

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return true;
}

export async function replaceMessagesFrom(
  userId: string,
  conversationId: string,
  keepUntilMessageId: string | null,
  newMessages: ChatMessage[],
) {
  const conversation = await getConversation(userId, conversationId);
  if (!conversation) return false;

  let keepIds = new Set(conversation.messages.map((m) => m.id));
  if (keepUntilMessageId) {
    const index = conversation.messages.findIndex(
      (m) => m.id === keepUntilMessageId,
    );
    const kept =
      index >= 0
        ? conversation.messages.slice(0, index)
        : conversation.messages;
    keepIds = new Set(kept.map((m) => m.id));

    const removeIds = conversation.messages
      .filter((m) => !keepIds.has(m.id))
      .map((m) => m.id);

    for (const id of removeIds) {
      await db.delete(messages).where(eq(messages.id, id));
    }
  } else {
    await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId));
  }

  if (newMessages.length > 0) {
    await db.insert(messages).values(
      newMessages.map((m) => ({
        id: m.id,
        conversationId,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })),
    );
  }

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return true;
}
