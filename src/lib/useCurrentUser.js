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

  const isAdmin = user?.role === 'super_admin';
  const isCoach = user?.role === 'coach';
  const isLeadPastor = user?.role === 'lead_pastor';
  const isTeamMember = user?.role === 'team_member';
  const canManageAll = isAdmin || isCoach;

  return { user, loading, isAdmin, isCoach, isLeadPastor, isTeamMember, canManageAll };
}