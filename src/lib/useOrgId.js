import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Returns the active organization ID.
 * Checks for ?org= query param first (consultant viewing a specific org),
 * falls back to the current user's organization_id.
 * If that org_id doesn't match a real organization (e.g. stale value),
 * falls back to the first available organization.
 */
export function useOrgId() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');
  const rawOrgId = orgParam || user?.organization_id;

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: !!user,
  });

  // If the user's org_id doesn't match a real org, fall back to the first available org
  if (organizations.length > 0 && !organizations.find(o => o.id === rawOrgId)) {
    return organizations[0]?.id || rawOrgId;
  }

  return rawOrgId;
}