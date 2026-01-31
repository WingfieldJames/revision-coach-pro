import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart2, Search, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { diagrams, Diagram } from '@/data/diagrams';
import { csDiagrams, CSDiagram } from '@/data/csDiagrams';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ToolUsageResponse {
  count: number;
}

interface IncrementToolUsageResponse {
  count: number;
  limit: number;
  exceeded: boolean;
}

const FREE_MONTHLY_DIAGRAM_LIMIT = 3;

interface DiagramFinderToolProps {
  subject?: 'economics' | 'cs';
  tier?: 'free' | 'deluxe';
  productId?: string;
}

export const DiagramFinderTool: React.FC<DiagramFinderToolProps> = ({ 
  subject = 'economics',
  tier = 'deluxe',
  productId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedDiagram, setMatchedDiagram] = useState<Diagram | CSDiagram | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Load current month's usage for free tier
  useEffect(() => {
    const loadUsage = async () => {
      if (tier !== 'free' || !user) {
        setIsLoadingUsage(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_tool_usage', {
          p_user_id: user.id,
          p_product_id: productId || null,
          p_tool_type: 'diagram_generator'
        });

        if (!error && data) {
          const typedData = data as unknown as ToolUsageResponse;
          setMonthlyUsage(typedData.count || 0);
        }
      } catch (err) {
        console.error('Error loading tool usage:', err);
      } finally {
        setIsLoadingUsage(false);
      }
    };

    loadUsage();
  }, [tier, user, productId]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate('/login');
        return;
      }

      const affiliateCode = localStorage.getItem('affiliate_code') || undefined;

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: {
          paymentType: 'lifetime',
          productId: productId,
          affiliateCode
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Check if user has exceeded monthly limit (free tier only)
  const hasExceededLimit = tier === 'free' && monthlyUsage >= FREE_MONTHLY_DIAGRAM_LIMIT;
  const remainingUses = FREE_MONTHLY_DIAGRAM_LIMIT - monthlyUsage;

  // Show upgrade prompt when limit exceeded for free tier
  if (tier === 'free' && hasExceededLimit && !isLoadingUsage) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] flex items-center justify-center mx-auto mb-3">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Monthly Limit Reached</h3>
          <p className="text-muted-foreground text-sm">
            You've used all {FREE_MONTHLY_DIAGRAM_LIMIT} free diagram searches this month. Upgrade to Deluxe for unlimited access.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="font-semibold text-sm mb-3">Deluxe Features:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Unlimited diagram searches</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Unlimited essay marking</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Full 2017-2025 past paper training</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Unlimited daily prompts</span>
            </li>
          </ul>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)]"
          onClick={handleUpgrade}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            'Upgrade to Deluxe'
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Your free uses reset at the start of each month
        </p>
      </div>
    );
  }

  const findDiagram = async () => {
    if (!inputText.trim()) {
      return;
    }

    // For free tier, check and increment usage
    if (tier === 'free' && user) {
      try {
        const { data, error } = await supabase.rpc('increment_tool_usage', {
          p_user_id: user.id,
          p_product_id: productId || null,
          p_tool_type: 'diagram_generator',
          p_limit: FREE_MONTHLY_DIAGRAM_LIMIT
        });

        if (error) {
          console.error('Error incrementing usage:', error);
        } else if (data) {
          const typedData = data as unknown as IncrementToolUsageResponse;
          setMonthlyUsage(typedData.count);
          if (typedData.exceeded) {
            toast.error('Monthly limit reached. Upgrade to Deluxe for unlimited access.');
            return;
          }
        }
      } catch (err) {
        console.error('Usage tracking error:', err);
      }
    }

    setIsSearching(true);
    setMatchedDiagram(null);
    setNoMatch(false);

    try {
      const { data, error } = await supabase.functions.invoke('find-diagram', {
        body: { text: inputText, subject }
      });

      if (error) {
        console.error('Find diagram error:', error);
        return;
      }

      if (data?.diagramId) {
        // Search in the appropriate diagram set
        const diagramSet = subject === 'cs' ? csDiagrams : diagrams;
        const found = diagramSet.find(d => d.id === data.diagramId);
        if (found) {
          setMatchedDiagram(found);
        } else {
          setNoMatch(true);
        }
      } else {
        setNoMatch(true);
      }
    } catch (error) {
      console.error('Error finding diagram:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const reset = () => {
    setInputText('');
    setMatchedDiagram(null);
    setNoMatch(false);
  };

  const subjectLabel = subject === 'cs' ? 'Computer Science' : 'Economics';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <BarChart2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Diagram Generator</h3>
          <p className="text-xs text-muted-foreground">
            Paste question text to find the right {subjectLabel} diagram
          </p>
        </div>
      </div>

      {/* Free tier usage indicator */}
      {tier === 'free' && !isLoadingUsage && (
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{remainingUses}</span> free {remainingUses === 1 ? 'use' : 'uses'} remaining this month
          </p>
        </div>
      )}

      {/* Input Area */}
      {!matchedDiagram && (
        <div className="space-y-3">
          <Textarea
            placeholder={subject === 'cs' 
              ? "Paste your question or topic here... e.g. 'Explain how a stack data structure works'"
              : "Paste your question or topic here... e.g. 'Explain using a diagram what happens when aggregate demand increases'"
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px] resize-none text-sm"
          />
          
          <Button
            onClick={findDiagram}
            disabled={isSearching || !inputText.trim() || isLoadingUsage}
            className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
            size="sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Diagram
              </>
            )}
          </Button>
        </div>
      )}

      {/* No Match Result */}
      {noMatch && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No matching diagram found for your text.
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Matched Diagram */}
      {matchedDiagram && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{matchedDiagram.title}</h4>
            <button
              onClick={reset}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            <img
              src={matchedDiagram.imagePath}
              alt={matchedDiagram.title}
              className="w-full h-auto object-contain"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={reset} className="w-full">
            Search for Another Diagram
          </Button>
        </div>
      )}
    </div>
  );
};
