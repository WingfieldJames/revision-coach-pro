import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string; // For smooth animation
}

interface RAGChatProps {
  productId: string;
  subjectName: string;
  subjectDescription?: string;
  footerText?: string;
  placeholder?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`;

// Word-by-word animation delay in ms (lower = faster typing)
const WORD_DELAY_MS = 30;

export const RAGChat: React.FC<RAGChatProps> = ({ 
  productId,
  subjectName,
  subjectDescription = "Your personal A* tutor. Ask me anything!",
  footerText = "Powered by A* AI",
  placeholder = "Ask me anything..." 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Animation refs
  const bufferRef = useRef('');
  const animationRef = useRef<number | null>(null);
  const fullContentRef = useRef('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          return prev.map((m, i) => 
            i === lastIndex 
              ? { ...m, displayedContent: (m.displayedContent || '') + word }
              : m
          );
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Reset animation state
    bufferRef.current = '';
    fullContentRef.current = '';
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          product_id: productId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message to start
      setMessages(prev => [...prev, { role: 'assistant', content: '', displayedContent: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

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
              // Store full content
              fullContentRef.current += content;
              
              // Update the full content in message (for final state)
              setMessages(prev => {
                const lastIndex = prev.length - 1;
                if (lastIndex >= 0 && prev[lastIndex]?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === lastIndex ? { ...m, content: fullContentRef.current } : m
                  );
                }
                return prev;
              });

              // Add to animation buffer
              bufferRef.current += content;
              
              // Start animation if not already running
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

      // Ensure any remaining buffer is animated
      if (bufferRef.current.length > 0 && !animationRef.current) {
        setIsAnimating(true);
        animateNextWord();
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          displayedContent: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages area - scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-[140px]"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              {/* A* AI Logo */}
              <img 
                src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" 
                alt="A* AI" 
                className="h-16 mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] bg-clip-text text-transparent mb-2">
                {subjectName}
              </h2>
              <p className="text-muted-foreground">
                {subjectDescription}
              </p>
            </div>
          )}
          
          {messages.map((message, index) => {
            const displayContent = getDisplayContent(message, index);
            const isLastAssistant = index === messages.length - 1 && message.role === 'assistant';
            const showCursor = isLastAssistant && (isLoading || isAnimating) && displayContent.length > 0;
            
            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3 p-4 rounded-xl",
                  message.role === 'user' 
                    ? "bg-gradient-to-r from-primary/10 to-[hsl(270,67%,60%)]/10 ml-8" 
                    : "bg-muted mr-8"
                )}
              >
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">You</span>
                    </div>
                  ) : (
                    <img 
                      src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" 
                      alt="A* AI" 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                          return (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2">
                            <code className={cn("text-sm font-mono", className)} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {displayContent}
                  </ReactMarkdown>
                  {/* Blinking cursor while typing */}
                  {showCursor && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 p-4 rounded-xl bg-muted mr-8">
              <img 
                src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" 
                alt="A* AI" 
                className="w-8 h-8 object-contain"
              />
              <div className="flex-1 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 z-50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[60px] max-h-[200px] resize-none rounded-xl border-2 focus:border-primary"
            rows={2}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px] rounded-xl bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {footerText}
        </p>
      </div>
    </div>
  );
};
