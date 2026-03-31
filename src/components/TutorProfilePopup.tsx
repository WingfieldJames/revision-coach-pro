import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const GRADES = ['D', 'C', 'B', 'A', 'A*'];

interface TutorProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  trainerAvatarUrl?: string;
  trainerName?: string;
}

export const TutorProfilePopup: React.FC<TutorProfilePopupProps> = ({
  isOpen,
  onClose,
  productId,
  trainerAvatarUrl,
  trainerName,
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [year, setYear] = useState('Year 13');
  const [predictedGrade, setPredictedGrade] = useState('C');
  const [targetGrade, setTargetGrade] = useState('A');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const getGradeIndex = (grade: string) => {
    const idx = GRADES.indexOf(grade);
    return idx >= 0 ? idx : 2;
  };

  // Load existing preferences
  useEffect(() => {
    if (!user || !isOpen) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (data) {
        setYear(data.year);
        setPredictedGrade(data.predicted_grade);
        setTargetGrade(data.target_grade);
        // Parse name from additional_info if stored
        const info = data.additional_info || '';
        const nameMatch = info.match(/^Name:\s*(.+?)(?:\s*\|\s*|$)/);
        if (nameMatch) {
          setStudentName(nameMatch[1]);
          setAdditionalInfo(info.replace(/^Name:\s*.+?(?:\s*\|\s*|$)/, '').trim());
        } else {
          setAdditionalInfo(info);
        }
      }
    };
    load();
  }, [user, isOpen, productId]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    const combinedInfo = studentName.trim()
      ? `Name: ${studentName.trim()}${additionalInfo.trim() ? ` | ${additionalInfo.trim()}` : ''}`
      : additionalInfo.trim() || null;

    try {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        product_id: productId,
        year,
        predicted_grade: predictedGrade,
        target_grade: targetGrade,
        additional_info: combinedInfo,
      }, { onConflict: 'user_id,product_id' });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch (e) {
      console.error('Error saving preferences:', e);
    } finally {
      setSaving(false);
    }
  }, [user, productId, studentName, year, predictedGrade, targetGrade, additionalInfo, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Popup card */}
      <div className="fixed bottom-20 right-4 z-[301] w-[340px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 edexcel-econ-panel">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-5 space-y-5">
          {/* Trainer header */}
          <div className="flex flex-col items-center text-center">
            {trainerAvatarUrl && (
              <div className="relative mb-2">
                <img
                  src={trainerAvatarUrl}
                  alt={trainerName || 'Tutor'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-lg"
                />
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
              </div>
            )}
            <h3 className="text-lg font-bold text-foreground">Fill me in 📝</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {trainerName ? `Hey! I'm ${trainerName}. Let me get to know you a bit so I can help you better...` : 'Tell me about yourself so I can personalise your experience...'}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">What's your name?</Label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex"
              className="h-9 text-sm"
            />
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">What year are you in?</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Year 13">Year 13</SelectItem>
                <SelectItem value="Year 12">Year 12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predicted Grade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Predicted Grade</Label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded panel-badge">{predictedGrade}</span>
            </div>
            <Slider
              value={[getGradeIndex(predictedGrade)]}
              onValueChange={(v) => setPredictedGrade(GRADES[v[0]])}
              min={0} max={4} step={1}
              className="w-full"
            />
            <div className="flex justify-between">
              {GRADES.map(g => <span key={g} className="text-[10px] text-muted-foreground">{g}</span>)}
            </div>
          </div>

          {/* Target Grade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Target Grade</Label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded panel-badge">{targetGrade}</span>
            </div>
            <Slider
              value={[getGradeIndex(targetGrade)]}
              onValueChange={(v) => setTargetGrade(GRADES[v[0]])}
              min={0} max={4} step={1}
              className="w-full"
            />
            <div className="flex justify-between">
              {GRADES.map(g => <span key={g} className="text-[10px] text-muted-foreground">{g}</span>)}
            </div>
          </div>

          {/* Anything else */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Anything else you want me to know?</Label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Topics you struggle with, learning style, etc."
              className="resize-none h-16 text-sm"
            />
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[hsl(222,75%,31%)] hover:bg-[hsl(222,75%,25%)] text-white font-semibold"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4 mr-2" />Saved!</>
            ) : (
              "Let's go 🚀"
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
