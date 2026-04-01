import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'];

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
  const [studentName, setStudentName] = useState('');
  const [year, setYear] = useState('Year 13');
  const [predictedGrade, setPredictedGrade] = useState('C');
  const [targetGrade, setTargetGrade] = useState('A');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Auto-save with debounce
  const autoSave = useCallback(() => {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
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
      } catch (e) {
        console.error('Error saving preferences:', e);
      }
    }, 600);
  }, [user, productId, studentName, year, predictedGrade, targetGrade, additionalInfo]);

  // Trigger auto-save on any field change
  useEffect(() => {
    if (isOpen && user) autoSave();
  }, [studentName, year, predictedGrade, targetGrade, additionalInfo, isOpen, user, autoSave]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Popup card - compact floating */}
      <div className="fixed bottom-20 right-4 z-[301] w-[320px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)] animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="p-4 space-y-3">
          {/* Trainer header - inline */}
          <div className="flex items-center gap-3 pr-6">
            {trainerAvatarUrl && (
              <div className="relative flex-shrink-0">
                <img
                  src={trainerAvatarUrl}
                  alt={trainerName || 'Tutor'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-tight">Fill me in</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {trainerName ? `I'm ${trainerName}. Tell me about yourself!` : 'Tell me about yourself so I can help!'}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Your name</Label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex"
              className="h-8 text-sm"
            />
          </div>

          {/* Year */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Year 13">Year 13</SelectItem>
                <SelectItem value="Year 12">Year 12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grades row - side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Predicted</Label>
              <Select value={predictedGrade} onValueChange={setPredictedGrade}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Target</Label>
              <Select value={targetGrade} onValueChange={setTargetGrade}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anything else */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Anything else?</Label>
            <Input
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Topics you struggle with, etc."
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
};
