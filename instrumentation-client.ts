import { initBotId } from "botid/client/core";

// Protect expensive / abuse-prone routes. Paths must match server checkBotId() usage.
initBotId({
  protect: [
    {
      path: "/api/chat",
      method: "POST",
    },
    {
      path: "/api/conversations",
      method: "POST",
    },
    {
      path: "/api/conversations/*/messages",
      method: "POST",
    },
  ],
});
