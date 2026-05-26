import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const STYLES = {
  head:  { label: 'Head',  emoji: '🧠', color: 'bg-cyan-50 border-cyan-200',  badge: 'bg-cyan-100 text-cyan-800' },
  heart: { label: 'Heart', emoji: '❤️', color: 'bg-rose-50 border-rose-200',  badge: 'bg-rose-100 text-rose-800' },
  gut:   { label: 'Gut',   emoji: '🔥', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  feet:  { label: 'Feet',  emoji: '👟', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
};

const DESCRIPTIONS = {
  head:  'Analytical & Strategic',
  heart: 'Empathetic & Relational',
  gut:   'Intuitive & Decisive',
  feet:  'Practical & Action-Oriented',
};

export default function WorkstyleCard({ userEmail }) {
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['workstyle-mine', userEmail],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ member_email: userEmail }, '-created_date', 1),
    enabled: !!userEmail,
  });

  const latest = assessments[0];
  const primary = latest?.workstyle_type;
  const secondary = latest?.secondary_type;
  const style = STYLES[primary];

  if (isLoading) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">My Workstyle</CardTitle>
        <Link to="/assessments" className="text-xs text-primary hover:underline flex items-center gap-1">
          {latest ? 'View all' : 'Take assessment'} <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {latest && style ? (
          <div className={`rounded-xl border p-4 ${style.color} flex items-center gap-4`}>
            <span className="text-4xl">{style.emoji}</span>
            <div>
              <p className="font-bold text-lg">{style.label}</p>
              <p className="text-sm text-muted-foreground">{DESCRIPTIONS[primary]}</p>
              {secondary && STYLES[secondary] && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground">Secondary:</span>
                  <Badge className={`text-xs border-0 ${STYLES[secondary].badge}`}>
                    {STYLES[secondary].emoji} {STYLES[secondary].label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No workstyle assessment yet.{' '}
            <Link to="/assessments" className="text-primary hover:underline">Take it now →</Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}