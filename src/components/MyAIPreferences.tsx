import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const GRADES = ['D', 'C', 'B', 'A', 'A*'];

interface UserPreferences {
  year: string;
  predicted_grade: string;
  target_grade: string;
  additional_info: string | null;
}

interface MyAIPreferencesProps {
  productId?: string; // Optional - if provided, saves product-specific prefs
}

export const MyAIPreferences: React.FC<MyAIPreferencesProps> = ({ productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    year: 'Year 13',
    predicted_grade: 'C',
    target_grade: 'A',
    additional_info: null,
  });

  // Fetch existing preferences (product-specific or global)
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Build query based on whether we're fetching product-specific or global prefs
        let query = supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id);

        if (productId) {
          query = query.eq('product_id', productId);
        } else {
          query = query.is('product_id', null);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            year: data.year,
            predicted_grade: data.predicted_grade,
            target_grade: data.target_grade,
            additional_info: data.additional_info,
          });
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user, productId]);

  // Auto-save function with debounce
  const savePreferences = useCallback(async (newPreferences: UserPreferences) => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          product_id: productId || null,
          ...newPreferences,
        }, {
          onConflict: 'user_id,product_id',
        });

      if (error) throw error;
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  }, [user, productId]);

  // Debounced save for text input
  useEffect(() => {
    if (!user || loading) return;

    const timeoutId = setTimeout(() => {
      savePreferences(preferences);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [preferences, user, loading, savePreferences]);

  const handleYearChange = (value: string) => {
    setPreferences(prev => ({ ...prev, year: value }));
  };

  const handlePredictedGradeChange = (value: number[]) => {
    const grade = GRADES[value[0]];
    setPreferences(prev => ({ ...prev, predicted_grade: grade }));
  };

  const handleTargetGradeChange = (value: number[]) => {
    const grade = GRADES[value[0]];
    setPreferences(prev => ({ ...prev, target_grade: grade }));
  };

  const handleAdditionalInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreferences(prev => ({ ...prev, additional_info: e.target.value || null }));
  };

  const getGradeIndex = (grade: string) => {
    const index = GRADES.indexOf(grade);
    return index >= 0 ? index : 2; // Default to 'B' if not found
  };

  if (!user) {
    return (
      <div className="text-center py-6 px-4">
        <LogIn className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-2">Sign in required</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Please sign in to personalize your AI experience.
        </p>
        <Button 
          variant="brand" 
          size="sm"
          onClick={() => navigate('/login')}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 my-ai-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Personalize Your AI</h3>
        {saving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* Year Selection */}
      <div className="space-y-2">
        <Label>What year are you in?</Label>
        <Select value={preferences.year} onValueChange={handleYearChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Year 13">Year 13</SelectItem>
            <SelectItem value="Year 12">Year 12</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Predicted Grade Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Predicted Grade</Label>
          <span className="text-sm font-medium panel-badge px-2 py-0.5 rounded">
            {preferences.predicted_grade}
          </span>
        </div>
        <div className="px-1">
          <Slider
            value={[getGradeIndex(preferences.predicted_grade)]}
            onValueChange={handlePredictedGradeChange}
            min={0}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            {GRADES.map((grade) => (
              <span key={grade} className="text-xs text-muted-foreground">{grade}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Target Grade Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Target Grade</Label>
          <span className="text-sm font-medium panel-badge px-2 py-0.5 rounded">
            {preferences.target_grade}
          </span>
        </div>
        <div className="px-1">
          <Slider
            value={[getGradeIndex(preferences.target_grade)]}
            onValueChange={handleTargetGradeChange}
            min={0}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            {GRADES.map((grade) => (
              <span key={grade} className="text-xs text-muted-foreground">{grade}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <Label>Anything else?</Label>
        <Textarea
          value={preferences.additional_info || ''}
          onChange={handleAdditionalInfoChange}
          placeholder="Tell us more about your learning goals, topics you struggle with, etc."
          className="resize-none h-20"
        />
      </div>
    </div>
  );
};
