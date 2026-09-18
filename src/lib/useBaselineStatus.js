import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Checks whether the org has completed the Leadership Health Scoreboard baseline.
 * Returns baselineCompleted + the latest scoreboard record (if any).
 */
export function useBaselineStatus(orgId) {
  const { data: scoreboards = [], ...rest } = useQuery({
    queryKey: ['leadershipHealthScoreboard', orgId],
    queryFn: () => base44.entities.LeadershipHealthScoreboard.filter({ organization_id: orgId }, '-created_date', 10),
    enabled: !!orgId,
  });

  const baselineCompleted = scoreboards.length > 0;
  const latestScoreboard = scoreboards[0] || null;

  return { baselineCompleted, latestScoreboard, scoreboards, ...rest };
}