---
name: chat
overview: >
  Chat UI for AI-assisted recipe refinement. A chat interface lives inside RecipeDetailPage,
  scoped to one recipe. Users create a session, send messages, and the AI replies — optionally
  revising the recipe in place. Covers session management, message history, and the live
  message input.
todos:
  - id: chat-types
    content: >
      Create src/types/chat.ts with types mirroring the backend schemas:
        ChatSessionRead, ChatSessionSummaryRead (id, title, created_at, message_count)
        ChatMessageRead (id, chat_session_id, role: 'user' | 'assistant', content, created_at)
        ChatSessionCreate (recipe_id)
        ChatMessageCreate (content: string)
    status: pending

  - id: chat-api
    content: >
      Create src/lib/api/chat.ts with typed functions:
        fetchChatSessions(recipeId) -> ChatSessionSummaryRead[]
        fetchChatSession(sessionId) -> { session: ChatSessionRead, messages: ChatMessageRead[] }
        createChatSession(recipeId) -> ChatSessionRead
        sendMessage(sessionId, content) -> ChatMessageRead[]
        deleteChatSession(sessionId) -> void
    status: pending
    dependencies:
      - chat-types

  - id: chat-query-keys
    content: >
      Add chatKeys to src/lib/queryKeys.ts:
        all, sessions(recipeId), session(sessionId), messages(sessionId)
    status: pending
    dependencies:
      - chat-api

  - id: chat-hooks
    content: >
      Create src/hooks/useChat.ts with:
        useChatSessions(recipeId) — useQuery on fetchChatSessions
        useChatSession(sessionId) — useQuery on fetchChatSession (includes messages)
        useCreateChatSession() — useMutation; onSuccess: invalidate sessions(recipeId)
        useSendMessage() — useMutation; onSuccess: invalidate messages(sessionId) +
          recipeKeys.detail(recipeId) (AI may have revised the recipe)
        useDeleteChatSession() — useMutation; onSuccess: invalidate sessions(recipeId)
    status: pending
    dependencies:
      - chat-query-keys

  - id: chat-interface
    content: >
      Create src/components/ChatInterface.tsx. Renders inside RecipeDetailPage, scoped to
      the current recipe. Behaviour:
        - On first render with no sessions: show "Start a chat" button that calls
          useCreateChatSession(); once created, opens the chat view immediately.
        - Session list: a collapsible sidebar or dropdown listing ChatSessionSummaryRead
          items (with delete option per session).
        - Message list: scrollable list of ChatMessageRead, alternating user/assistant bubbles.
          User messages are right-aligned; assistant messages are left-aligned.
        - Message input: a TextField + send button at the bottom. Disable while
          useSendMessage isPending. Clear input on send.
        - When AI returns a revised recipe, refresh the RecipeDetailPage ingredients
          automatically (query invalidation handles this).
    status: pending
    dependencies:
      - chat-hooks

  - id: chat-message-bubble
    content: >
      Create src/components/ChatMessageBubble.tsx. Renders a single ChatMessageRead.
      User bubble: right-aligned, primary background. Assistant bubble: left-aligned, paper
      background. Render content as plain text (no dangerouslySetInnerHTML).
      Show created_at as a relative timestamp (e.g., "2 min ago").
    status: pending
    dependencies:
      - chat-interface

  - id: chat-tests
    content: >
      Tests for:
        - ChatInterface: shows "Start a chat" when no session; renders messages; sends message;
          disables input while pending.
        - ChatMessageBubble: renders user and assistant roles with correct alignment.
        - useSendMessage: invalidates recipeKeys.detail on success (recipe may be revised).
        - useDeleteChatSession: invalidates sessions() on success.
      MSW handlers for POST /chat/recipes/:id/chat-sessions, GET /chat/chat-sessions/:id,
      POST /chat/chat-sessions/:id/messages, DELETE /chat/chat-sessions/:id.
    status: pending
    dependencies:
      - chat-message-bubble
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | TypeScript types (ChatSession, ChatMessage) |
| ⏳ Pending | Chat API functions |
| ⏳ Pending | Query keys |
| ⏳ Pending | Custom hooks |
| ⏳ Pending | ChatInterface component (session picker + message list + input) |
| ⏳ Pending | ChatMessageBubble component |
| ⏳ Pending | Tests |

---

## Implementation notes

### Recipe revision

When the AI revises a recipe in response to a message, `useSendMessage` must invalidate
`recipeKeys.detail(recipeId)` so `RecipeDetailPage` refetches the updated recipe and
ingredients automatically. The user should see the updated ingredients without a manual refresh.

### Message input UX

Disable the send button and TextField while `isPending`. On send:
1. Clear the input immediately (optimistic UX).
2. Wait for the mutation to settle.
3. Scroll the message list to the bottom after the assistant reply appears.

Use a `useEffect` + `ref` on the message list container to scroll to the bottom whenever
the messages array changes length.

### Session list management

Most users will have one chat session per recipe. Still support multiple sessions (the
backend allows it) via a compact session picker — a simple `Select` or small button group
above the message list. The active session id drives `useChatSession(sessionId)`.

### Pending backend features

Session listing (`GET /chat/recipes/:id/chat-sessions`) and session deletion
(`DELETE /chat/chat-sessions/:id`) are pending in the backend (see backend chat.plan.md).
Until they ship, render a single default session per recipe without a session picker.
