import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import { StudentCoach } from '@/components/schools/StudentCoach';
import { TeacherDashboard } from '@/components/schools/TeacherDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, School as SchoolIcon } from 'lucide-react';

export const SchoolsApp = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: membershipLoading, membership } = useSchoolMembership();

  // Not signed in → send to login, preserving the return path (matches ?redirect= convention)
  if (!authLoading && !user) {
    return <Navigate to="/login?redirect=schools/app" replace />;
  }

  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <SchoolIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-bold mb-2">You&apos;re not linked to a school yet</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ask your teacher for an invite, or head back to your dashboard.
            </p>
            <Button asChild variant="brand" className="rounded-full">
              <a href="/progress">Back to dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStudent = membership.role === 'student';

  return (
    <Routes>
      <Route
        index
        element={<Navigate to={isStudent ? 'coach' : 'teacher'} replace />}
      />
      <Route path="coach" element={<StudentCoach school={membership.school} />} />
      <Route path="teacher" element={<TeacherDashboard school={membership.school} />} />
      <Route path="*" element={<Navigate to={isStudent ? 'coach' : 'teacher'} replace />} />
    </Routes>
  );
};
