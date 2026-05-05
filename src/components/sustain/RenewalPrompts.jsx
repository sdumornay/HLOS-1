import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

const RENEWAL_PROMPTS = [
  {
    category: 'Covenant Renewal',
    prompts: [
      "When did we last revisit our leadership covenant together?",
      "Are there any commitments we made that have quietly slipped? Name them.",
      "What would it look like to recommit to one another this quarter?",
    ],
  },
  {
    category: 'Culture Reset',
    prompts: [
      "Is there an elephant in the room the team has been avoiding? Surface it with curiosity, not accusation.",
      "What behavior have we normalized that doesn't actually reflect our values?",
      "Who on the team needs to feel more seen, heard, or celebrated right now?",
    ],
  },
  {
    category: 'Vision Alignment',
    prompts: [
      "Can every team member articulate the top 3 organizational priorities right now without looking at a doc?",
      "Where do we sense drift — between what we say matters and how we actually spend our time?",
      "What would it look like for us to lead with more courage next quarter?",
    ],
  },
  {
    category: 'Personal Renewal',
    prompts: [
      "How are you doing — really? What's draining you most right now?",
      "What's one thing that would make your role feel more sustainable?",
      "If you could change one thing about how this team operates, what would it be?",
    ],
  },
];

export default function RenewalPrompts({ orgId }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);

  const { data: pulses = [] } = useQuery({
    queryKey: ['healthPulses', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const renewalNeeded = pulses.some(p => p.renewal_needed);
  const cat = RENEWAL_PROMPTS[activeCategory];
  const prompt = cat.prompts[promptIdx];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Renewal & Reset Prompts</CardTitle>
        </div>
        {renewalNeeded && (
          <Badge className="bg-amber-100 text-amber-700 text-xs border-0">Renewal Flagged</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {RENEWAL_PROMPTS.map((c, i) => (
            <button
              key={i}
              onClick={() => { setActiveCategory(i); setPromptIdx(0); }}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeCategory === i ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              {c.category}
            </button>
          ))}
        </div>

        {/* Prompt display */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 min-h-[100px] flex flex-col justify-between gap-4">
          <p className="text-sm font-medium leading-relaxed text-foreground">"{prompt}"</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{promptIdx + 1} of {cat.prompts.length}</span>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline"
                onClick={() => setPromptIdx(i => (i - 1 + cat.prompts.length) % cat.prompts.length)}
              >
                ←
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => setPromptIdx(i => (i + 1) % cat.prompts.length)}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Next
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Use these prompts to open your next team or leadership meeting and foster honest dialogue.</p>
      </CardContent>
    </Card>
  );
}