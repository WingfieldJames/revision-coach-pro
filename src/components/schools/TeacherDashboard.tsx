import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { School as SchoolIcon } from 'lucide-react';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import type { School } from '@/hooks/useSchoolMembership';
import { OverviewPanel } from '@/components/schools/panels/OverviewPanel';
import { RosterPanel } from '@/components/schools/panels/RosterPanel';
import { SafeguardingPanel } from '@/components/schools/panels/SafeguardingPanel';
import { TunabilityPanel } from '@/components/schools/panels/TunabilityPanel';
import { BrandingPanel } from '@/components/schools/panels/BrandingPanel';

interface TeacherDashboardProps {
  school: School;
}

export const TeacherDashboard = ({ school }: TeacherDashboardProps) => {
  const { user } = useAuth();
  const { membership } = useSchoolMembership();
  const isAdmin = membership?.role === 'admin';
  const accent = school.primary_color || undefined;
  const teacherName = user?.email ?? 'Teacher';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className="h-9 w-9 rounded-md object-contain"
            />
          ) : (
            <div
              className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center"
              style={accent ? { backgroundColor: `${accent}1a` } : undefined}
            >
              <SchoolIcon className="h-5 w-5 text-primary" style={accent ? { color: accent } : undefined} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{school.name}</h1>
            <p className="text-xs text-muted-foreground">Signed in as {teacherName}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 sm:px-10 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="safeguarding">Safeguarding</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {isAdmin && <TabsTrigger value="branding">Branding</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewPanel school={school} />
          </TabsContent>
          <TabsContent value="roster" className="mt-6">
            <RosterPanel school={school} />
          </TabsContent>
          <TabsContent value="safeguarding" className="mt-6">
            <SafeguardingPanel school={school} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <TunabilityPanel school={school} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="branding" className="mt-6">
              <BrandingPanel school={school} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
