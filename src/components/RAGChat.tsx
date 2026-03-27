import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ExamDate } from '@/components/ExamCountdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2, Plus, X, FileText, BookOpen, GraduationCap, FileSearch, BarChart2, Crown, Maximize2 } from 'lucide-react';
import aStarIcon from '@/assets/a-star-icon.png';
import aStarIconLight from '@/assets/a-star-icon-light.png';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import lucyImage from '/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png';
import jamesImage from '/lovable-uploads/f742f39f-8b1f-456c-b2f6-b8d660792c74.png';
import matanImage from '@/assets/matan-g.png';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProductTier } from '@/hooks/useProductTier';
import { diagrams } from '@/data/diagrams';
import { csDiagrams } from '@/data/csDiagrams';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useChatHistoryContext } from '@/contexts/ChatHistoryContext';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
  imageUrl?: string | string[]; // base64 data URL(s) for user-uploaded images
}
interface UserPreferences {
  year: string;
  predicted_grade: string;
  target_grade: string;
  additional_info: string | null;
}
interface SuggestedPrompt {
  text: string;
  usesPersonalization?: boolean;
}
interface SearchedSource {
  type: string;
  topic: string;
}
interface DiagramData {
  id: string;
  title: string;
  imagePath: string;
}

export interface RAGChatRef {
  submitMessage: (message: string, imageDataUrl?: string | string[]) => void;
}

