import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PenLine, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MARK_OPTIONS = [5, 8, 10, 12, 15, 25] as const;

// Custom prompts for each mark type - easily customizable later
const markPrompts: Record<number, string> = {
  5: "Mark my 5 marker. Use exact marking criteria.",
  8: "Mark my 8 marker. Use exact marking criteria.",
  10: "Mark my 10 marker. Use exact marking criteria.",
  12: "Mark my 12 marker. Use exact marking criteria.",
  15: "Mark my 15 marker. Use exact marking criteria.",
  25: "Mark my 25 marker. Use exact marking criteria.",
};

interface EssayMarkerToolProps {
  tier?: 'free' | 'deluxe';
  productId?: string;
}

export const EssayMarkerTool: React.FC<EssayMarkerToolProps> = ({
  tier = 'deluxe',
  productId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMark, setSelectedMark] = useState<number>(15);
  const [essayText, setEssayText] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

  // Show upgrade prompt for free tier
  if (tier === 'free') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-[hsl(270,67%,60%)] flex items-center justify-center mx-auto mb-3">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Unlock Essay Marker</h3>
          <p className="text-muted-foreground text-sm">
            Upgrade to Deluxe to get AI-powered essay marking with detailed feedback.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="font-semibold text-sm mb-3">Deluxe Features:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Mark scheme feedback on answers</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>A* essay structures & technique</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Image-to-text OCR for exam questions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Full 2017-2025 past paper training</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Unlimited daily prompts</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>AI-powered diagram generator</span>
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
      </div>
    );
  }

  const generatePrompt = () => {
    if (!essayText.trim()) {
      toast.error('Please paste your essay first');
      return;
    }

    const prompt = `${markPrompts[selectedMark]}\n\n${essayText}`;
    setGeneratedPrompt(prompt);
    toast.success('Prompt generated! Copy and paste into the chatbot.');
  };

  const copyToClipboard = async () => {
    if (!generatedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const reset = () => {
    setEssayText('');
    setGeneratedPrompt(null);
    setCopied(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <PenLine className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Essay Marker</h3>
          <p className="text-xs text-muted-foreground">
            Generate a marking prompt for your essay
          </p>
        </div>
      </div>

      {!generatedPrompt ? (
        <div className="space-y-4">
          {/* Mark Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Number of Marks</label>
            <div className="flex flex-wrap gap-2">
              {MARK_OPTIONS.map((mark) => (
                <button
                  key={mark}
                  onClick={() => setSelectedMark(mark)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedMark === mark
                      ? 'bg-gradient-brand text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>

          {/* Essay Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Essay</label>
            <Textarea
              placeholder="Paste your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="min-h-[150px] resize-none text-sm"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePrompt}
            disabled={!essayText.trim()}
            className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
            size="sm"
          >
            <PenLine className="w-4 h-4 mr-2" />
            Generate Marking Prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Generated Prompt Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Generated Prompt</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                {generatedPrompt}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="flex-1"
            >
              New Essay
            </Button>
            <Button
              onClick={copyToClipboard}
              size="sm"
              className="flex-1 bg-gradient-brand hover:opacity-90 text-primary-foreground"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
