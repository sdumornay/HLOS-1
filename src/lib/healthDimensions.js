// F8: Health dimension mapping across all 4 health entities
// Enables true cross-tool aggregation by mapping each entity's fields
// to canonical dimensions on a unified 0-10 scale.

export const CANONICAL_DIMENSIONS = [
  { key: 'trust', label: 'Trust', description: 'How much do team members trust each other?' },
  { key: 'safety', label: 'Psychological Safety', description: 'Do people feel safe to speak honestly?' },
  { key: 'clarity', label: 'Clarity', description: 'Is the vision and direction clear?' },
  { key: 'accountability', label: 'Accountability', description: 'Are people following through on commitments?' },
  { key: 'conflict', label: 'Low Conflict', description: 'How well is conflict managed? (higher = healthier)' },
  { key: 'momentum', label: 'Momentum', description: 'Is the team making progress?' },
  { key: 'commitment', label: 'Commitment', description: 'Do team members commit to decisions?' },
  { key: 'results', label: 'Results Focus', description: 'Is the team focused on collective results?' },
];

// Maps each entity's fields to canonical dimensions.
// `invert: true` means the source field is "higher = worse" and needs flipping.
// `sourceMax` is the maximum value of the source field (5 for FiveDysfunctions, 10 for others).
export const DIMENSION_MAP = {
  Assessment: {
    trust: { field: 'trust', invert: false, sourceMax: 10 },
    safety: { field: 'safety', invert: false, sourceMax: 10 },
    clarity: { field: 'clarity', invert: false, sourceMax: 10 },
    accountability: { field: 'accountability', invert: false, sourceMax: 10 },
    conflict: { field: 'conflict_intensity', invert: true, sourceMax: 10 },
    momentum: { field: 'overall_health', invert: false, sourceMax: 10 },
  },
  HealthPulse: {
    trust: { field: 'trust', invert: false, sourceMax: 10 },
    clarity: { field: 'clarity', invert: false, sourceMax: 10 },
    momentum: { field: 'momentum', invert: false, sourceMax: 10 },
    conflict: { field: 'conflict_level', invert: true, sourceMax: 10 },
    safety: { field: 'overall_health', invert: false, sourceMax: 10 },
  },
  TensionPulse: {
    conflict: { field: 'team_tension', invert: true, sourceMax: 10 },
    trust: { field: 'trust_level', invert: false, sourceMax: 10 },
    safety: { field: 'communication_safety', invert: false, sourceMax: 10 },
    clarity: { field: 'leadership_confidence', invert: false, sourceMax: 10 },
    momentum: { field: 'team_morale', invert: false, sourceMax: 10 },
  },
  FiveDysfunctions: {
    trust: { field: 'trust', invert: true, sourceMax: 5 },
    conflict: { field: 'conflict', invert: true, sourceMax: 5 },
    commitment: { field: 'commitment', invert: true, sourceMax: 5 },
    accountability: { field: 'accountability', invert: true, sourceMax: 5 },
    results: { field: 'results', invert: true, sourceMax: 5 },
  },
};

// Normalize a value from its source scale to 0-10
export function normalizeTo10(value, sourceMax = 10, invert = false) {
  if (value == null) return null;
  const normalized = (value / sourceMax) * 10;
  return parseFloat((invert ? 10 - normalized : normalized).toFixed(1));
}

// Extract canonical dimension scores from a single record
export function extractDimensions(entityName, record) {
  const map = DIMENSION_MAP[entityName];
  if (!map || !record) return {};
  const result = {};
  Object.entries(map).forEach(([canonicalKey, { field, invert, sourceMax }]) => {
    const value = record[field];
    if (value != null) {
      result[canonicalKey] = normalizeTo10(value, sourceMax, invert);
    }
  });
  return result;
}

// Aggregate dimensions across multiple entity records
// Input: [{ entityName: 'Assessment', record: {...} }, { entityName: 'TensionPulse', record: {...} }, ...]
// Output: { trust: 7.2, safety: 6.5, ... } — averaged across all sources
export function aggregateDimensions(records) {
  const sums = {};
  const counts = {};
  records.forEach(({ entityName, record }) => {
    const dims = extractDimensions(entityName, record);
    Object.entries(dims).forEach(([key, value]) => {
      if (value != null) {
        sums[key] = (sums[key] || 0) + value;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
  });
  const result = {};
  Object.keys(sums).forEach(key => {
    result[key] = parseFloat((sums[key] / counts[key]).toFixed(1));
  });
  return result;
}

// Get the dimensions that are below a threshold (health gaps)
export function getHealthGaps(dimensions, threshold = 5) {
  return Object.entries(dimensions)
    .filter(([, value]) => value < threshold)
    .sort((a, b) => a[1] - b[1])
    .map(([key, value]) => ({ key, value, label: CANONICAL_DIMENSIONS.find(d => d.key === key)?.label || key }));
}