import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ScoreboardSection({ orgId }) {
  const navigate = useNavigate();
  const { data: scoreboards = [] } = useQuery({
    queryKey: ['leadershipHealthScoreboard', orgId],
    queryFn: () => base44.entities.LeadershipHealthScoreboard.filter({ organization_id: orgId }, '-created_date', 5),
    enabled: !!orgId,
  });

  const completed = scoreboards.length > 0;

  return (
    <Card className={completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5'}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              {completed && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Complete</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              A 16-question diagnostic across the four HLOS stages. Takes about 10 minutes.
              {completed ? ' Your baseline is on file.' : ' This is the second step in your diagnostic journey.'}
            </p>
          </div>
          <div className="flex-shrink-0">
            {!completed ? (
              <Button size="sm" onClick={() => navigate('/scoreboard')}>
                Take Scoreboard <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => navigate('/scoreboard')}>
                View Results <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}