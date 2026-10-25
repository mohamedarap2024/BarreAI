export type MessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export const SUGGESTIONS = [
  {
    title: "Explain something to me",
    prompt: "Explain quantum computing in simple terms.",
  },
  {
    title: "Help me write",
    prompt: "Help me write a clear professional email requesting a meeting.",
  },
  {
    title: "Generate code",
    prompt: "Generate a TypeScript function that debounces user input.",
  },
  {
    title: "Translate a message",
    prompt: "Translate this to Somali: Hello, how can I help you today?",
  },
] as const;

export function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function groupConversationsByDate(conversations: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of conversations) {
    const updated = new Date(conversation.updatedAt);
    if (updated >= startOfToday) groups[0].items.push(conversation);
    else if (updated >= startOfYesterday) groups[1].items.push(conversation);
    else if (updated >= startOfWeek) groups[2].items.push(conversation);
    else groups[3].items.push(conversation);
  }

  return groups.filter((group) => group.items.length > 0);
}
