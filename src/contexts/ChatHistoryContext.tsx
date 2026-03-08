import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ChatHistoryHandlers {
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
}

interface ChatHistoryContextType {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  registerHandlers: (handlers: ChatHistoryHandlers) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

export const ChatHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const handlersRef = useRef<ChatHistoryHandlers | null>(null);

  const registerHandlers = useCallback((h: ChatHistoryHandlers) => {
    handlersRef.current = h;
  }, []);

  const onNewChat = useCallback(() => {
    handlersRef.current?.onNewChat();
  }, []);

  const onLoadConversation = useCallback((id: string) => {
    handlersRef.current?.onLoadConversation(id);
  }, []);

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
