import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatConversation {
  id: string;
  title: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  created_at: string;
}

export const useChatHistory = (productId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user || !productId) { setConversations([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setConversations((data as ChatConversation[]) || []);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  }, [user, productId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const createConversation = async (title: string): Promise<string | null> => {
    if (!user || !productId) return null;
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, product_id: productId, title: title.slice(0, 80) })
        .select('id')
        .single();
      if (error) throw error;
      await fetchConversations();
      return data.id;
    } catch (e) {
      console.error('Failed to create conversation:', e);
      return null;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const loadMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as ChatMessage[]) || [];
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    try {
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role,
        content,
        image_url: imageUrl || null,
      });
      // Touch conversation updated_at
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  };

  return {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    deleteConversation,
    loadMessages,
    saveMessage,
  };
};
