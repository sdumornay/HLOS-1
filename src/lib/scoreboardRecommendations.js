// Sequence-aware diagnosis + recommendation engine for the Leadership Health
// Scoreboard results. Severity is still computed from score thresholds, but the
// "Current Action Stage" is determined by the HLOS sequence (the first stage not
// yet completed), NOT by whichever score is lowest. Only the current stage
// receives a "what to do now" recommendation; later stages get future-priority notes.
//
// All templates + thresholds are admin-editable via the ScoreboardConfig entity
// and deep-merged over these defaults, so nothing here is hard-wired at runtime.

import { STAGE_ORDER, STAGE_META } from '@/lib/stageMeta';

export const DEFAULT_CONFIG = {
  thresholds: { strong: 8, stable: 6, needs_attention: 4 },
  severity_labels: {
    strong: 'Strong',
    stable: 'Stable',
    needs_attention: 'Needs Attention',
    critical: 'Critical',
  },
  starting_point_template:
    'Your scores reveal needs in several areas. HLOS addresses them sequentially because later-stage performance often depends on the health and clarity established earlier. Your current starting point is {currentStage}.',
  starting_point_all_strong_template:
    'Your scores are strong across every stage. HLOS is still sequential, so your current starting point is {currentStage} — use it to protect and extend the health you have already built.',
  stage_configs: {
    stabilize: {
      diagnosis: {
        low: 'The results suggest that tension, trust, communication, or unresolved issues may be making it difficult for the team to operate effectively. Before focusing heavily on strategy or execution, the team may need greater stability and healthier working relationships.',
        moderate: 'The team has some healthy foundations, but unresolved tension or communication gaps may still interfere with effectiveness. Strengthening team health now can make the later stages more productive.',
        strong: 'The team appears to have a relatively stable foundation for working together. Continue protecting trust, communication, and healthy conflict as you move into deeper alignment.',
      },
      current_action: {
        strong: "The team's foundation is strong. Maintain the Stabilize practices and move confidently into Align when ready.",
        stable: "The team's foundation is healthy. Continue using the Stabilize tools to protect trust and communication as you prepare to move into Align.",
        needs_attention: "Begin by strengthening the team's foundation. Use the Stabilize tools to surface tension, understand team dynamics, and address issues that may be interfering with trust and communication.",
        critical: "Start with Stabilize before addressing the later-stage concerns. The results suggest that team health may be limiting the organization's ability to align and execute effectively. Use the Stabilize tools to identify sources of tension, strengthen trust, and resolve the most important barriers first.",
      },
      future_priority: {
        strong: 'Stabilize is a strength. Maintain it as you progress through the later stages.',
        stable: 'Stabilize looks healthy. Keep protecting it as you move forward.',
        needs_attention: 'Stabilize is your first priority and will be addressed before the later stages.',
        critical: 'Stabilize is your first priority and will be addressed before the later stages.',
      },
      bridging: 'Strengthening this foundation will prepare the team to address the concerns the assessment revealed in {concernStage}.',
      tools: ['Tension Pulse', 'Team Health & Culture assessment', 'Conflict Intake', 'Communication Agreements'],
    },
    align: {
      diagnosis: {
        low: 'The results suggest that leaders may not yet share enough clarity about direction, priorities, roles, or expectations. Without stronger alignment, people may work hard while moving in different directions.',
        moderate: 'There is some shared direction, but important gaps may remain around priorities, ownership, expectations, or decision-making. Greater clarity would strengthen coordinated execution.',
        strong: 'The leadership team appears to share a strong level of clarity around direction and responsibilities. Protect that alignment as priorities and circumstances change.',
      },
      current_action: {
        strong: 'The team is well aligned. Protect that clarity and move into Execute with confidence.',
        stable: 'Alignment is largely in place. Use the Align tools to refine roles and priorities as you prepare for disciplined execution.',
        needs_attention: 'Focus next on creating shared clarity. Use the Align tools to clarify direction, roles, workstyles, expectations, and ownership so the team can move forward together.',
        critical: 'Focus next on creating shared clarity. The results reveal significant alignment gaps. Use the Align tools — Workstyle Assessment, role clarity worksheets, and priority alignment exercises — to establish the direction and ownership the team needs before execution can be effective.',
      },
      future_priority: {
        strong: 'Alignment is a strength. Maintain it and revisit it once you reach the Align stage.',
        stable: 'Alignment looks reasonably healthy. It will become a focus once you complete Stabilize.',
        needs_attention: 'Alignment needs attention. Complete the Stabilize work first; this will become a priority when you enter the Align stage.',
        critical: 'Alignment is an important future concern. Your results suggest significant gaps in clarity or shared direction. Complete the Stabilize work first; these findings will become a priority when you enter Align.',
      },
      bridging: 'Creating this clarity will prepare the team to address the concerns the assessment revealed in {concernStage}.',
      tools: ['Workstyle Assessment', 'Role Clarity Worksheet', 'Priority Alignment', 'Decision Rights Map', 'Leadership Covenant'],
    },
    execute: {
      diagnosis: {
        low: 'The results suggest that the organization may struggle to consistently turn plans into action. Priorities, accountability, measures, follow-through, or operating rhythms may need strengthening.',
        moderate: 'The organization is producing activity, but execution may not yet be consistent. Stronger accountability, measurable priorities, and follow-through could improve momentum.',
        strong: 'The organization appears to have healthy execution habits. Continue using clear priorities, measures, ownership, and review rhythms to maintain momentum.',
      },
      current_action: {
        strong: 'Execution is a strength. Maintain your rhythms and move into Sustain to protect long-term health.',
        stable: 'Execution is developing well. Continue using the Execute tools to strengthen accountability and follow-through.',
        needs_attention: 'Your next priority is converting alignment into disciplined action. Use the Execute tools to establish measurable priorities, clear ownership, accountability, and a consistent rhythm for reviewing progress.',
        critical: 'Your next priority is converting alignment into disciplined action. The results reveal significant execution gaps. Use the Execute tools — Priority Tracker, Action Tracker, Decision Log, and Meeting Console — to establish measurable priorities, clear ownership, accountability, and a consistent review rhythm.',
      },
      future_priority: {
        strong: 'Execution is a strength. Maintain it and revisit it once you reach the Execute stage.',
        stable: 'Execution looks reasonably healthy. It will become a focus once you complete the earlier stages.',
        needs_attention: 'Execution needs attention. Strengthen Stabilize and Align first; this will become a priority when you enter the Execute stage.',
        critical: 'Execution is also an important area for future attention. Current results suggest weaknesses in follow-through, accountability, or operating rhythm. Strengthening Stabilize and Align first will create a better foundation for addressing execution.',
      },
      bridging: 'Strengthening execution will prepare the team to address the concerns the assessment revealed in {concernStage}.',
      tools: ['Priority Tracker', 'Action Tracker', 'Decision Log', 'Meeting Console', 'Accountability View'],
    },
    sustain: {
      diagnosis: {
        low: 'The results suggest that current momentum may be difficult to maintain over time. Leadership development, continuous improvement, organizational learning, or sustainable work rhythms may need attention.',
        moderate: 'The organization has some practices that support long-term health, but sustainability may still depend too heavily on particular leaders or informal habits.',
        strong: 'The organization appears to have strong foundations for sustaining progress. Continue monitoring leadership health, developing people, and adapting systems as the organization grows.',
      },
      current_action: {
        strong: 'Sustainability is a strength. Continue monitoring and adapting as the organization grows.',
        stable: 'Sustainability practices are developing well. Continue using the Sustain tools to monitor and renew.',
        needs_attention: 'Focus now on protecting and extending the progress already made. Use the Sustain tools to monitor organizational health, develop leaders, review performance, and identify emerging issues before they become major barriers.',
        critical: 'Focus now on protecting and extending the progress already made. The results reveal sustainability risks. Use the Sustain tools — Health Pulse, Quarterly Review, and Renewal Reflection — to monitor health, develop leaders, and build sustainable rhythms.',
      },
      future_priority: {
        strong: 'Sustainability is a strength. Maintain it and revisit it once you reach the Sustain stage.',
        stable: 'Sustainability looks reasonably healthy. It will become a focus once you complete the earlier stages.',
        needs_attention: 'Sustainability will be addressed after the organization establishes healthier alignment and execution rhythms.',
        critical: 'Sustainability concerns are visible, but they should be addressed in sequence. The earlier HLOS stages are designed to establish the conditions needed for long-term momentum.',
      },
      bridging: '',
      tools: ['Health Pulse', 'Quarterly Review', 'Renewal Reflection', 'Risk Flags'],
    },
  },
};

