import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Lightbulb, ExternalLink, ArrowRight } from 'lucide-react';
import { extractDimensions, getHealthGaps, CANONICAL_DIMENSIONS } from '@/lib/healthDimensions';

export default function ResourceRecommendations({ orgId }) {
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-rec', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: tensionPulses = [] } = useQuery({
    queryKey: ['tensionPulses-rec', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources-rec'],
    queryFn: () => base44.entities.Resource.list(),
  });

  // Compute health gaps from latest assessment + tension pulse
  const latestAssessment = assessments[0];
  const latestPulse = tensionPulses[0];
  const records = [];
  if (latestAssessment) records.push({ entityName: 'Assessment', record: latestAssessment });
  if (latestPulse) records.push({ entityName: 'TensionPulse', record: latestPulse });

  // Use extractDimensions to get a combined view
  const allDims = {};
  records.forEach(({ entityName, record }) => {
    const dims = extractDimensions(entityName, record);
    Object.entries(dims).forEach(([key, value]) => {
      if (!allDims[key]) allDims[key] = [];
      allDims[key].push(value);
    });
  });

  const avgDims = {};
  Object.entries(allDims).forEach(([key, values]) => {
    avgDims[key] = parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1));
  });

  const gaps = getHealthGaps(avgDims, 5);

  // Find resources matching the gap dimensions
  const recommendations = gaps.length > 0
    ? resources.filter(r => gaps.some(g => r.health_dimension === g.key))
    : [];

  if (gaps.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Recommended Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No health gaps detected. Your team is in a healthy place!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Recommended Resources</CardTitle>
        </div>
        <Link to="/resources" className="text-xs text-primary hover:underline flex items-center gap-1">
          Browse all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health gaps */}
        <div className="flex flex-wrap gap-2">
          {gaps.map(gap => (
            <Badge key={gap.key} className="bg-red-50 text-red-700 border border-red-100 text-xs">
              {gap.label}: {gap.value}/10
            </Badge>
          ))}
        </div>

        {/* Recommended resources */}
        {recommendations.length > 0 ? (
          <div className="grid gap-2">
            {recommendations.slice(0, 4).map(resource => (
              <div key={resource.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{resource.title}</p>
                  {resource.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">{resource.stage}</Badge>
                    <Badge variant="secondary" className="text-xs capitalize">{resource.type}</Badge>
                    {(resource.url || resource.file_url) && (
                      <a href={resource.url || resource.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No resources tagged for these health areas yet. Check the full library for more.</p>
        )}
      </CardContent>
    </Card>
  );
}