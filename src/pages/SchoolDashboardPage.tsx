import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  GraduationCap,
  CalendarDays,
  Shield,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

interface School {
  id: string;
  name: string;
  contact_email: string;
}

interface License {
  id: string;
  total_seats: number;
  used_seats: number;
  plan_type: string;
  active: boolean;
  starts_at: string;
  expires_at: string;
}

interface Member {
  id: string;
  user_id: string | null;
  role: string;
  invited_email: string | null;
  invite_status: string;
  joined_at: string | null;
  created_at: string;
}

export const SchoolDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [school, setSchool] = useState<School | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<'student' | 'teacher'>('student');
  const [inviting, setInviting] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchSchoolData();
  }, [user]);

  const fetchSchoolData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's school membership
      const { data: membership, error: memberError } = await supabase
        .from('school_members')
        .select('school_id, role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'teacher'])
        .limit(1)
        .maybeSingle();

      if (memberError || !membership) {
        toast.error('You do not have access to a school dashboard.');
        navigate('/');
        return;
      }

      setUserRole(membership.role);

      // Get school details
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', membership.school_id)
        .single();

      if (schoolData) setSchool(schoolData as School);

      // Get active license
      const { data: licenseData } = await supabase
        .from('school_licenses')
        .select('*')
        .eq('school_id', membership.school_id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (licenseData) setLicense(licenseData as License);

      // Get all members
      const { data: membersData } = await supabase
        .from('school_members')
        .select('*')
        .eq('school_id', membership.school_id)
        .order('created_at', { ascending: false });

      if (membersData) setMembers(membersData as Member[]);
    } catch (err) {
      console.error('Error fetching school data:', err);
      toast.error('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvites = async () => {
    if (!school || !user) return;
    setInviting(true);

    const emails = inviteEmails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error('Please enter at least one email address');
      setInviting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('school-invite', {
        body: {
          school_id: school.id,
          emails,
          role: inviteRole,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        toast.error(response.error.message || 'Failed to send invites');
      } else {
        const result = response.data;
        toast.success(`${result.invited} invite(s) sent successfully`);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err: string) => toast.error(err));
        }
        setInviteEmails('');
        setInviteOpen(false);
        fetchSchoolData();
      }
    } catch (err) {
      console.error('Error sending invites:', err);
      toast.error('Failed to send invites');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('school_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        toast.error('Failed to remove member');
      } else {
        toast.success('Member removed');
        fetchSchoolData();
      }
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Failed to remove member');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    if (!license) return false;
    const daysLeft =
      (new Date(license.expires_at).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    return daysLeft < 30;
  };

  const acceptedMembers = members.filter((m) => m.invite_status === 'accepted');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavLinks />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading school dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showNavLinks />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">
            {school?.name ?? 'School'} Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your school's license, teachers, and students
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Seats
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {license?.total_seats ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Seats Used
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {license?.used_seats ?? 0}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  / {license?.total_seats ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                License Status
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge
                variant={license?.active ? 'default' : 'destructive'}
              >
                {license?.active ? 'Active' : 'Inactive'}
              </Badge>
              {license && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {license.plan_type} plan
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expires
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {license ? formatDate(license.expires_at) : '-'}
              </div>
              {isExpiringSoon() && (
                <p className="text-xs text-destructive mt-1">Expiring soon</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members
                </CardTitle>
                <CardDescription>
                  {members.length} member(s) across your school
                </CardDescription>
              </div>

              {userRole === 'admin' && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <label className="text-sm font-medium text-primary mb-1 block">
                          Email Addresses
                        </label>
                        <textarea
                          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Enter emails, one per line or comma-separated"
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-primary mb-1 block">
                          Role
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant={inviteRole === 'student' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setInviteRole('student')}
                          >
                            Student
                          </Button>
                          <Button
                            variant={inviteRole === 'teacher' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setInviteRole('teacher')}
                          >
                            Teacher
                          </Button>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSendInvites}
                        disabled={inviting || !inviteEmails.trim()}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {inviting ? 'Sending...' : 'Send Invites'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Joined
                    </th>
                    {userRole === 'admin' && (
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td
                        colSpan={userRole === 'admin' ? 5 : 4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No members yet. Invite students and teachers to get started.
                      </td>
                    </tr>
                  )}
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        {member.invited_email ?? '-'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {member.invite_status === 'accepted' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Accepted
                          </span>
                        ) : member.invite_status === 'expired' ? (
                          <span className="text-destructive">Expired</span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(member.joined_at)}
                      </td>
                      {userRole === 'admin' && (
                        <td className="py-3 px-2 text-right">
                          {member.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Student Progress
            </CardTitle>
            <CardDescription>
              Overview of accepted students and their activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">
                  {acceptedMembers.filter((m) => m.role === 'student').length}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold">
                  {acceptedMembers.filter((m) => m.role === 'teacher').length}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  Pending Invites
                </p>
                <p className="text-2xl font-bold">
                  {members.filter((m) => m.invite_status === 'pending').length}
                </p>
              </div>
            </div>

            {/* Student table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Student
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedMembers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No accepted members yet.
                      </td>
                    </tr>
                  )}
                  {acceptedMembers.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        {member.invited_email ?? '-'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(member.joined_at)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(member.joined_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SchoolDashboardPage;
