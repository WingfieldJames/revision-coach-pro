import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Plus, Trash2, Check, ImagePlus, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Mistake {
  id: string;
  question_text: string | null;
  question_image_url: string | null;
  note: string | null;
  created_at: string;
  next_review_at: string;
  review_count: number;
  completed: boolean;
}

const INTERVALS = [4, 16, 35, 70]; // days

interface MyMistakesToolProps {
  productId?: string;
  onDueCountChange?: (count: number) => void;
}

export const MyMistakesTool: React.FC<MyMistakesToolProps> = ({ productId, onDueCountChange }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'add' | 'view'>('add');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMistakes = useCallback(async () => {
    if (!user || !productId) return;
    const { data } = await supabase
      .from('user_mistakes' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (data) {
      setMistakes(data as unknown as Mistake[]);
      const dueCount = (data as unknown as Mistake[]).filter(
        m => !m.completed && new Date(m.next_review_at) <= new Date()
      ).length;
      onDueCountChange?.(dueCount);
    }
  }, [user, productId, onDueCountChange]);

  useEffect(() => { loadMistakes(); }, [loadMistakes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setQuestionImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user || !productId) {
      toast.error('Please sign in to save mistakes');
      return;
    }
    if (!questionText.trim() && !questionImage) {
      toast.error('Add a question (text or image)');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('user_mistakes' as any).insert({
      user_id: user.id,
      product_id: productId,
      question_text: questionText.trim() || null,
      question_image_url: questionImage || null,
      note: note.trim() || null,
    } as any);
    setSaving(false);
    if (error) {
      toast.error('Failed to save mistake');
      return;
    }
    toast.success('Mistake saved!');
    setQuestionText('');
    setQuestionImage(null);
    setNote('');
    loadMistakes();
  };

  const handleReview = async (mistake: Mistake) => {
    const nextCount = mistake.review_count + 1;
    const isCompleted = nextCount >= INTERVALS.length;
    const nextInterval = isCompleted ? 0 : INTERVALS[nextCount];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + nextInterval);

    await supabase
      .from('user_mistakes' as any)
      .update({
        review_count: nextCount,
        completed: isCompleted,
        next_review_at: nextReview.toISOString(),
      } as any)
      .eq('id', mistake.id);
    loadMistakes();
    toast.success(isCompleted ? 'Completed! Well done 🎉' : `Next review in ${nextInterval} days`);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('user_mistakes' as any).delete().eq('id', id);
    loadMistakes();
  };

  const isDue = (m: Mistake) => !m.completed && new Date(m.next_review_at) <= new Date();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Due now';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <RotateCcw className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">My Mistakes</h3>
          <p className="text-xs text-muted-foreground">Track & review questions you got wrong</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setTab('add')}
          className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${tab === 'add' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Plus className="inline h-3.5 w-3.5 mr-1" />Add
        </button>
        <button
          onClick={() => setTab('view')}
          className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${tab === 'view' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          View All ({mistakes.length})
        </button>
      </div>

      {tab === 'add' ? (
        <div className="space-y-3">
          {/* Image upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Question (image)</label>
            {questionImage ? (
              <div className="relative inline-block">
                <img src={questionImage} alt="Question" className="max-h-32 rounded-lg border border-border" />
                <button onClick={() => setQuestionImage(null)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ImagePlus className="h-4 w-4" />
                Upload question image
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Text input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Question (text)</label>
            <Textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Type the question here..."
              className="min-h-[60px] text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note – what did you get wrong?</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Forgot to use the chain rule..."
              className="min-h-[50px] text-sm"
            />
          </div>

          <Button onClick={handleSave} disabled={saving || (!questionText.trim() && !questionImage)} className="w-full" variant="brand">
            {saving ? 'Saving...' : 'Save Mistake'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {mistakes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No mistakes logged yet. Start by adding one!</p>
          ) : (
            mistakes.map(m => (
              <div key={m.id} className={`p-3 rounded-lg border ${isDue(m) ? 'border-destructive/50 bg-destructive/5' : m.completed ? 'border-border bg-muted/50 opacity-60' : 'border-border bg-background'}`}>
                {m.question_image_url && (
                  <img src={m.question_image_url} alt="Question" className="max-h-20 rounded mb-2 border border-border" />
                )}
                {m.question_text && (
                  <p className="text-sm text-foreground line-clamp-2 mb-1">{m.question_text}</p>
                )}
                {m.note && (
                  <p className="text-xs text-muted-foreground italic mb-2">📝 {m.note}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDue(m) ? 'text-destructive' : m.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {m.completed ? '✅ Completed' : (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(m.next_review_at)}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    {!m.completed && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReview(m)}>
                        <Check className="h-3 w-3 mr-1" />Reviewed
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
