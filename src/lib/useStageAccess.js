import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Fetches stage access status for the current organization.
 * Returns the full stage access map from the getStageAccess backend function.
 */
export function useStageAccess(overrideOrgId) {
  const { user } = useCurrentUser();
  const hookOrgId = useOrgId();
  const orgId = overrideOrgId || hookOrgId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stageAccess', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      try {
        const res = await base44.functions.invoke('getStageAccess', { organizationId: orgId });
        return res;
      } catch {
        return null;
      }
    },
    enabled: !!orgId && !!user,
    staleTime: 30000,
  });

  const stages = data?.stages || [];
  const baselineCompleted = data?.baseline_completed ?? false;
  const currentStage = data?.current_stage || 'stabilize';
  const nextStage = data?.next_stage || 'stabilize';

  const canAccessStage = (stage) => {
    const s = stages.find((s) => s.stage === stage);
    return s ? s.status !== 'locked' : false;
  };

  const getStageStatus = (stage) => {
    const s = stages.find((s) => s.stage === stage);
    return s?.status || 'locked';
  };

  return {
    stages,
    baselineCompleted,
    currentStage,
    nextStage,
    canAccessStage,
    getStageStatus,
    isLoading,
    error,
    refetch,
    raw: data,
  };
}