// Deep-merge a stored config over the defaults so partial admin edits never
// leave a stage or severity without text.
export function mergeConfig(stored) {
  if (!stored) return DEFAULT_CONFIG;
  const merged = {
    thresholds: { ...DEFAULT_CONFIG.thresholds, ...(stored.thresholds || {}) },
    severity_labels: { ...DEFAULT_CONFIG.severity_labels, ...(stored.severity_labels || {}) },
    starting_point_template: stored.starting_point_template || DEFAULT_CONFIG.starting_point_template,
    starting_point_all_strong_template: stored.starting_point_all_strong_template || DEFAULT_CONFIG.starting_point_all_strong_template,
    stage_configs: {},
  };
  STAGE_ORDER.forEach((stage) => {
    const def = DEFAULT_CONFIG.stage_configs[stage];
    const over = stored.stage_configs?.[stage] || {};
    merged.stage_configs[stage] = {
      diagnosis: { ...def.diagnosis, ...(over.diagnosis || {}) },
      current_action: { ...def.current_action, ...(over.current_action || {}) },
      future_priority: { ...def.future_priority, ...(over.future_priority || {}) },
      bridging: over.bridging !== undefined ? over.bridging : def.bridging,
      tools: over.tools?.length ? over.tools : def.tools,
    };
  });
  return merged;
}

