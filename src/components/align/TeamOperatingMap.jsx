import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLES = {
  head: { label: 'Head', color: 'bg-cyan-50 border-cyan-300 text-cyan-800', dot: 'bg-cyan-500', emoji: '🧠', desc: 'Analytical & Strategic' },
  heart: { label: 'Heart', color: 'bg-rose-50 border-rose-300 text-rose-800', dot: 'bg-rose-500', emoji: '❤️', desc: 'Empathetic & Relational' },
  gut: { label: 'Gut', color: 'bg-amber-50 border-amber-300 text-amber-800', dot: 'bg-amber-500', emoji: '🔥', desc: 'Intuitive & Decisive' },
  feet: { label: 'Feet', color: 'bg-green-50 border-green-300 text-green-800', dot: 'bg-green-500', emoji: '👟', desc: 'Practical & Action-Oriented' },
};

// Interaction dynamics between workstyle pairs
const INTERACTIONS = {
  head_heart: {
    title: 'Head ↔ Heart',
    dynamic: 'Analysis meets empathy. Heads bring logic, Hearts bring people-sense.',
    friction: 'Hearts may feel Heads are cold; Heads may feel Hearts are slow to decide.',
    tip: 'Let Hearts frame the human impact, then let Heads build the framework.',
  },
  head_gut: {
    title: 'Head ↔ Gut',
    dynamic: 'Analysis meets intuition. Heads study the data, Guts sense the answer.',
    friction: 'Guts may feel Heads overthink; Heads may feel Guts jump too fast.',
    tip: 'Use the Gut instinct as a hypothesis, let the Head validate it.',
  },
  head_feet: {
    title: 'Head ↔ Feet',
    dynamic: 'Strategy meets execution. Heads plan, Feet do.',
    friction: 'Feet may feel Heads are all talk; Heads may feel Feet act without thinking.',
    tip: 'Set a clear plan, then let Feet run. Check in at milestones, not every step.',
  },
  heart_gut: {
    title: 'Heart ↔ Gut',
    dynamic: 'Empathy meets decisiveness. Hearts protect people, Guts drive decisions.',
    friction: 'Guts may feel Hearts slow things down; Hearts may feel Guts are blunt.',
    tip: 'Give Hearts time to process before the Gut decides. Name the tension openly.',
  },
  heart_feet: {
    title: 'Heart ↔ Feet',
    dynamic: 'Care meets momentum. Hearts nurture, Feet push forward.',
    friction: 'Feet may feel Hearts are overly cautious; Hearts may feel Feet run over people.',
    tip: 'Feet should check the relational cost before acting; Hearts should name a deadline.',
  },
  gut_feet: {
    title: 'Gut ↔ Feet',
    dynamic: 'Instinct meets action. Guts decide, Feet execute immediately.',
    friction: 'May act too quickly without enough analysis or buy-in.',
    tip: 'Pause to ask: "Do we have enough input to go?" before charging ahead.',
  },
};

const getInteractionKey = (a, b) => {
  const pair = [a, b].sort().join('_');
  return INTERACTIONS[pair] ? pair : null;
};

export default function TeamOperatingMap({ orgId }) {
  const { data: assessments = [] } = useQuery({
    queryKey: ['workstyleAssessments', orgId],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const byStyle = (style) => assessments.filter(a => a.workstyle_type === style);
  const presentStyles = Object.keys(STYLES).filter(s => byStyle(s).length > 0);

  // Find all interaction pairs present on the team
  const activePairs = [];
  for (let i = 0; i < presentStyles.length; i++) {
    for (let j = i + 1; j < presentStyles.length; j++) {
      const key = getInteractionKey(presentStyles[i], presentStyles[j]);
      if (key) activePairs.push(key);
    }
  }

  // Generate team-wide recommendations
  const recommendations = [];
  if (presentStyles.length <= 1) {
    recommendations.push('This team is homogeneous. Consider adding diversity in workstyles for richer perspective.');
  }
  if (presentStyles.includes('head') && presentStyles.includes('feet')) {
    recommendations.push('You have both planners (Head) and doers (Feet). Bridge them with clear milestones so analysis turns into action.');
  }
  if (presentStyles.includes('gut') && presentStyles.includes('heart')) {
    recommendations.push('Your decisive Guts and empathetic Hearts need a shared pause point — create space for Hearts to process before Guts decide.');
  }
  if (!presentStyles.includes('head')) {
    recommendations.push('No Head styles present. Ensure someone is analyzing data and thinking strategically before decisions.');
  }
  if (!presentStyles.includes('feet')) {
    recommendations.push('No Feet styles present. Ensure someone is driving execution and tracking follow-through.');
  }
  if (presentStyles.length >= 3) {
    recommendations.push('Your team has rich workstyle diversity. Name how you will leverage each style rather than defaulting to the loudest voice.');
  }

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-500" />
          <CardTitle className="text-base font-semibold">Team Operating Map</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Complete workstyle assessments to see how your team's styles interact.
          </p>
        ) : (
          <>
            {/* Quadrant grid — one per workstyle */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(STYLES).map(([key, style]) => {
                const members = byStyle(key);
                if (members.length === 0) {
                  return (
                    <div key={key} className="rounded-lg border border-dashed border-border/40 p-3 opacity-40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{style.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold">{style.label}</p>
                          <p className="text-[10px] text-muted-foreground">{style.desc}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">No members</p>
                    </div>
                  );
                }
                return (
                  <div key={key} className={cn('rounded-lg border-2 p-3', style.color)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{style.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{style.label}</p>
                        <p className="text-[10px] opacity-70">{style.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {members.map(m => (
                        <div key={m.id} className="text-xs bg-white/60 rounded px-2 py-1">
                          <p className="font-medium truncate">{m.member_name}</p>
                          {m.secondary_type && (
                            <p className="text-[10px] opacity-70">+ {STYLES[m.secondary_type]?.label}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interaction dynamics */}
            {activePairs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Interaction Dynamics
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {activePairs.map(key => {
                    const interaction = INTERACTIONS[key];
                    return (
                      <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-sm font-semibold mb-1">{interaction.title}</p>
                        <p className="text-xs text-foreground mb-1">{interaction.dynamic}</p>
                        <p className="text-xs text-amber-600 mb-1.5">
                          <span className="font-medium">Friction:</span> {interaction.friction}
                        </p>
                        <p className="text-xs text-emerald-600">
                          <span className="font-medium">Tip:</span> {interaction.tip}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Recommendations for Working Together
              </p>
              <ul className="space-y-1.5">
                {recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-violet-800 flex gap-2">
                    <span className="font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick reference: communication & decision tendencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presentStyles.map(styleKey => {
                const members = byStyle(styleKey);
                const first = members[0];
                return (
                  <div key={styleKey} className="p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{STYLES[styleKey].emoji}</span>
                      <p className="text-sm font-semibold">{STYLES[styleKey].label} Style</p>
                    </div>
                    {first?.communication_preference && (
                      <p className="text-xs mb-1"><span className="font-medium">Communicates:</span> {first.communication_preference}</p>
                    )}
                    {first?.decision_style && (
                      <p className="text-xs mb-1"><span className="font-medium">Decides:</span> {first.decision_style}</p>
                    )}
                    {first?.stress_response && (
                      <p className="text-xs"><span className="font-medium">Under stress:</span> {first.stress_response}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}