interface RAGChatProps {
  productId: string;
  /** Product ID used for prompt counting (defaults to productId). Use to share prompt limits across related products. */
  promptProductId?: string;
  subjectName: string;
  subjectDescription?: string;
  footerText?: string;
  placeholder?: string;
  tier?: 'free' | 'deluxe';
  suggestedPrompts?: SuggestedPrompt[];
  enableDiagrams?: boolean;
  diagramSubject?: 'economics' | 'cs';
  chatRef?: React.RefObject<RAGChatRef>;
  examDates?: ExamDate[];
  promptLabels?: string[];
}
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`;
const WORD_DELAY_MS = 30;

// Helper to format source names nicely
const formatSourceName = (name: string): string => {
  if (!name) return 'Training Data';
  // Convert snake_case or kebab-case to Title Case
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Animated searching item component
const SearchingSourceItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  source: string;
  delay?: number;
}> = ({ icon: Icon, label, source, delay = 0 }) => (
  <div 
    className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
  >
    <Icon className="w-3.5 h-3.5 text-primary animate-pulse" />
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground/80">{source}</span>
  </div>
);
export const RAGChat: React.FC<RAGChatProps> = ({
  productId,
  promptProductId,
  subjectName,
  subjectDescription = "Your personal A* tutor. Ask me anything!",
  footerText = "Powered by A* AI",
  placeholder = "Ask me anything...",
  tier = 'deluxe',
  suggestedPrompts = [],
  enableDiagrams = false,
  diagramSubject = 'economics',
  chatRef,
  examDates: examDatesProp,
  promptLabels,
}) => {
  const {
    user
  } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const daysToFirstExam = useMemo(() => {
    if (!examDatesProp || examDatesProp.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = [...examDatesProp].sort((a, b) => a.date.getTime() - b.date.getTime());
    const first = sorted[0];
    return Math.ceil((first.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [examDatesProp]);

  // Fetch real user count (actual signups + 2000) — updates on each page load
  const [displayedUserCount, setDisplayedUserCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_count');
        if (!error && data !== null) {
          setDisplayedUserCount((data as number) + 2000);
        }
      } catch (e) {
        console.error('Error fetching user count:', e);
      }
    };
    fetchUserCount();
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedSources, setSearchedSources] = useState<SearchedSource[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<DiagramData | null>(null);
  const [resolvedDiagramUrl, setResolvedDiagramUrl] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const [diagramFullscreen, setDiagramFullscreen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const { tier: effectiveTier } = useProductTier(productId);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve signed URL for diagram images from storage
  useEffect(() => {
    if (!currentDiagram) { setResolvedDiagramUrl(null); return; }
    const path = currentDiagram.imagePath;
    if (path.startsWith('/') || path.startsWith('http')) {
      setResolvedDiagramUrl(path);
      return;
    }
    const resolve = async () => {
      const { data } = await supabase.storage
        .from('trainer-uploads')
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) setResolvedDiagramUrl(data.signedUrl);
    };
    resolve();
  }, [currentDiagram]);

  // Animation refs
  const bufferRef = useRef('');
  const animationRef = useRef<number | null>(null);
  const fullContentRef = useRef('');

  // Chat history persistence
  const chatHistoryCtx = useChatHistoryContext();
  const { createConversation, saveMessage, loadMessages, fetchConversations } = useChatHistory(productId);
  const conversationIdRef = useRef<string | null>(null);
  const loadMessagesRef = useRef(loadMessages);
  loadMessagesRef.current = loadMessages;

  // Register handlers for sidebar communication (run once)
  useEffect(() => {
    if (!chatHistoryCtx) return;
    chatHistoryCtx.registerHandlers({
      onNewChat: () => {
        setMessages([]);
        conversationIdRef.current = null;
        chatHistoryCtx.setCurrentConversationId(null);
        setLimitReached(false);
      },
      onLoadConversation: async (id: string) => {
        const msgs = await loadMessagesRef.current(id);
        setMessages(msgs.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          imageUrl: m.image_url || undefined,
        })));
        conversationIdRef.current = id;
        chatHistoryCtx.setCurrentConversationId(id);
        setLimitReached(false);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistoryCtx]);

  // Generate a smart title from user message
  const generateTitle = (userMsg: string, assistantMsg?: string): string => {
    // Clean up the message
    const cleaned = userMsg.replace(/\n/g, ' ').trim();
    if (cleaned.length <= 50) return cleaned || 'New Chat';
    // Cut at word boundary around 50 chars
    const cut = cleaned.slice(0, 60);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + '...';
  };

  const firstUserMsgRef = useRef<string | null>(null);

  // Helper to persist a message
  const persistMessage = useCallback(async (role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    if (!user) return;
    // Create conversation on first user message
    if (!conversationIdRef.current && role === 'user') {
      firstUserMsgRef.current = content;
      const title = generateTitle(content);
      const newId = await createConversation(title);
      if (newId) {
        conversationIdRef.current = newId;
        chatHistoryCtx?.setCurrentConversationId(newId);
      }
    }
    if (conversationIdRef.current) {
      await saveMessage(conversationIdRef.current, role, content, imageUrl);
      // After first assistant response, update title with AI-aware summary
      if (role === 'assistant' && firstUserMsgRef.current) {
        const betterTitle = generateTitle(firstUserMsgRef.current);
        firstUserMsgRef.current = null; // Only do this once
        try {
          await supabase.from('chat_conversations')
            .update({ title: betterTitle })
            .eq('id', conversationIdRef.current);
        } catch {}
      }
      chatHistoryCtx?.triggerRefresh();
    }
  }, [user, createConversation, saveMessage, chatHistoryCtx]);
  // Fetch user preferences for this product
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setUserPreferences(null);
        return;
      }
      try {
        // First try to get product-specific preferences
        let {
          data,
          error
        } = await supabase.from('user_preferences').select('year, predicted_grade, target_grade, additional_info').eq('user_id', user.id).eq('product_id', productId).maybeSingle();

        // If no product-specific prefs, fall back to global prefs
        if (!data && !error) {
          const globalResult = await supabase.from('user_preferences').select('year, predicted_grade, target_grade, additional_info').eq('user_id', user.id).is('product_id', null).maybeSingle();
          data = globalResult.data;
          error = globalResult.error;
        }
        if (error) throw error;
        if (data) {
          setUserPreferences(data);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    fetchPreferences();
  }, [user, productId]);

  // Tier is now provided by useProductTier hook (handles grace periods, payment_type, etc.)

  // Auto-scroll only for user messages (not during AI response)
  useEffect(() => {
    // Only scroll when user sends a message (last message is from user)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  // Auto-resize textarea as user types
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Animate words from buffer to displayed content
  const animateNextWord = useCallback(() => {
    if (bufferRef.current.length === 0) {
      setIsAnimating(false);
      return;
    }

    // Match next word (including trailing whitespace)
    const match = bufferRef.current.match(/^(\S+\s*|\s+)/);
    if (match) {
      const word = match[1];
      bufferRef.current = bufferRef.current.slice(word.length);
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex]?.role === 'assistant') {
          return prev.map((m, i) => i === lastIndex ? {
            ...m,
            displayedContent: (m.displayedContent || '') + word
          } : m);
        }
        return prev;
      });

      // Schedule next word
      animationRef.current = window.setTimeout(animateNextWord, WORD_DELAY_MS);
    } else {
      setIsAnimating(false);
    }
  }, []);

  // Start animation if not already running
  const startAnimation = useCallback(() => {
    if (!isAnimating && bufferRef.current.length > 0) {
      setIsAnimating(true);
      animateNextWord();
    }
  }, [isAnimating, animateNextWord]);
  const handleSendWithMessage = async (messageText: string, imageDataUrl?: string | string[]) => {
    if (!messageText.trim() && !imageDataUrl || isLoading) return;
    // Persist user message
    persistMessage('user', messageText, Array.isArray(imageDataUrl) ? imageDataUrl[0] : imageDataUrl);

    // Reset animation state
    bufferRef.current = '';
    fullContentRef.current = '';
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsLoading(true);
    setIsSearching(true);
    setSearchedSources([]);
    setCurrentDiagram(null);
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          message: messageText || '(Please analyse the attached file)',
          product_id: productId,
          prompt_product_id: promptProductId || productId,
          user_preferences: userPreferences,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          tier: effectiveTier,
          user_id: user?.id,
          enable_diagrams: enableDiagrams,
          diagram_subject: diagramSubject,
          image_data: imageDataUrl || null,
          multi_image: Array.isArray(imageDataUrl),
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'limit_exceeded') {
          setLimitReached(true);
          setIsLoading(false);
          setIsSearching(false);
          return;
        }
        // Show user-friendly error instead of raw gateway messages
        throw new Error(errorData.error || 'Something went wrong. Please try again.');
      }
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        displayedContent: ''
      }]);
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            
            // Check if this is metadata (sources + diagram)
            if (parsed.sources_searched) {
              setSearchedSources(parsed.sources_searched);
              setIsSearching(false);
              
              // Handle diagram if present
              if (parsed.diagram) {
                setCurrentDiagram(parsed.diagram);
              }
              continue;
            }
            
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContentRef.current += content;
              setMessages(prev => {
                const lastIndex = prev.length - 1;
                if (lastIndex >= 0 && prev[lastIndex]?.role === 'assistant') {
                  return prev.map((m, i) => i === lastIndex ? {
                    ...m,
                    content: fullContentRef.current
                  } : m);
                }
                return prev;
              });
              bufferRef.current += content;
              if (!animationRef.current || bufferRef.current.length === content.length) {
                setIsAnimating(true);
                animationRef.current = window.setTimeout(animateNextWord, WORD_DELAY_MS);
              }
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
      if (bufferRef.current.length > 0 && !animationRef.current) {
        setIsAnimating(true);
        animateNextWord();
      }
      // Persist assistant response
      if (fullContentRef.current) {
        persistMessage('assistant', fullContentRef.current);
        
        // Trigger A* Brain profile update in background (deluxe only)
        if (user && effectiveTier === 'deluxe') {
          const brainEnabled = localStorage.getItem(`astar_brain_enabled_${user.id}`) === 'true';
          if (brainEnabled) {
            const conversationForBrain = [...messages, { role: 'user' as const, content: messageText }, { role: 'assistant' as const, content: fullContentRef.current }];
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-brain-profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
              body: JSON.stringify({ user_id: user.id, conversation_history: conversationForBrain.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
            }).catch(err => console.error('Brain profile update failed:', err));
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const friendlyMessage = (error instanceof Error && error.message.includes('try again'))
        ? error.message
        : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${friendlyMessage}`,
        displayedContent: `⚠️ ${friendlyMessage}`
      }]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };
  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;
    const messageText = input.trim();
    const imageDataUrl = pendingImage?.dataUrl;
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      imageUrl: imageDataUrl,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingImage(null);

    handleSendWithMessage(messageText, imageDataUrl);
  };

  // Expose submitMessage function via ref for external components (like Essay Marker)
  useEffect(() => {
    if (chatRef) {
      (chatRef as React.MutableRefObject<RAGChatRef>).current = {
        submitMessage: (messageText: string, imageDataUrl?: string | string[]) => {
          if ((!messageText.trim() && !imageDataUrl) || isLoading) return;
          const userMessage: Message = {
            role: 'user',
            content: messageText,
            ...(imageDataUrl ? { imageUrl: imageDataUrl } : {})
          };
          setMessages(prev => [...prev, userMessage]);
          handleSendWithMessage(messageText, imageDataUrl);
        }
      };
    }
  }, [chatRef, isLoading]);

  // Handle suggested prompt click - adds user message and sends
  const handleSuggestedPrompt = (prompt: {
    text: string;
    usesPersonalization?: boolean;
  }) => {
    if (isLoading) return;
    let finalPrompt: string;
    if (prompt.usesPersonalization && userPreferences) {
      finalPrompt = `Create me a full revision plan. I am currently in ${userPreferences.year}, my predicted grade is ${userPreferences.predicted_grade}, and my target grade is ${userPreferences.target_grade}. Today's date is ${new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}.`;
    } else {
      finalPrompt = prompt.text;
    }
    const userMessage: Message = {
      role: 'user',
      content: finalPrompt
    };
    setMessages(prev => [...prev, userMessage]);
    handleSendWithMessage(finalPrompt);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Handle upgrade to Stripe checkout
  const handleUpgradeCheckout = async (paymentType: 'monthly' | 'lifetime' = 'lifetime') => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setIsCheckingOut(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = '/login';
        return;
      }
      const affiliateCode = localStorage.getItem('affiliate_code') || undefined;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType, productId, affiliateCode }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };
  // Handle + button: open file picker directly (all tiers)
  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };
  const processAttachment = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be less than 20MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPendingImage({ dataUrl: reader.result as string, file });
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processAttachment(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAttachment(file);
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingImage = () => setPendingImage(null);

  // Get the content to display for a message (animated or final)
  const getDisplayContent = (message: Message, index: number) => {
    const isLastMessage = index === messages.length - 1;
    const isAssistant = message.role === 'assistant';

    // For the last assistant message that's being animated, show displayedContent
    if (isLastMessage && isAssistant && (isLoading || isAnimating)) {
      return message.displayedContent || '';
    }

    // For completed messages, show full content
    return message.content;
  };
  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm border-4 border-dashed border-primary rounded-2xl pointer-events-none">
          <div className="text-center">
            <Plus className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-base font-semibold text-primary">Drop image here</p>
          </div>
        </div>
      )}

      {/* Messages area - scrollable */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 pb-[160px]">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
              <div className="text-center py-16 max-[767px]:py-2 max-[767px]:-mt-14 [@media_(min-width:768px)_and_(max-width:1366px)_and_(min-aspect-ratio:3/4)_and_(max-aspect-ratio:4/3)]:py-0 [@media_(min-width:768px)_and_(max-width:1366px)_and_(min-aspect-ratio:3/4)_and_(max-aspect-ratio:4/3)]:-mt-28">
                <img src={currentLogo} alt="A* AI" className="h-24 mx-auto mb-1" />
                {daysToFirstExam !== null ? (
                  <>
                    <h2 className="text-[1.75rem] sm:text-[2.25rem] md:text-[2.75rem] font-bold mb-1 leading-[1.1] tracking-tight">
                      <span className="text-foreground">{daysToFirstExam} days to go.</span> <span className="text-primary">Let's get you that A*.</span>
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">Your {subjectName} revision, sorted</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-[1.75rem] sm:text-[2.25rem] md:text-[2.75rem] font-bold mb-1 leading-[1.1] tracking-tight">
                      <span className="text-primary">Let's get you that A*.</span>
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">Your {subjectName} revision, sorted</p>
                  </>
                )}
                
                {/* Social proof badges */}
                <div className="flex items-center justify-center gap-2.5 flex-wrap mt-3">
                  <div className="flex items-center gap-2 border border-border bg-card/80 backdrop-blur-sm rounded-full py-1.5 px-4 shadow-sm">
                    <div className="flex">
                      <img src={lucyImage} alt="Lucy" className="w-5 h-5 rounded-full object-cover border-2 border-card z-[3]" />
                      <img src={jamesImage} alt="James" className="w-5 h-5 rounded-full object-cover border-2 border-card -ml-1.5 z-[2]" />
                      <img src={matanImage} alt="Matan" className="w-5 h-5 rounded-full object-cover object-[center_20%] border-2 border-card -ml-1.5 z-[1]" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{displayedUserCount !== null ? `${displayedUserCount.toLocaleString()} students` : '...'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 border border-border bg-card/80 backdrop-blur-sm rounded-full py-1.5 px-4 shadow-sm">
                    <span className="text-xs tracking-wider text-amber-500 dark:text-amber-400">★★★★★</span>
                    <span className="text-xs font-medium text-foreground">4.9 / 5</span>
                  </div>

                  <div className="flex items-center gap-1.5 border border-border bg-card/80 backdrop-blur-sm rounded-full py-1.5 px-4 shadow-sm">
                    <span className="text-xs text-primary font-bold">↑</span>
                    <span className="text-xs font-medium text-foreground">620% growth this term</span>
                  </div>
                </div>
              </div>
          )}

          {messages.map((message, index) => {
            const rawDisplayContent = getDisplayContent(message, index);
            // Strip any "[Insert ... Here]" or "[See ... diagram]" placeholder text the AI might generate
            const displayContent = rawDisplayContent.replace(/\[(?:Insert|See|View|Show)[\s\S]*?(?:Here|Diagram|diagram|Figure|figure)\]/gi, '').replace(/\n{3,}/g, '\n\n');
            const isLastAssistant = index === messages.length - 1 && message.role === 'assistant';
            const showCursor = isLastAssistant && (isLoading || isAnimating) && displayContent.length > 0;
            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3 p-4 rounded-xl",
                  message.role === 'user'
                    ? cn("text-foreground ml-auto max-w-[70%]", theme === 'dark' ? "bg-white/10 border border-white/5" : "bg-accent/60 border border-border")
                    : "bg-muted max-w-[90%]"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <img src={theme === 'dark' ? aStarIcon : aStarIconLight} alt="A* AI" className="w-8 h-8 object-contain" />
                  </div>
                )}
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  {message.imageUrl && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(Array.isArray(message.imageUrl) ? message.imageUrl : [message.imageUrl]).map((url, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={url}
                          alt={`Attached image ${imgIdx + 1}`}
                          className="max-w-[240px] max-h-[200px] object-contain rounded-lg border border-border block"
                        />
                      ))}
                    </div>
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                        return <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2"><code className={cn("text-sm font-mono", className)} {...props}>{children}</code></pre>;
                      },
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic my-2">{children}</blockquote>,
                      table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border border-border text-sm">{children}</table></div>,
                      thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                      th: ({ children }) => <th className="px-3 py-2 text-left font-semibold border border-border">{children}</th>,
                      td: ({ children }) => <td className="px-3 py-2 border border-border">{children}</td>,
                    }}
                  >
                    {(() => {
                      // If diagram should be embedded, find the best insertion point
                      const shouldEmbedDiagram = isLastAssistant && currentDiagram && resolvedDiagramUrl;
                      if (shouldEmbedDiagram && displayContent) {
                        // Find where the AI references the diagram naturally
                        const diagramRefPatterns = [
                          /(?:as\s+(?:shown|illustrated|seen)\s+(?:in|by)\s+the\s+diagram)/i,
                          /(?:the\s+(?:diagram|figure|chart)\s+(?:below|above|here))/i,
                          /(?:(?:see|refer\s+to)\s+the\s+(?:diagram|figure))/i,
                          /(?:diagram\s+(?:illustrates|shows|demonstrates))/i,
                        ];
                        
                        let splitAt = -1;
                        for (const pattern of diagramRefPatterns) {
                          const match = displayContent.match(pattern);
                          if (match && match.index !== undefined) {
                            // Find the end of the paragraph containing this reference
                            const afterMatch = displayContent.indexOf('\n\n', match.index);
                            if (afterMatch > 0) {
                              splitAt = afterMatch;
                              break;
                            }
                          }
                        }
                        
                        // Fallback: split after first paragraph
                        if (splitAt < 0) {
                          splitAt = displayContent.indexOf('\n\n');
                        }
                        
                        if (splitAt > 0) {
                          return displayContent.slice(0, splitAt);
                        }
                      }
                      return displayContent;
                    })()}
                  </ReactMarkdown>
                  {showCursor && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}

                  {isLastAssistant && currentDiagram && resolvedDiagramUrl && (() => {
                    // Find the same split point as above for the rest content
                    const diagramRefPatterns = [
                      /(?:as\s+(?:shown|illustrated|seen)\s+(?:in|by)\s+the\s+diagram)/i,
                      /(?:the\s+(?:diagram|figure|chart)\s+(?:below|above|here))/i,
                      /(?:(?:see|refer\s+to)\s+the\s+(?:diagram|figure))/i,
                      /(?:diagram\s+(?:illustrates|shows|demonstrates))/i,
                    ];
                    
                    let splitAt = -1;
                    for (const pattern of diagramRefPatterns) {
                      const match = displayContent.match(pattern);
                      if (match && match.index !== undefined) {
                        const afterMatch = displayContent.indexOf('\n\n', match.index);
                        if (afterMatch > 0) { splitAt = afterMatch; break; }
                      }
                    }
                    if (splitAt < 0) splitAt = displayContent.indexOf('\n\n');
                    
                    const restContent = splitAt > 0 ? displayContent.slice(splitAt + 2) : null;
                    
                    return (
                      <>
                        <div className="my-4 p-3 rounded-lg border border-border bg-background">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{currentDiagram.title}</span>
                            <button
                              onClick={() => setDiagramFullscreen(true)}
                              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Maximize2 className="w-3 h-3" />
                              (click to expand)
                            </button>
                          </div>
                          <div
                            className="rounded-lg overflow-hidden bg-white cursor-pointer"
                            onClick={() => setDiagramFullscreen(true)}
                          >
                            <img
                              src={resolvedDiagramUrl}
                              alt={currentDiagram.title}
                              className="w-full max-w-md h-auto object-contain rounded-lg border border-border"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        </div>
                        {restContent && (
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {restContent}
                          </ReactMarkdown>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}

          {/* Limit Reached Upgrade Card */}
          {limitReached && (
            <div className="max-w-md mx-auto py-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
                <p className="text-muted-foreground text-sm mb-4">You've used all 3 free prompts for today. Upgrade for unlimited access!</p>
                <div className="bg-muted/50 rounded-xl p-4 mb-4 text-left">
                  <p className="font-semibold text-sm mb-3">Upgrade to unlock:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited daily prompts</span></li>
                    <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited essay marking</span></li>
                    <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited diagram searches</span></li>
                    <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Image upload &amp; analysis</span></li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold" onClick={() => handleUpgradeCheckout('lifetime')} disabled={isCheckingOut}>
                    {isCheckingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Exam Season Pass – £39.99'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => handleUpgradeCheckout('monthly')} disabled={isCheckingOut}>
                    Monthly – £8.99/mo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Your free prompts reset at midnight</p>
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 p-4 rounded-xl bg-muted mr-auto max-w-[85%]">
              <img src={theme === 'dark' ? aStarIcon : aStarIconLight} alt="A* AI" className="w-8 h-8 object-contain flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                {isSearching ? (
                  <>
                    <div className="flex items-center gap-2">
                      <FileSearch className="w-4 h-4 animate-pulse text-primary" />
                      <span className="text-sm font-medium text-foreground">Searching knowledge base...</span>
                    </div>
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                      <SearchingSourceItem icon={BookOpen} label="Searching" source={`${subjectName} Specification`} delay={0} />
                      <SearchingSourceItem icon={FileText} label="Searching" source={`${subjectName} Exam Structure`} delay={100} />
                      <SearchingSourceItem icon={GraduationCap} label="Searching" source={`${subjectName} Structured Response Guide`} delay={200} />
                      <SearchingSourceItem icon={FileText} label="Searching" source="Past Paper Questions" delay={300} />
                    </div>
                  </>
                ) : searchedSources.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Generating response...</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {searchedSources.slice(0, 5).map((source, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                          <FileText className="w-3 h-3 text-primary" />
                          <span>Found: {formatSourceName(source.topic || source.type)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed bottom composer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent pt-4 pb-4 z-50">
        {/* Suggested prompts — hidden when an image is pending */}
        {messages.length === 0 && suggestedPrompts.length > 0 && !pendingImage && (
          <div className="grid grid-cols-2 gap-3 max-w-3xl w-full mx-auto mb-5 px-4">
              {suggestedPrompts.map((prompt, idx) => {
                const defaultLabels = ['Topic', 'Key concept', 'Exam technique', 'Study plan'];
                const labels = promptLabels || defaultLabels;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    disabled={isLoading}
                    className="bg-background border border-border rounded-xl px-4 py-4 text-left flex flex-col gap-1.5 transition-colors hover:border-primary/40 hover:bg-[hsl(263_70%_50%/0.06)] dark:hover:bg-primary/10 disabled:opacity-50"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary font-sans">
                      {labels[idx] || ''}
                    </span>
                    <span className="text-sm text-foreground leading-snug font-sans">
                      {prompt.text}
                    </span>
                  </button>
                );
              })}
            </div>
        )}

        <div className="max-w-5xl mx-auto px-4">
          {/* Pill container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden bg-background shadow-[0_0_15px_rgba(var(--primary),0.08),0_0_30px_rgba(var(--primary),0.04)]">

            {/* Pending image preview strip */}
            {pendingImage && (
              <div className="px-3 pt-3 pb-1 flex items-start gap-2">
                <div className="relative group w-20 h-20 flex-shrink-0">
                  <img
                    src={pendingImage.dataUrl}
                    alt="Attachment preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={removePendingImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Text input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={limitReached ? 'Upgrade to continue...' : placeholder}
              disabled={isLoading || limitReached}
              className="w-full min-h-[48px] max-h-[200px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-base overflow-y-auto"
              rows={1}
            />

            {/* Buttons row */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
              {/* Hidden file input — no capture attr so iOS shows native sheet (Photos / Camera / Files) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.pptx,.ppt"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Plus button — all tiers get image upload */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-primary/10"
                disabled={isLoading}
                onClick={handlePlusClick}
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </Button>

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage) || isLoading || limitReached}
                size="icon"
                className="h-9 w-9 rounded-full bg-gradient-brand hover:opacity-90 glow-brand"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-2">{footerText}</p>
        </div>
      </div>

      {/* Fullscreen diagram overlay */}
      {diagramFullscreen && currentDiagram && resolvedDiagramUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDiagramFullscreen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-2 text-white">
                <BarChart2 className="w-5 h-5" />
                <span className="font-medium">{currentDiagram.title}</span>
              </div>
              <button
                onClick={() => setDiagramFullscreen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden w-full">
              <img
                src={resolvedDiagramUrl}
                alt={currentDiagram.title}
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
