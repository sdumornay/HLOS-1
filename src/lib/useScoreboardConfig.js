import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Fetches the active ScoreboardConfig record (singleton, config_key='default').
// Returns the stored config fields (merged over defaults by the engine) plus
// the full record (for the admin editor) and loading/error state. Read access
// is open to all authenticated users.
export function useScoreboardConfig() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['scoreboardConfig', 'default'],
    queryFn: async () => {
      const res = await base44.entities.ScoreboardConfig.filter({ config_key: 'default' }, '-updated_date', 1);
      const list = res?.data ?? res;
      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    },
    staleTime: 60 * 1000,
  });

  const config = data
    ? {
        thresholds: data.thresholds,
        severity_labels: data.severity_labels,
        starting_point_template: data.starting_point_template,
        starting_point_all_strong_template: data.starting_point_all_strong_template,
        stage_configs: data.stage_configs,
      }
    : null;

  return { configRecord: data, config, isLoading, error, refetch };
}