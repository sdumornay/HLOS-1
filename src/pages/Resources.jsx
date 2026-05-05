import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, Video, Newspaper, ClipboardList, ExternalLink } from 'lucide-react';

const TYPE_ICONS = { guide: BookOpen, template: FileText, video: Video, article: Newspaper, worksheet: ClipboardList };

export default function Resources() {
  const [stageFilter, setStageFilter] = useState('all');

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const filtered = stageFilter === 'all' ? resources : resources.filter(r => r.stage === stageFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1">Guides, templates, and tools for each stage</p>
      </div>

      <Tabs value={stageFilter} onValueChange={setStageFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="stabilize">Stabilize</TabsTrigger>
          <TabsTrigger value="align">Align</TabsTrigger>
          <TabsTrigger value="execute">Execute</TabsTrigger>
          <TabsTrigger value="sustain">Sustain</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(resource => {
          const Icon = TYPE_ICONS[resource.type] || BookOpen;
          return (
            <Card key={resource.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{resource.title}</p>
                    {resource.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs capitalize">{resource.stage}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{resource.type}</Badge>
                    </div>
                  </div>
                </div>
                {(resource.url || resource.file_url) && (
                  <a
                    href={resource.url || resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                  >
                    <ExternalLink className="h-3 w-3" /> Open Resource
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="border-border/50 col-span-full">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No resources available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}