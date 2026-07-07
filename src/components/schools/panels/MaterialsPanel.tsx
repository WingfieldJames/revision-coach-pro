import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Loader2, ShieldAlert, Trash2, UploadCloud } from 'lucide-react';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import type { Tables } from '@/integrations/supabase/types';

interface MaterialsPanelProps {
  school: Tables<'schools'>;
}

type MaterialRow = Tables<'school_materials'>;

type MaterialType = 'mark_scheme' | 'mock_paper' | 'house_style';

const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: 'mark_scheme', label: 'Mark scheme' },
  { value: 'mock_paper', label: 'Mock paper' },
  { value: 'house_style', label: 'House style' },
];

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx';

const materialTypeLabel = (value: string | null): string =>
  MATERIAL_TYPES.find((t) => t.value === value)?.label ?? 'Material';

type StatusStyle = { label: string; className: string };

const STATUS_STYLES: Record<string, StatusStyle> = {
  pending: {
    label: 'Pending',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  processing: {
    label: 'Processing',
    className: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  done: {
    label: 'Done',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400',
  },
};

const statusStyle = (status: string): StatusStyle =>
  STATUS_STYLES[status] ?? { label: status, className: 'border-border bg-muted text-muted-foreground' };

/** Strips path-unfriendly characters from an uploaded file name. */
const safeName = (name: string): string =>
  name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const MaterialsPanel = ({ school }: MaterialsPanelProps) => {
  const { user } = useAuth();
  const { loading: membershipLoading, membership } = useSchoolMembership();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState<MaterialType>('mark_scheme');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [pendingDelete, setPendingDelete] = useState<MaterialRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const role = membership?.role;
  const canManage = role === 'teacher' || role === 'admin';

  const loadMaterials = useCallback(async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('school_materials')
      .select('*')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Could not load your materials');
      setMaterials([]);
    } else {
      setMaterials(data ?? []);
    }
    setLoadingList(false);
  }, [school.id]);

  useEffect(() => {
    if (membershipLoading || !canManage) return;
    loadMaterials();
  }, [membershipLoading, canManage, loadMaterials]);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && file != null && !uploading,
    [title, file, uploading],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const resetForm = () => {
    setTitle('');
    setMaterialType('mark_scheme');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || title.trim().length === 0 || !user) return;

    setUploading(true);
    try {
      const path = `${school.id}/${Date.now()}-${safeName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from('school-materials')
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('school_materials').insert({
        school_id: school.id,
        uploaded_by: user.id,
        title: title.trim(),
        material_type: materialType,
        file_url: path,
        processing_status: 'pending',
      });
      if (insertError) {
        // Roll back the orphaned storage object if the row insert fails.
        await supabase.storage.from('school-materials').remove([path]);
        throw insertError;
      }

      toast.success('Material uploaded');
      resetForm();
      loadMaterials();
    } catch {
      toast.error('Could not upload the material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.file_url) {
        const { error: removeError } = await supabase.storage
          .from('school-materials')
          .remove([pendingDelete.file_url]);
        if (removeError) throw removeError;
      }

      const { error: deleteError } = await supabase
        .from('school_materials')
        .delete()
        .eq('id', pendingDelete.id);
      if (deleteError) throw deleteError;

      toast.success('Material removed');
      setPendingDelete(null);
      loadMaterials();
    } catch {
      toast.error('Could not remove the material. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (membershipLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium">Only teachers and admins can manage materials.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask a teacher at {school.name} if you need something added for the Coach.
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
            <FileText className="h-5 w-5" />
            Materials
          </CardTitle>
          <CardDescription>
            Upload {school.name}'s own mark schemes, mock papers and house style so the Coach marks
            and answers the way your department does.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload a material</CardTitle>
          <CardDescription>
            Processing happens automatically after upload — the Coach picks new materials up once
            they've been prepared. You don't need to do anything else.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="material-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Year 11 Mock Paper 2 mark scheme"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-type" className="text-sm font-medium">
                  Type
                </Label>
                <Select
                  value={materialType}
                  onValueChange={(v) => setMaterialType(v as MaterialType)}
                >
                  <SelectTrigger id="material-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material-file" className="text-sm font-medium">
                  File
                </Label>
                <Input
                  id="material-file"
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileSelect}
                  className="cursor-pointer file:mr-3 file:text-sm file:font-medium"
                />
                <p className="text-xs text-muted-foreground">PDF, TXT, Markdown or Word (.docx).</p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={!canSubmit}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Materials list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your materials</CardTitle>
          <CardDescription>
            Everything {school.name} has added for the Coach, and where each one is in processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm font-medium">No materials yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first mark scheme or mock paper above to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {materials.map((m) => {
                const style = statusStyle(m.processing_status);
                return (
                  <li key={m.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{materialTypeLabel(m.material_type)}</Badge>
                        <Badge variant="outline" className={style.className}>
                          {style.label}
                        </Badge>
                        {m.processing_status === 'done' && (
                          <span className="text-xs text-muted-foreground">
                            {m.chunks_created} chunk{m.chunks_created === 1 ? '' : 's'}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${m.title}`}
                      onClick={() => setPendingDelete(m)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this material?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes “{pendingDelete?.title}” and its file. The Coach will stop using it. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
