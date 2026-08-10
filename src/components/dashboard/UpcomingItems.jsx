import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { CalendarClock, ArrowRight, Video, ClipboardList, RotateCcw, CheckSquare } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const TYPE_ICONS = {
  session: Video,
  assessment: ClipboardList,
  review: RotateCcw,
  deadline: CheckSquare,
};

const TYPE_COLORS = {
  session: 'text-blue-600 bg-blue-50',
  assessment: 'text-purple-600 bg-purple-50',
  review: 'text-amber-600 bg-amber-50',
  deadline: 'text-red-600 bg-red-50',
};

export default function UpcomingItems({ sessions = [], actions = [], quarterlyReviews = [] }) {
  const now = new Date();

  // Upcoming sessions (future dates)
  const upcomingSessions = sessions
    .filter(s => s.date && isAfter(parseISO(s.date), now))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
    .map(s => ({
      type: 'session',
      title: s.title,
      date: s.date,
      sub: s.stage ? `Stage: ${s.stage}` : 'Team session',
      link: '/sessions',
    }));

  // Upcoming action deadlines (future due dates, not completed)
  const upcomingDeadlines = actions
    .filter(a => a.status !== 'completed' && a.due_date && isAfter(parseISO(a.due_date), now))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3)
    .map(a => ({
      type: 'deadline',
      title: a.title,
      date: a.due_date,
      sub: `Due · ${a.owner || a.owner_email || 'Unassigned'}`,
      link: '/actions',
    }));

  // Next quarterly review (compute next quarter end)
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const nextQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
  const upcomingReviews = [{
    type: 'review',
    title: `Q${currentQuarter} Quarterly Review`,
    date: nextQuarterEnd.toISOString().split('T')[0],
    sub: 'Quarterly reset reflection',
    link: '/sustain',
  }];

  const items = [...upcomingSessions, ...upcomingDeadlines, ...upcomingReviews]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Upcoming</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nothing scheduled. Use this time to plan ahead.</p>
        ) : (
          items.map((item, i) => {
            const Icon = TYPE_ICONS[item.type] || CalendarClock;
            const colorClass = TYPE_COLORS[item.type] || 'text-muted-foreground bg-muted';
            const daysUntil = Math.ceil((new Date(item.date) - now) / (1000 * 60 * 60 * 24));
            return (
              <Link
                key={i}
                to={item.link}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold">{format(new Date(item.date), 'MMM d')}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}