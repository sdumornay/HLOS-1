import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';

export default function TeamMemberWelcome({ userName, hasAssessments }) {
  if (hasAssessments) return null;

  const firstName = userName?.split(' ')[0];

  return (
    <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
          <Heart className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Start with a quick health check — it takes less than 2 minutes and helps your team understand where things stand.
          </p>
        </div>
        <Link to="/assessments" className="flex-shrink-0">
          <Button size="sm">Start <ArrowRight className="h-3 w-3 ml-1" /></Button>
        </Link>
      </CardContent>
    </Card>
  );
}