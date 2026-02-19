import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Plus, X, FileText, BookOpen, GraduationCap, FileSearch, BarChart2, Sparkles, Crown } from 'lucide-react';
import aStarIcon from '@/assets/a-star-icon.png';
import aStarIconLight from '@/assets/a-star-icon-light.png';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
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
import { diagrams } from '@/data/diagrams';
import { csDiagrams } from '@/data/csDiagrams';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
  imageUrl?: string; // base64 data URL for user-uploaded images
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
  submitMessage: (message: string) => void;
}

interface RAGChatProps {
  productId: string;
  subjectName: string;
  subjectDescription?: string;
  footerText?: string;
  placeholder?: string;
  tier?: 'free' | 'deluxe';
  suggestedPrompts?: SuggestedPrompt[];
  enableDiagrams?: boolean;
  diagramSubject?: 'economics' | 'cs';
  chatRef?: React.RefObject<RAGChatRef>;
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
  subjectName,
  subjectDescription = "Your personal A* tutor. Ask me anything!",
  footerText = "Powered by A* AI",
  placeholder = "Ask me anything...",
  tier = 'deluxe',
  suggestedPrompts = [],
  enableDiagrams = false,
  diagramSubject = 'economics',
  chatRef
}) => {
  const {
    user
  } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedSources, setSearchedSources] = useState<SearchedSource[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<DiagramData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [effectiveTier, setEffectiveTier] = useState<'free' | 'deluxe'>('free');
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animation refs
  const bufferRef = useRef('');
  const animationRef = useRef<number | null>(null);
  const fullContentRef = useRef('');

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

  // Auto-detect subscription tier
  useEffect(() => {
    const detectTier = async () => {
      if (!user) {
        setEffectiveTier('free');
        return;
      }
      try {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('tier, subscription_end')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .eq('active', true)
          .maybeSingle();
        
        if (sub?.tier === 'deluxe') {
          if (!sub.subscription_end || new Date(sub.subscription_end) > new Date()) {
            setEffectiveTier('deluxe');
            return;
          }
        }
        setEffectiveTier('free');
      } catch {
        setEffectiveTier('free');
      }
    };
    detectTier();
  }, [user, productId]);

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
  const handleSendWithMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

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
          message: messageText,
          product_id: productId,
          user_preferences: userPreferences,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          tier: effectiveTier,
          user_id: user?.id,
          enable_diagrams: enableDiagrams,
          diagram_subject: diagramSubject
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
        throw new Error(errorData.error || 'Failed to get response');
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
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        displayedContent: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };
  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;
    const messageText = input.trim();
    const imageUrl = pendingImage?.dataUrl;
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      imageUrl,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingImage(null);

    // Use the shared send logic (send image description + text to AI)
    const textToSend = messageText || (imageUrl ? '(Image attached)' : '');
    handleSendWithMessage(textToSend);
  };

  // Expose submitMessage function via ref for external components (like Essay Marker)
  useEffect(() => {
    if (chatRef) {
      (chatRef as React.MutableRefObject<RAGChatRef>).current = {
        submitMessage: (messageText: string) => {
          if (!messageText.trim() || isLoading) return;
          const userMessage: Message = {
            role: 'user',
            content: messageText
          };
          setMessages(prev => [...prev, userMessage]);
          handleSendWithMessage(messageText);
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

  // State for upgrade prompt dialog
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
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
  // Handle + button: open file picker directly
  const handlePlusClick = () => {
    if (effectiveTier === 'free') {
      setShowUpgradePrompt(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingImage({ dataUrl: reader.result as string, file });
    };
    reader.readAsDataURL(file);
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
  return <div className="flex flex-col h-full relative">
      {/* Messages area - scrollable */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 pb-[160px]">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && <div className="text-center py-16">
              <img src={currentLogo} alt="A* AI" className="h-16 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2 dark:text-foreground light-gradient-subject">
                {subjectName}
              </h2>
              <p className="text-muted-foreground">
                {subjectDescription}
              </p>
            </div>}
          
          {messages.map((message, index) => {
          const displayContent = getDisplayContent(message, index);
          const isLastAssistant = index === messages.length - 1 && message.role === 'assistant';
          const showCursor = isLastAssistant && (isLoading || isAnimating) && displayContent.length > 0;
          return <div key={index} className={cn("flex gap-3 p-4 rounded-xl", message.role === 'user' ? cn("text-foreground ml-auto max-w-[70%]", theme === 'dark' ? "bg-white/10 border border-white/5" : "bg-accent/60 border border-border") : "bg-muted max-w-[90%]")}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <img src={theme === 'dark' ? aStarIcon : aStarIconLight} alt="A* AI" className="w-8 h-8 object-contain" />
                  </div>
                )}
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  {/* Show attached image if present */}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attached image"
                      className="max-w-[240px] max-h-[200px] object-contain rounded-lg border border-border mb-2 block"
                    />
                  )}
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{
                p: ({
                  children
                }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({
                  children
                }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({
                  children
                }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({
                  children
                }) => <li className="mb-1">{children}</li>,
                code: ({
                  className,
                  children,
                  ...props
                }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>;
                  }
                  return <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2">
                            <code className={cn("text-sm font-mono", className)} {...props}>
                              {children}
                            </code>
                          </pre>;
                },
                strong: ({
                  children
                }) => <strong className="font-semibold">{children}</strong>,
                em: ({
                  children
                }) => <em className="italic">{children}</em>,
                h1: ({
                  children
                }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                h2: ({
                  children
                }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                h3: ({
                  children
                }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                blockquote: ({
                  children
                }) => <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                          {children}
                        </blockquote>,
                table: ({
                  children
                }) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border border-border text-sm">{children}</table></div>,
                thead: ({
                  children
                }) => <thead className="bg-muted">{children}</thead>,
                tbody: ({
                  children
                }) => <tbody>{children}</tbody>,
                tr: ({
                  children
                }) => <tr className="border-b border-border">{children}</tr>,
                th: ({
                  children
                }) => <th className="px-3 py-2 text-left font-semibold border border-border">{children}</th>,
                td: ({
                  children
                }) => <td className="px-3 py-2 border border-border">{children}</td>,
              }}>
                    {displayContent}
                  </ReactMarkdown>
                  {showCursor && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                  
                  {/* Show diagram for last assistant message if available */}
                  {isLastAssistant && currentDiagram && !isLoading && !isAnimating && (
                    <div className="mt-4 p-3 rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{currentDiagram.title}</span>
                      </div>
                      <img 
                        src={currentDiagram.imagePath} 
                        alt={currentDiagram.title} 
                        className="w-full max-w-md rounded-lg border border-border"
                      />
                    </div>
                  )}
                </div>
              </div>;
        })}
          
          {/* Limit Reached Upgrade Card */}
          {limitReached && (
            <div className="max-w-md mx-auto py-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You've used all 3 free prompts for today. Upgrade for unlimited access!
                </p>
                <div className="bg-muted/50 rounded-xl p-4 mb-4 text-left">
                  <p className="font-semibold text-sm mb-3">Upgrade to unlock:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Unlimited daily prompts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Unlimited essay marking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Unlimited diagram searches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Image upload & OCR analysis</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold"
                    onClick={() => handleUpgradeCheckout('lifetime')}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Exam Season Pass – £24.99'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleUpgradeCheckout('monthly')}
                    disabled={isCheckingOut}
                  >
                    Monthly – £6.99/mo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Your free prompts reset at midnight
                </p>
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && <div className="flex gap-3 p-4 rounded-xl bg-muted mr-auto max-w-[85%]">
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
            </div>}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed bottom composer - two line layout */}
      <div className="fixed bottom-0 left-0 right-0 bg-background pt-4 pb-4 z-50">
        {/* Suggested prompts - full width, outside max-w container */}
        {messages.length === 0 && suggestedPrompts.length > 0 && (
          <div className="flex justify-center gap-2 mb-3 w-full overflow-x-auto scrollbar-thin pb-1 px-4">
            {suggestedPrompts.map((prompt, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSuggestedPrompt(prompt)} 
                disabled={isLoading} 
                className={`px-4 py-2 rounded-full border border-border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50 ${theme === 'dark' ? 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground' : 'text-white hover:opacity-90'}`}
                style={theme === 'dark' ? undefined : { background: 'var(--gradient-brand)' }}
              >
                {prompt.text}
              </button>
            ))}
          </div>
        )}
        
        <div className="max-w-5xl mx-auto px-4">
          {/* Pill container */}
          <div className="border-2 border-border rounded-2xl overflow-hidden bg-background">

            {/* Pending image preview strip */}
            {pendingImage && (
              <div className="px-3 pt-3 pb-1 flex items-start gap-2">
                <div className="relative group w-20 h-20 flex-shrink-0">
                  <img
                    src={pendingImage.dataUrl}
                    alt="Attachment preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  {/* Remove on hover */}
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
              {/* Hidden file input – always rendered */}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

              {/* Plus button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-primary/10"
                disabled={isLoading}
                onClick={handlePlusClick}
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </Button>

              {/* Upgrade prompt dialog for free users */}
              {showUpgradePrompt && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
                  onClick={() => setShowUpgradePrompt(false)}
                >
                  <div
                    className="bg-background border border-border rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Unlock Image Upload</h3>
                      <p className="text-muted-foreground text-sm">
                        Upgrade to attach images directly to your messages.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 mb-4">
                      <p className="font-semibold text-sm mb-3">Upgrade to unlock:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Image attachments in chat</span></li>
                        <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited daily prompts</span></li>
                        <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited essay marking</span></li>
                        <li className="flex items-center gap-2"><span className="text-primary">✓</span><span>Unlimited diagram searches</span></li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold"
                        onClick={() => { setShowUpgradePrompt(false); handleUpgradeCheckout('lifetime'); }}
                        disabled={isCheckingOut}
                      >
                        {isCheckingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Exam Season Pass – £24.99'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setShowUpgradePrompt(false); handleUpgradeCheckout('monthly'); }}
                        disabled={isCheckingOut}
                      >
                        Monthly – £6.99/mo
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">Secure checkout via Stripe</p>
                  </div>
                </div>
              )}

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage) || isLoading || limitReached}
                size="icon"
                className="h-9 w-9 rounded-full bg-gradient-brand hover:opacity-90 glow-brand"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-2">{footerText}</p>
        </div>
      </div>
    </div>;
};