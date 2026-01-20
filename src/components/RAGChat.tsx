import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Plus, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
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
interface RAGChatProps {
  productId: string;
  subjectName: string;
  subjectDescription?: string;
  footerText?: string;
  placeholder?: string;
  tier?: 'free' | 'deluxe';
  suggestedPrompts?: SuggestedPrompt[];
}
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`;
const WORD_DELAY_MS = 30;
export const RAGChat: React.FC<RAGChatProps> = ({
  productId,
  subjectName,
  subjectDescription = "Your personal A* tutor. Ask me anything!",
  footerText = "Powered by A* AI",
  placeholder = "Ask me anything...",
  tier = 'deluxe',
  suggestedPrompts = []
}) => {
  const {
    user
  } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

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
          tier: tier,
          user_id: user?.id
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'limit_exceeded' && errorData.message) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: errorData.message,
            displayedContent: errorData.message
          }]);
          setIsLoading(false);
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
    }
  };
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageText = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: messageText
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Use the shared send logic
    handleSendWithMessage(messageText);
  };

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

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    setIsAnalyzingImage(true);
    setImageUploadOpen(false);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const {
          data,
          error
        } = await supabase.functions.invoke('analyze-image', {
          body: {
            image: base64,
            imageType: 'exam_question'
          }
        });
        if (error) throw error;
        if (data?.text) {
          setInput(prev => prev ? `${prev}\n\n${data.text}` : data.text);
          toast.success('Text extracted from image');
        } else {
          toast.error('Could not extract text from image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzingImage(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-16 mx-auto mb-6" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] bg-clip-text text-transparent mb-2">
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
          return <div key={index} className={cn("flex gap-3 p-4 rounded-xl", message.role === 'user' ? "bg-gradient-to-r from-primary/10 to-[hsl(270,67%,60%)]/10 ml-8" : "bg-muted mr-8")}>
                <div className="flex-shrink-0">
                  {message.role === 'user' ? <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">You</span>
                    </div> : <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="w-8 h-8 object-contain" />}
                </div>
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{
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
                        </blockquote>
              }}>
                    {displayContent}
                  </ReactMarkdown>
                  {showCursor && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                </div>
              </div>;
        })}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && <div className="flex gap-3 p-4 rounded-xl bg-muted mr-8">
              <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="w-8 h-8 object-contain" />
              <div className="flex-1 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed bottom composer - two line layout */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 z-50">
        <div className="max-w-5xl mx-auto">
          {/* Suggested prompts - only show when no messages */}
          {messages.length === 0 && suggestedPrompts.length > 0 && <div className="flex gap-2 mb-3 justify-center">
              {suggestedPrompts.map((prompt, idx) => <button key={idx} onClick={() => handleSuggestedPrompt(prompt)} disabled={isLoading} className="px-4 py-2 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0 disabled:opacity-50 bg-violet">
                  {prompt.text}
                </button>)}
            </div>}
          
          {/* Two-line pill container */}
          <div className="border-2 border-border rounded-2xl overflow-hidden bg-background">
            {/* Line 1: Text input */}
            <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={isLoading} className="w-full min-h-[48px] max-h-[200px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-base" rows={1} />
            
            {/* Line 2: Buttons row */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
              {/* Plus button on left */}
              <Popover open={imageUploadOpen} onOpenChange={setImageUploadOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" disabled={isLoading || isAnalyzingImage}>
                    {isAnalyzingImage ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-background border border-border shadow-xl" align="start" side="top" sideOffset={8}>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Image className="w-4 h-4" />
                    Upload Image
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Send button on right */}
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-9 w-9 rounded-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] hover:opacity-90">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-2">
            {footerText}
          </p>
        </div>
      </div>
    </div>;
};