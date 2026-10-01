import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Checks whether the org has completed the Organizational Health Snapshot.
 * Returns snapshotCompleted + the latest snapshot record (if any).
 */
export function useOrgSnapshotStatus(orgId) {
  const { data: snapshots = [], ...rest } = useQuery({
    queryKey: ['orgHealthSnapshots', orgId],
    queryFn: () => base44.entities.OrgHealthSnapshot.filter({ organization_id: orgId }, '-created_date', 10),
    enabled: !!orgId,
  });

  const snapshotCompleted = snapshots.length > 0;
  const latestSnapshot = snapshots[0] || null;

  return { snapshotCompleted, latestSnapshot, snapshots, ...rest };
}