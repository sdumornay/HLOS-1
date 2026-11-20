import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Checks whether the org has completed the Organizational Impact Baseline assessment.
 * Returns impactCompleted + the latest assessment record (if any).
 */
export function useImpactAssessmentStatus(orgId) {
  const { data: assessments = [], ...rest } = useQuery({
    queryKey: ['impactAssessments', orgId],
    queryFn: () => base44.entities.ImpactAssessment.filter({ organization_id: orgId }, '-created_date', 10),
    enabled: !!orgId,
  });

  const impactCompleted = assessments.length > 0;
  const latestAssessment = assessments[0] || null;

  return { impactCompleted, latestAssessment, assessments, ...rest };
}