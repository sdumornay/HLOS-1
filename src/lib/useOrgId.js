import { useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Returns the active organization ID.
 * Checks for ?org= query param first (consultant viewing a specific org),
 * falls back to the current user's organization_id.
 */
export function useOrgId() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');
  return orgParam || user?.organization_id;
}