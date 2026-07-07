import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Palette, School as SchoolIcon, ShieldAlert } from 'lucide-react';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import type { Tables } from '@/integrations/supabase/types';

interface BrandingPanelProps {
  school: Tables<'schools'>;
}

const DEFAULT_COLOUR = '#4f46e5';

/** Normalises free-typed hex into a valid #rrggbb, or null if unusable. */
const normaliseHex = (value: string): string | null => {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null;
};

const fileExtension = (file: File): string => {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/').pop();
  return (fromType || 'png').toLowerCase();
};

export const BrandingPanel = ({ school }: BrandingPanelProps) => {
  useAuth();
  const { loading: membershipLoading, membership } = useSchoolMembership();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(school.logo_url);
  const [colourHex, setColourHex] = useState<string>(school.primary_color || DEFAULT_COLOUR);
  const [uploading, setUploading] = useState(false);
  const [savingColour, setSavingColour] = useState(false);

  // Keep local state in step with the incoming school prop.
  useEffect(() => {
    setLogoUrl(school.logo_url);
    setColourHex(school.primary_color || DEFAULT_COLOUR);
  }, [school.logo_url, school.primary_color]);

  const role = membership?.role;
  const isAdmin = role === 'admin';

  if (membershipLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium">Only a school admin can change branding.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask an admin at {school.name} if you need the logo or colour updated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accent = colourHex || undefined;

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again still fires onChange.
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const ext = fileExtension(file);
      const path = `${school.id}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('school-branding')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('school-branding')
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('schools')
        .update({ logo_url: publicUrl })
        .eq('id', school.id);
      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success('Branding saved');
    } catch (err) {
      toast.error('Could not upload the logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColour = async () => {
    const normalised = normaliseHex(colourHex);
    if (!normalised) {
      toast.error('Enter a valid hex colour, e.g. #4f46e5');
      return;
    }

    setSavingColour(true);
    const { error } = await supabase
      .from('schools')
      .update({ primary_color: normalised })
      .eq('id', school.id);
    setSavingColour(false);

    if (error) {
      toast.error('Could not save the colour. Please try again.');
    } else {
      setColourHex(normalised);
      toast.success('Branding saved');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Set the logo and accent colour students see when they open the Coach at {school.name}.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School logo</CardTitle>
          <CardDescription>
            A square image works best. It appears in the branded header for students and staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${school.name} logo`}
                className="h-14 w-14 rounded-md object-contain border border-border bg-background"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center border border-border"
                style={accent ? { backgroundColor: `${accent}1a` } : undefined}
              >
                <SchoolIcon
                  className="h-6 w-6 text-primary"
                  style={accent ? { color: accent } : undefined}
                />
              </div>
            )}
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    {logoUrl ? 'Replace logo' : 'Upload logo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG or SVG.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </CardContent>
      </Card>

      {/* Primary colour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accent colour</CardTitle>
          <CardDescription>
            Used for the school name and header accent in the Coach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand-colour" className="text-sm font-medium">
                Colour
              </Label>
              <Input
                id="brand-colour"
                type="color"
                value={normaliseHex(colourHex) ?? DEFAULT_COLOUR}
                onChange={(e) => setColourHex(e.target.value)}
                className="h-10 w-16 p-1"
              />
            </div>
            <div className="space-y-2 flex-1 max-w-[12rem]">
              <Label htmlFor="brand-colour-hex" className="text-sm font-medium">
                Hex
              </Label>
              <Input
                id="brand-colour-hex"
                value={colourHex}
                onChange={(e) => setColourHex(e.target.value)}
                placeholder="#4f46e5"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button onClick={handleSaveColour} disabled={savingColour}>
              {savingColour ? 'Saving…' : 'Save colour'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live preview — mirrors the StudentCoach branded header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>How the branded header looks to students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="border-b border-border px-4 py-3 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${school.name} logo`}
                  className="h-8 w-8 rounded-md object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center"
                  style={accent ? { backgroundColor: `${accent}1a` } : undefined}
                >
                  <SchoolIcon
                    className="h-4 w-4 text-primary"
                    style={accent ? { color: accent } : undefined}
                  />
                </div>
              )}
              <span
                className="text-sm font-bold"
                style={accent ? { color: accent } : undefined}
              >
                {school.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
