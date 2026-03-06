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

export interface CustomDiagram {
  id: string;
  title: string;
  imagePath: string; // signed URL or storage path
}

interface DiagramFinderToolProps {
  subject?: 'economics' | 'cs';
  tier?: 'free' | 'deluxe';
  productId?: string;
  customDiagrams?: CustomDiagram[];
}

export const DiagramFinderTool: React.FC<DiagramFinderToolProps> = ({ 
  subject = 'economics',
  tier = 'deluxe',
  productId,
  customDiagrams,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedDiagram, setMatchedDiagram] = useState<Diagram | CSDiagram | CustomDiagram | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const hasCustomDiagrams = customDiagrams && customDiagrams.length > 0;

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

  const handleUpgrade = async (paymentType: 'monthly' | 'lifetime' = 'lifetime') => {
    if (!user) { navigate('/login'); return; }
    setIsCheckingOut(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { navigate('/login'); return; }
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

  const hasExceededLimit = tier === 'free' && monthlyUsage >= FREE_MONTHLY_DIAGRAM_LIMIT;
  const remainingUses = FREE_MONTHLY_DIAGRAM_LIMIT - monthlyUsage;

  if (tier === 'free' && hasExceededLimit && !isLoadingUsage) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Monthly Limit Reached</h3>
          <p className="text-muted-foreground text-sm">
            You've used all {FREE_MONTHLY_DIAGRAM_LIMIT} free diagram searches this month. Upgrade for unlimited access!
          </p>
        </div>
        <div className="space-y-2">
          <Button className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold" onClick={() => handleUpgrade('lifetime')} disabled={isCheckingOut}>
            {isCheckingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Exam Season Pass – £39.99'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleUpgrade('monthly')} disabled={isCheckingOut}>
            Monthly – £8.99/mo
          </Button>
        </div>
      </div>
    );
  }

  const findDiagram = async () => {
    if (!inputText.trim()) return;

    if (tier === 'free' && user && monthlyUsage >= FREE_MONTHLY_DIAGRAM_LIMIT) {
      toast.error('Monthly limit reached. Upgrade to Deluxe for unlimited access.');
      return;
    }

    setIsSearching(true);
    setMatchedDiagram(null);
    setNoMatch(false);

    try {
      const body: any = { text: inputText, subject };
      
      // If custom diagrams, send their IDs and titles to the edge function
      if (hasCustomDiagrams) {
        body.custom_diagrams = customDiagrams!.map(d => ({ id: d.id, title: d.title }));
      }

      const { data, error } = await supabase.functions.invoke('find-diagram', { body });

      if (error) {
        console.error('Find diagram error:', error);
        return;
      }

      let actionSucceeded = false;

      if (data?.diagramId) {
        if (hasCustomDiagrams) {
          // Look up in custom diagrams
          const found = customDiagrams!.find(d => d.id === data.diagramId);
          if (found) {
            setMatchedDiagram(found);
            actionSucceeded = true;
          } else {
            setNoMatch(true);
          }
        } else {
          // Look up in built-in diagram sets
          const diagramSet = subject === 'cs' ? csDiagrams : diagrams;
          const found = diagramSet.find(d => d.id === data.diagramId);
          if (found) {
            setMatchedDiagram(found);
            actionSucceeded = true;
          } else {
            setNoMatch(true);
          }
        }
      } else {
        setNoMatch(true);
      }

      if (actionSucceeded && tier === 'free' && user) {
        try {
          const { data: usageData, error: usageError } = await supabase.rpc('increment_tool_usage', {
            p_user_id: user.id,
            p_product_id: productId || null,
            p_tool_type: 'diagram_generator',
            p_limit: FREE_MONTHLY_DIAGRAM_LIMIT
          });
          if (!usageError && usageData) {
            const typedData = usageData as unknown as IncrementToolUsageResponse;
            setMonthlyUsage(typedData.count);
          }
        } catch (err) {
          console.error('Usage tracking error:', err);
        }
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

  const subjectLabel = hasCustomDiagrams ? 'your subject' : subject === 'cs' ? 'Computer Science' : 'Economics';

  // Get the image path based on diagram type
  const getImageSrc = (diagram: Diagram | CSDiagram | CustomDiagram) => {
    if ('imagePath' in diagram) return diagram.imagePath;
    return '';
  };

  return (
    <div className="space-y-4">
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

      {tier === 'free' && !isLoadingUsage && (
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{remainingUses}</span> free {remainingUses === 1 ? 'use' : 'uses'} remaining this month
          </p>
        </div>
      )}

      {!matchedDiagram && (
        <div className="space-y-3">
          <Textarea
            placeholder={`Paste your question or topic here...`}
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
            ) : (
              <><Search className="w-4 h-4 mr-2" />Find Diagram</>
            )}
          </Button>
        </div>
      )}

      {noMatch && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">No matching diagram found for your text.</p>
          <Button variant="outline" size="sm" onClick={reset}>Try Again</Button>
        </div>
      )}

      {matchedDiagram && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{matchedDiagram.title}</h4>
            <button onClick={reset} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            <img
              src={getImageSrc(matchedDiagram)}
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
