import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Download, TrendingUp, AlertCircle, Info, Heart, Shield } from 'lucide-react';
import { DIMENSIONS, getInterpretation, getBarColor, getToneClass, getStrengthsAndConcerns } from '@/lib/orgSnapshotScoring';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportElementToPDF } from '@/lib/exportPDF';
import { useToast } from '@/components/ui/use-toast';

export default function OrgSnapshotResults({ scores, record, orgName }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const resultsRef = useRef(null);
  const [exporting, setExporting] = React.useState(false);

  const overall = scores.overall_score;
  const interp = getInterpretation(overall);
  const tone = getToneClass(interp.tone);
  const { strongest, weakest } = getStrengthsAndConcerns(scores);

  const chartData = DIMENSIONS.map(d => ({
    name: d.label,
    shortName: d.shortLabel,
    score: scores[d.key] ?? 0,
  })).sort((a, b) => b.score - a.score);

  const handleExport = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      await exportElementToPDF({
        element: resultsRef.current,
        filename: 'organizational-health-snapshot.pdf',
      });
    } catch {
      toast({ title: 'Export failed', description: 'Could not generate PDF.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div ref={resultsRef} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <TrendingUp className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Your Organizational Health Snapshot</h1>
          <p className="text-sm text-muted-foreground">
            {orgName ? `${orgName} — ` : ''}Submitted {record?.created_date ? format(new Date(record.created_date), 'MMM d, yyyy') : 'today'}
          </p>
        </div>

        {/* Overall score card */}
        <Card className={cn('border-2', tone.border)}>
          <CardContent className="p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Overall Organizational Health
            </p>
            <p className={cn('text-5xl font-bold', tone.text)}>
              {overall.toFixed(2)}<span className="text-2xl text-muted-foreground">/5</span>
            </p>
            <div className={cn('inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-semibold', tone.bg, tone.text)}>
              {interp.label}
            </div>
          </CardContent>
        </Card>

        {/* Dimension chart */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-1">Six Dimensions of Organizational Health</p>
            <p className="text-xs text-muted-foreground mb-4">Higher bars indicate stronger areas. Sorted from strongest to weakest.</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}/5`, 'Score']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                  <LabelList dataKey="score" position="right" formatter={(v) => Number(v).toFixed(1)} style={{ fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Dimension list with interpretation */}
            <div className="mt-4 space-y-2">
              {DIMENSIONS.map(d => {
                const score = scores[d.key] ?? 0;
                const dimInterp = getInterpretation(score);
                const dimTone = getToneClass(dimInterp.tone);
                return (
                  <div key={d.key} className="flex items-center justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('font-bold', dimTone.text)}>{score.toFixed(2)}/5</p>
                      <p className="text-xs text-muted-foreground">{dimInterp.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* What Appears Strong */}
        {strongest.length > 0 && (
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">What Appears Strong</p>
              </div>
              <div className="space-y-2">
                {strongest.map(s => (
                  <div key={s.key}>
                    <p className="text-sm font-medium">{s.label} — {s.score.toFixed(2)}/5</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.score >= 4.2
                        ? 'This is a clear strength. Your organization is functioning well in this area, and it can serve as a foundation to build on.'
                        : 'This area is generally healthy. There is a solid base here, with room to strengthen further.'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What Needs Attention */}
        {weakest.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-700">What Needs Attention</p>
              </div>
              <div className="space-y-2">
                {weakest.map(s => (
                  <div key={s.key}>
                    <p className="text-sm font-medium">{s.label} — {s.score.toFixed(2)}/5</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.score <= 1.79
                        ? 'This area is under significant strain. It would benefit from focused attention and support.'
                        : s.score <= 2.59
                          ? 'This area is experiencing noticeable strain. It is worth exploring what is contributing to the challenges here.'
                          : 'This area has some gaps worth paying attention to. It is not yet a concern, but it is where the most growth is possible.'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What This Means */}
        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">What This Means</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This snapshot reflects your current perspective on the organization. It is a starting point,
              not a final diagnosis. Other leaders may see the organization differently. As additional
              members of your leadership team participate in HLOS, those perspectives will help create a
              fuller picture of organizational health.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transition to Stabilize / Scoreboard */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-wider text-accent">Begin the Stabilize Phase</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You've taken a broad look at the health of your organization. Now it's time to look more closely
                at the leadership team shaping that environment.
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Your first step in the Stabilize phase is the Leadership Health Scoreboard. It will help you
                explore how your leadership team is functioning in areas such as trust, communication, alignment,
                conflict, and accountability.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate('/scoreboard')}>
            Begin Stabilize: Take the Leadership Health Scoreboard <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-1" /> {exporting ? 'Generating...' : 'Export PDF'}
        </Button>
      </div>
    </div>
  );
}