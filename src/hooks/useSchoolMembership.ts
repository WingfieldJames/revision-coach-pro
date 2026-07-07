import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type SchoolRole = 'admin' | 'teacher' | 'student' | 'dsl';

export type School = Tables<'schools'>;

export interface SchoolMembership {
  school_id: string;
  role: SchoolRole;
  school: School;
}

interface UseSchoolMembershipResult {
  loading: boolean;
  membership: SchoolMembership | null;
}

/**
 * Resolves the current auth user's accepted school membership (if any),
 * joined to the parent school for branding. Additive to B2C — read-only.
 */
export function useSchoolMembership(): UseSchoolMembershipResult {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<SchoolMembership | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_members')
        .select('school_id, role, invite_status, school:schools(*)')
        .eq('user_id', user.id)
        .eq('invite_status', 'accepted')
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data || !data.school) {
        setMembership(null);
      } else {
        setMembership({
          school_id: data.school_id,
          role: data.role as SchoolRole,
          school: data.school,
        });
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { loading, membership };
}
