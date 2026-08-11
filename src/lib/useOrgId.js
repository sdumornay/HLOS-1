import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Returns the active organization ID.
 * Resolves via a backend function that uses the service role to bypass RLS,
 * so users with a stale or missing organization_id still get the correct org.
 * Checks for ?org= query param first (consultant viewing a specific org).
 */
export function useOrgId() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');

  const { data: resolvedOrgId } = useQuery({
    queryKey: ['resolveOrgContext', orgParam, user?.id],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('resolveOrgContext', { organization_id: orgParam });
        return res?.data?.organization_id || res?.organization_id || null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  return resolvedOrgId || undefined;
}