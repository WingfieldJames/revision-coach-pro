import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, LockOpen, Sliders, SlidersHorizontal } from 'lucide-react';
import type { School } from '@/hooks/useSchoolMembership';
import type { Tables } from '@/integrations/supabase/types';

interface TunabilityPanelProps {
  school: School;
}

type ClassRow = Pick<
  Tables<'classes'>,
  'id' | 'name' | 'qualification_type' | 'spec_focus' | 'school_id'
>;

type AiSettings = Tables<'class_ai_settings'>;

type ScaffoldingTightness = 'light' | 'standard' | 'strict';

const SCAFFOLDING_OPTIONS: {
  value: ScaffoldingTightness;
  label: string;
  description: string;
}[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'The Coach gives fuller hints and worked steps — good for building confidence early on.',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'A balanced amount of prompting — nudges the student without doing the thinking for them.',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Minimal hints. The Coach pushes students to reason it out themselves before offering support.',
  },
];

/** Defaults used when a class has no class_ai_settings row yet. */
const DEFAULT_SETTINGS = {
  scaffolding_tightness: 'standard' as ScaffoldingTightness,
  writing_aid_unlocked: false,
  blocked_topics: [] as string[],
  daily_cap: null as number | null,
  weekly_cap: null as number | null,
};

interface FormState {
  scaffolding_tightness: ScaffoldingTightness;
  writing_aid_unlocked: boolean;
  blocked_topics: string;
  daily_cap: string;
  weekly_cap: string;
}

const settingsToForm = (s: {
  scaffolding_tightness: ScaffoldingTightness;
  writing_aid_unlocked: boolean;
  blocked_topics: string[];
  daily_cap: number | null;
  weekly_cap: number | null;
}): FormState => ({
  scaffolding_tightness: s.scaffolding_tightness,
  writing_aid_unlocked: s.writing_aid_unlocked,
  blocked_topics: s.blocked_topics.join(', '),
  daily_cap: s.daily_cap == null ? '' : String(s.daily_cap),
  weekly_cap: s.weekly_cap == null ? '' : String(s.weekly_cap),
});

const parseCap = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const parseTopics = (value: string): string[] =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