// Map a severity tier to one of the three diagnosis levels (low / moderate / strong).
function diagnosisLevel(severity) {
  if (severity === 'critical') return 'low';
  if (severity === 'needs_attention') return 'moderate';
  return 'strong'; // stable + strong both use the "strong" diagnosis
}

// Compute the severity tier for a 1-10 score.
export function getSeverity(score, config) {
  const t = config.thresholds;
  if (score >= t.strong) return 'strong';
  if (score >= t.stable) return 'stable';
  if (score >= t.needs_attention) return 'needs_attention';
  return 'critical';
}

// The Current Action Stage is the first stage in the HLOS sequence that is not
// yet completed. `stageStatuses` maps each stage key to its progress status
// (e.g. 'locked' | 'available' | 'in_progress' | 'awaiting_approval' | 'completed').
// If every stage is completed, the current action falls back to the first stage
// that is not Strong, or Sustain if all are Strong.
export function determineCurrentActionStage(stageStatuses, severities) {
  for (const stage of STAGE_ORDER) {
    if (stageStatuses[stage] !== 'completed') return stage;
  }
  // All completed — focus on the first stage that still needs attention.
  for (const stage of STAGE_ORDER) {
    if (severities[stage] !== 'strong') return stage;
  }
  return 'sustain';
}

// Build the full structured result used by the results page.
export function buildScoreboardRecommendations(scores, stageStatuses, config) {
  const cfg = mergeConfig(config);
  const stageScoreMap = {
    stabilize: scores.stabilize_score,
    align: scores.align_score,
    execute: scores.execute_score,
    sustain: scores.sustain_score,
  };
  const severities = {};
  STAGE_ORDER.forEach((stage) => {
    severities[stage] = getSeverity(stageScoreMap[stage], cfg);
  });

  const currentActionStage = determineCurrentActionStage(stageStatuses, severities);
  const currentIdx = STAGE_ORDER.indexOf(currentActionStage);

  // Find the next future stage (after the current action stage) with the worst
  // severity, so the current-stage recommendation can reference it.
  let concernStage = null;
  let concernSeverity = null;
  for (let i = currentIdx + 1; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    const sev = severities[stage];
    if (sev === 'critical' || sev === 'needs_attention') {
      concernStage = stage;
      concernSeverity = sev;
      break;
    }
  }

  const phases = STAGE_ORDER.map((stage) => {
    const score = stageScoreMap[stage];
    const severity = severities[stage];
    const severityLabel = cfg.severity_labels[severity];
    const stageCfg = cfg.stage_configs[stage];
    const diagnosis = stageCfg.diagnosis[diagnosisLevel(severity)];
    const idx = STAGE_ORDER.indexOf(stage);
    const isCurrent = stage === currentActionStage;
    const isFuture = idx > currentIdx;
    const isPast = idx < currentIdx;

    let recommendationType;
    let recommendationText;
    let tools = null;

    if (isCurrent) {
      recommendationType = 'current_action';
      recommendationText = stageCfg.current_action[severity] || stageCfg.current_action.needs_attention;
      tools = stageCfg.tools;
      // Personalize: append a bridging sentence when the current stage still has
      // work to do (not Strong) AND a future stage needs attention. When the
      // current stage is already Strong, the "maintain and move forward" text
      // already handles the transition — adding "strengthening…" there would
      // contradict it.
      if (concernStage && stageCfg.bridging && severity !== 'strong') {
        const concernName = STAGE_META[concernStage].name;
        const bridge = stageCfg.bridging.replace('{concernStage}', concernName);
        recommendationText = `${recommendationText} ${bridge}`;
      }
    } else if (isFuture) {
      recommendationType = 'future_priority';
      recommendationText = stageCfg.future_priority[severity] || stageCfg.future_priority.needs_attention;
    } else {
      // Past / completed stage — keep protecting it.
      recommendationType = 'maintain';
      recommendationText = stageCfg.diagnosis.strong;
    }

    return {
      stage,
      name: STAGE_META[stage].name,
      number: STAGE_META[stage].number,
      score,
      severity,
      severityLabel,
      diagnosis,
      recommendationType,
      recommendationText,
      tools,
      isCurrent,
    };
  });

  const allStrong = STAGE_ORDER.every((s) => severities[s] === 'strong');
  const startingPoint = allStrong
    ? cfg.starting_point_all_strong_template.replace('{currentStage}', STAGE_META[currentActionStage].name)
    : cfg.starting_point_template.replace('{currentStage}', STAGE_META[currentActionStage].name);

  return {
    phases,
    currentActionStage,
    currentActionName: STAGE_META[currentActionStage].name,
    startingPoint,
    concernStage,
    concernSeverity,
  };
}

// Severity -> tailwind color classes for display.
export const SEVERITY_STYLES = {
  strong: { text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
  stable: { text: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700 border-blue-200', bar: 'bg-blue-500' },
  needs_attention: { text: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
  critical: { text: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-500' },
};