import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatHistoryContextType {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  registerHandlers: (handlers: { onNewChat: () => void; onLoadConversation: (id: string) => void }) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

export const ChatHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [handlers, setHandlers] = useState<{ onNewChat: () => void; onLoadConversation: (id: string) => void } | null>(null);

  const registerHandlers = useCallback((h: { onNewChat: () => void; onLoadConversation: (id: string) => void }) => {
    setHandlers(h);
  }, []);

  const onNewChat = useCallback(() => {
    handlers?.onNewChat();
  }, [handlers]);

  const onLoadConversation = useCallback((id: string) => {
    handlers?.onLoadConversation(id);
  }, [handlers]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <ChatHistoryContext.Provider value={{ currentConversationId, setCurrentConversationId, onNewChat, onLoadConversation, registerHandlers, refreshKey, triggerRefresh }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistoryContext = () => useContext(ChatHistoryContext);
