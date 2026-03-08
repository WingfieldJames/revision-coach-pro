

# Plan: Replace "Your Tools" with Chat History in Sidebar

## Current State
- Messages in `RAGChat.tsx` are stored in React state only (`useState<Message[]>([])`) — no persistence
- No database tables for chat conversations or messages exist
- The sidebar has a "Your Tools" section that needs to be replaced with chat history
- The top toolbar already has all the tools, so removing them from the sidebar is safe

## What We'll Build

The sidebar's "Your Tools" section becomes a **Chat History** panel where users can:
- See a list of previous conversations grouped by date (Today, Yesterday, Last 7 Days, Older)
- Click a conversation to load it back into the chat
- Start a new conversation (clears current chat)
- Delete old conversations
- Each conversation shows a title (auto-generated from the first user message, truncated)

## Database Changes

**New table: `chat_conversations`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `product_id` (uuid, nullable)
- `title` (text) — first ~80 chars of first user message
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**New table: `chat_messages`**
- `id` (uuid, PK)
- `conversation_id` (uuid, FK → chat_conversations)
- `role` (text) — 'user' or 'assistant'
- `content` (text)
- `image_url` (text, nullable) — base64 or storage URL
- `created_at` (timestamptz)

**RLS policies:** Users can only CRUD their own conversations and messages (via `auth.uid() = user_id` on conversations, and join-based check on messages).

## Component Changes

### 1. `src/components/ChatbotSidebar.tsx`
- Remove the "Your Tools" section entirely (tools list, tool detail views, all tool imports)
- Remove `ToolView` type and tool rendering logic
- Replace with a **Chat History** section:
  - Header: "Chat History" with `MessageSquare` icon
  - "New Chat" button at top
  - List of conversations sorted by `updated_at` desc, grouped by date
  - Each item shows truncated title + relative time
  - Click loads conversation into RAGChat
  - Trash icon to delete a conversation
- Keep: Subject Navigator, Navigation, Upgrade CTA sections unchanged

### 2. `src/components/RAGChat.tsx`
- Add `conversationId` state tracking current conversation
- On first user message in a new conversation: create a `chat_conversations` row, set the title
- On every message send/receive: insert into `chat_messages`
- Expose a way for sidebar to set `conversationId` and load messages
- Add a `onConversationChange` callback prop or use a shared context/ref
- "New Chat" resets messages and conversationId

### 3. New hook: `src/hooks/useChatHistory.ts`
- Fetches conversations for current user + product
- Provides `loadConversation(id)`, `deleteConversation(id)`, `createConversation()`
- Returns conversations list with loading state

### 4. Prop Threading
- `ChatbotSidebar` gets new props: `onLoadConversation`, `onNewChat`, `conversations[]`
- `RAGChat` gets new props or ref methods: `loadConversation(id)`, current `conversationId`
- Each page wires these together (similar pattern to existing `onEssayMarkerSubmit` wiring via refs)

## Data Flow

```text
User clicks conversation in sidebar
  → ChatbotSidebar calls onLoadConversation(id)
  → Page handler calls chatRef.current.loadConversation(id)
  → RAGChat fetches messages from chat_messages table
  → RAGChat sets messages state + conversationId

User sends first message in empty chat
  → RAGChat creates chat_conversations row
  → RAGChat inserts user message into chat_messages
  → On AI response, inserts assistant message into chat_messages
  → Sidebar auto-refreshes conversation list

User clicks "New Chat"
  → RAGChat clears messages, resets conversationId to null
```

## Auth Requirement
- Chat history only works for logged-in users
- If not logged in, sidebar shows a prompt to log in to save chat history
- Unauthenticated users still get the current ephemeral chat behavior