export const TunabilityPanel = ({ school }: TunabilityPanelProps) => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(() => settingsToForm(DEFAULT_SETTINGS));
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  // Load the school's classes.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingClasses(true);
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, qualification_type, spec_focus, school_id')
        .eq('school_id', school.id)
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        toast.error('Could not load your classes');
        setClasses([]);
      } else {
        const rows = data ?? [];
        setClasses(rows);
        setSelectedClassId((prev) => prev ?? rows[0]?.id ?? null);
      }
      setLoadingClasses(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [school.id]);

  // Load the selected class's AI settings (or fall back to defaults).
  const loadSettings = useCallback(async (classId: string) => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from('class_ai_settings')
      .select('*')
      .eq('class_id', classId)
      .maybeSingle();

    if (error) {
      toast.error('Could not load settings for this class');
      setForm(settingsToForm(DEFAULT_SETTINGS));
    } else if (data) {
      const row = data as AiSettings;
      setForm(
        settingsToForm({
          scaffolding_tightness:
            (row.scaffolding_tightness as ScaffoldingTightness) ??
            DEFAULT_SETTINGS.scaffolding_tightness,
          writing_aid_unlocked: row.writing_aid_unlocked,
          blocked_topics: row.blocked_topics ?? [],
          daily_cap: row.daily_cap,
          weekly_cap: row.weekly_cap,
        }),
      );
    } else {
      setForm(settingsToForm(DEFAULT_SETTINGS));
    }
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    loadSettings(selectedClassId);
  }, [selectedClassId, loadSettings]);

  const handleSave = async () => {
    if (!selectedClassId) return;
    setSaving(true);

    const { error } = await supabase.from('class_ai_settings').upsert(
      {
        class_id: selectedClassId,
        scaffolding_tightness: form.scaffolding_tightness,
        writing_aid_unlocked: form.writing_aid_unlocked,
        blocked_topics: parseTopics(form.blocked_topics),
        daily_cap: parseCap(form.daily_cap),
        weekly_cap: parseCap(form.weekly_cap),
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'class_id' },
    );

    setSaving(false);

    if (error) {
      toast.error('Could not save settings. Please try again.');
    } else {
      toast.success('Coach settings saved for this class');
      loadSettings(selectedClassId);
    }
  };

  if (loadingClasses) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5" />
            Coach settings
          </CardTitle>
          <CardDescription>
            Tune how the Coach behaves for each class at {school.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium">No classes yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create one from your school admin page, then come back to tune the Coach for it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5" />
            Coach settings
          </CardTitle>
          <CardDescription>
            Tune how the Coach behaves for a class — the tone of its help, what it will discuss, and how
            much students can lean on it. These settings shape the Coach, they don't monitor students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="class-select" className="text-sm font-medium">
            Class
          </Label>
          <Select
            value={selectedClassId ?? undefined}
            onValueChange={(v) => setSelectedClassId(v)}
          >
            <SelectTrigger id="class-select" className="w-full sm:max-w-sm">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.spec_focus ? ` · ${c.spec_focus}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClass && (
            <p className="text-xs text-muted-foreground pt-1">
              Settings below apply only to {selectedClass.name}
              {selectedClass.qualification_type ? ` (${selectedClass.qualification_type})` : ''}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={loadingSettings ? 'opacity-60 pointer-events-none' : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sliders className="h-4 w-4" />
            Scaffolding
          </CardTitle>
          <CardDescription>
            How much the Coach prompts and hints before letting students work it out for themselves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scaffolding tightness — segmented control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Scaffolding tightness</Label>
            <div className="grid grid-cols-3 gap-2">
              {SCAFFOLDING_OPTIONS.map((opt) => {
                const active = form.scaffolding_tightness === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, scaffolding_tightness: opt.value }))
                    }
                    aria-pressed={active}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground min-h-[2rem]">
              {
                SCAFFOLDING_OPTIONS.find(
                  (o) => o.value === form.scaffolding_tightness,
                )?.description
              }
            </p>
          </div>

          {/* Writing-aid mode — locked by default */}
          <div
            className={`rounded-lg border p-4 ${
              form.writing_aid_unlocked
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-border bg-muted/40'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="writing-aid"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  {form.writing_aid_unlocked ? (
                    <LockOpen className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  Writing-aid mode (full model answers)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Locked by default. Only unlock if you want students to be able to request fuller
                  written answers.
                </p>
                <Badge
                  variant={form.writing_aid_unlocked ? 'default' : 'outline'}
                  className="mt-1"
                >
                  {form.writing_aid_unlocked ? 'Unlocked' : 'Locked (safe default)'}
                </Badge>
              </div>
              <Switch
                id="writing-aid"
                checked={form.writing_aid_unlocked}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, writing_aid_unlocked: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={loadingSettings ? 'opacity-60 pointer-events-none' : undefined}>
        <CardHeader>
          <CardTitle className="text-base">Limits &amp; guardrails</CardTitle>
          <CardDescription>
            Optional boundaries on what the Coach will discuss and how often students can use it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blocked topics */}
          <div className="space-y-2">
            <Label htmlFor="blocked-topics" className="text-sm font-medium">
              Blocked topics
            </Label>
            <Input
              id="blocked-topics"
              value={form.blocked_topics}
              onChange={(e) =>
                setForm((f) => ({ ...f, blocked_topics: e.target.value }))
              }
              placeholder="e.g. coursework, exam questions, personal advice"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. The Coach will steer away from these for this class. Leave blank for none.
            </p>
            {parseTopics(form.blocked_topics).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parseTopics(form.blocked_topics).map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Usage caps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-cap" className="text-sm font-medium">
                Daily message cap
              </Label>
              <Input
                id="daily-cap"
                type="number"
                min={0}
                value={form.daily_cap}
                onChange={(e) => setForm((f) => ({ ...f, daily_cap: e.target.value }))}
                placeholder="No cap"
              />
              <p className="text-xs text-muted-foreground">Leave blank for no daily limit.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-cap" className="text-sm font-medium">
                Weekly message cap
              </Label>
              <Input
                id="weekly-cap"
                type="number"
                min={0}
                value={form.weekly_cap}
                onChange={(e) => setForm((f) => ({ ...f, weekly_cap: e.target.value }))}
                placeholder="No cap"
              />
              <p className="text-xs text-muted-foreground">Leave blank for no weekly limit.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || loadingSettings || !selectedClassId}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
};
