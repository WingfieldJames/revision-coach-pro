import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PenLine, Loader2, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MARK_OPTIONS = [5, 8, 10, 12, 15, 25] as const;
const FREE_MONTHLY_ESSAY_LIMIT = 1;

interface ToolUsageResponse {
  count: number;
}

interface IncrementToolUsageResponse {
  count: number;
  limit: number;
  exceeded: boolean;
}

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
  onSubmitToChat?: (message: string) => void;
  onClose?: () => void;
  fixedMark?: number;
  toolLabel?: string;
}

export const EssayMarkerTool: React.FC<EssayMarkerToolProps> = ({
  tier = 'deluxe',
  productId,
  onSubmitToChat,
  onClose,
  fixedMark,
  toolLabel = "Essay Marker"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMark, setSelectedMark] = useState<number>(fixedMark ?? 15);
  const [essayText, setEssayText] = useState('');
  // Default to image upload on touch devices (mobile/iPad), text on desktop
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const [inputMode, setInputMode] = useState<'text' | 'image'>(isTouchDevice ? 'image' : 'text');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          p_tool_type: 'essay_marker'
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
          paymentType,
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
  const hasExceededLimit = tier === 'free' && monthlyUsage >= FREE_MONTHLY_ESSAY_LIMIT;
  const remainingUses = FREE_MONTHLY_ESSAY_LIMIT - monthlyUsage;

  // Show upgrade prompt when limit exceeded for free tier
  if (tier === 'free' && hasExceededLimit && !isLoadingUsage) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-3">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Monthly Limit Reached</h3>
          <p className="text-muted-foreground text-sm">
            You've used your {FREE_MONTHLY_ESSAY_LIMIT} free essay marking this month. Upgrade for unlimited access!
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="font-semibold text-sm mb-3">Upgrade to unlock:</p>
          <ul className="space-y-2 text-sm">
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
              <span>Unlimited daily prompts</span>
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
            onClick={() => handleUpgrade('lifetime')}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Exam Season Pass – £24.99'}
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => handleUpgrade('monthly')}
            disabled={isCheckingOut}
          >
            Monthly – £6.99/mo
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Your free uses reset at the start of each month
        </p>
      </div>
    );
  }

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
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: {
            image: base64,
            imageType: 'exam_question'
          }
        });
        
        if (error) throw error;
        if (data?.extractedText) {
          setEssayText(prev => prev ? `${prev}\n\n${data.extractedText}` : data.extractedText);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMarkEssay = async () => {
    if (!essayText.trim()) {
      toast.error('Please enter your essay first');
      return;
    }

    // For free tier, check usage limit before proceeding
    if (tier === 'free' && user) {
      if (monthlyUsage >= FREE_MONTHLY_ESSAY_LIMIT) {
        setMonthlyUsage(monthlyUsage);
        toast.error('Monthly limit reached. Upgrade to Deluxe for unlimited access.');
        return;
      }
    }

    // Use fixedMark if provided, otherwise use selectedMark
    const markToUse = fixedMark ?? selectedMark;
    const prompt = `Mark my ${markToUse} marker. Use exact marking criteria.\n\n${essayText}`;
    
    if (onSubmitToChat) {
      setIsSubmitting(true);
      onSubmitToChat(prompt);

      // Increment usage AFTER successful submission
      if (tier === 'free' && user) {
        try {
          const { data, error } = await supabase.rpc('increment_tool_usage', {
            p_user_id: user.id,
            p_product_id: productId || null,
            p_tool_type: 'essay_marker',
            p_limit: FREE_MONTHLY_ESSAY_LIMIT
          });
          if (!error && data) {
            const typedData = data as unknown as IncrementToolUsageResponse;
            setMonthlyUsage(typedData.count);
          }
        } catch (err) {
          console.error('Usage tracking error:', err);
        }
      }

      // Close the popover after submitting
      if (onClose) {
        onClose();
      }
      // Reset state
      setEssayText('');
      setIsSubmitting(false);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied! Paste into the chatbot.');
    }
  };

  const reset = () => {
    setEssayText('');
    setInputMode('text');
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <PenLine className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{toolLabel}</h3>
          <p className="text-xs text-muted-foreground">
            Upload a photo or paste your {fixedMark ? `${fixedMark}-marker` : 'essay'}
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

      <div className="space-y-4">
        {/* Mark Selector - only show if no fixedMark */}
        {!fixedMark && (
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
        )}

        {/* Input Mode Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Input Method</label>
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-gradient-brand text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              Type/Paste
            </button>
            <button
              onClick={() => setInputMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'image'
                  ? 'bg-gradient-brand text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Image className="w-4 h-4" />
              Upload Photo
            </button>
          </div>
        </div>

        {/* Input Area */}
        {inputMode === 'text' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Essay</label>
            <Textarea
              placeholder="Paste your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="min-h-[150px] resize-none text-sm"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Upload Photo</label>
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isAnalyzingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extracting text...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a photo of your essay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
            {essayText && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-foreground mb-1">Extracted Text:</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{essayText}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {essayText && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="flex-1"
            >
              Clear
            </Button>
          )}
          <Button
            onClick={handleMarkEssay}
            disabled={!essayText.trim() || isSubmitting || isLoadingUsage}
            className={`${essayText ? 'flex-1' : 'w-full'} bg-gradient-brand hover:opacity-90 text-primary-foreground`}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PenLine className="w-4 h-4 mr-2" />
                Mark Essay
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
