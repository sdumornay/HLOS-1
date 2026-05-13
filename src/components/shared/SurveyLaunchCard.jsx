import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, X } from 'lucide-react';

export default function SurveyLaunchCard({ title, description, url, icon: Icon, accentColor = 'text-primary', badgeLabel }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5 flex items-start gap-4">
          {Icon && (
            <div className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${accentColor}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{title}</p>
              {badgeLabel && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground border border-accent/30">
                  {badgeLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex-shrink-0 gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Launch
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-5 py-3 border-b flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors mr-6">
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </a>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={url}
              title={title}
              className="w-full h-full border-none"
              allow="fullscreen"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}