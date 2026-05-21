import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    }
    load();
  }, []);

  const effectiveRole = user?.data?.role || user?.role;
  const isAdmin = effectiveRole === 'super_admin';
  const isCoach = effectiveRole === 'coach';
  const isLeadPastor = effectiveRole === 'lead_pastor';
  const isTeamMember = effectiveRole === 'team_member';
  const canManageAll = isAdmin || isCoach;
  const isOnboarded = !!user?.onboarded || !!user?.organization_id || !!user?.data?.onboarded || !!user?.data?.organization_id;

  return { user, loading, isAdmin, isCoach, isLeadPastor, isTeamMember, canManageAll, isOnboarded };
}