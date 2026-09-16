import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch the authoritative role from the User entity via the service role
  // (resolveOrgContext). me() can return a stale role when the role was changed
  // after the session was created, which hid role-gated UI for affected users.
  const { data: context } = useQuery({
    queryKey: ['resolveOrgContext', null, user?.id],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('resolveOrgContext', {});
        return {
          role: res?.data?.role || res?.role || null,
          organization_id: res?.data?.organization_id || res?.organization_id || null,
        };
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const meRole = user?.data?.role || user?.role;
  const effectiveRole = context?.role || meRole;
  const isAdmin = effectiveRole === 'super_admin';
  const isCoach = effectiveRole === 'coach';
  const isLeadPastor = effectiveRole === 'lead_pastor';
  const isTeamMember = effectiveRole === 'team_member';
  const canManageAll = isAdmin || isCoach;
  const isOnboarded = !!user?.onboarded || !!user?.organization_id || !!context?.organization_id || !!user?.data?.onboarded || !!user?.data?.organization_id;

  return { user, loading, isAdmin, isCoach, isLeadPastor, isTeamMember, canManageAll, isOnboarded };
}