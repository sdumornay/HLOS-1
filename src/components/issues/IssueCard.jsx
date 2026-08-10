import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart, Cog, Pencil, Trash2, ChevronDown, ChevronUp, User, Calendar,
  MessageSquare, CheckCircle2, AlertTriangle, Shield, Compass, Rocket, Leaf,
  Handshake, BookOpen, Lightbulb, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STAGE_ICONS = { stabilize: Shield, align: Compass, execute: Rocket, sustain: Leaf };

const RELATIONAL_TOOLS = [
  { label: 'Nonflict', description: 'Reframe conflict as a shared problem rather than an us-vs-them fight.' },
  { label: 'Healthy Communication', description: 'Use intentional, respectful dialogue practices to rebuild understanding.' },
  { label: 'NVC (Nonviolent Communication)', description: 'Express observations, feelings, needs, and requests without blame.' },
  { label: 'Facilitated Conversation', description: 'Bring in a neutral facilitator to guide the difficult conversation.' },
  { label: 'Conflict Coaching', description: 'One-on-one coaching to help a leader navigate a relational breakdown.' },
];

const OPERATIONAL_STEPS = [
  { label: 'Define the Problem', description: 'State the issue clearly and specifically — what is broken or blocked?' },
  { label: 'Identify the Root Issue', description: 'Look past symptoms to find the underlying cause.' },
  { label: 'Make a Decision', description: 'Decide what will be done and who decides it.' },
  { label: 'Assign Ownership', description: 'Name a single owner accountable for the resolution.' },
  { label: 'Establish a Deadline', description: 'Set a realistic due date for resolution.' },
  { label: 'Track Resolution', description: 'Follow up regularly until the issue is closed.' },
];

export default function IssueCard({ issue, onEdit, onDelete, onStatusChange, canDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isRelational = issue.classification === 'relational';
  const isOverdue = issue.status !== 'resolved' && issue.status !== 'closed' && issue.date_identified &&
    new Date(issue.date_identified) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const StageIcon = STAGE_ICONS[issue.stage] || Shield;

  const priorityVariant = {
    critical: 'destructive', high: 'destructive', medium: 'secondary', low: 'outline'
  };
  const statusVariant = {
    open: 'outline', in_progress: 'secondary', resolved: 'default', closed: 'secondary'
  };

  return (
    <Card className={cn(
      "border-l-4 transition-shadow hover:shadow-md",
      isRelational ? "border-l-rose-500" : "border-l-blue-500",
      isOverdue && "ring-1 ring-amber-300"
    )}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={cn(
                "text-xs gap-1",
                isRelational ? "text-rose-600 border-rose-300" : "text-blue-600 border-blue-300"
              )}>
                {isRelational ? <Heart className="h-3 w-3" /> : <Cog className="h-3 w-3" />}
                {isRelational ? 'Relational' : 'Operational'}
              </Badge>
              {issue.classification_overridden && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overridden
                </Badge>
              )}
              <Badge variant={priorityVariant[issue.priority]} className="text-xs capitalize">
                {issue.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-sm text-foreground truncate">{issue.title}</h4>
          </div>

          {/* Quick status + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={issue.status}
              onValueChange={(v) => onStatusChange(issue.id, v)}
            >
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
          {issue.identified_by && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {issue.identified_by}</span>
          )}
          {issue.owner && (
            <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {issue.owner}</span>
          )}
          {issue.date_identified && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(issue.date_identified), 'MMM d, yyyy')}</span>
          )}
          <span className="flex items-center gap-1"><StageIcon className="h-3 w-3" /> {issue.stage}</span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Description */}
            {issue.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{issue.description}</p>
              </div>
            )}

            {/* Classification-based routing */}
            {isRelational ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5" /> Recommended Stabilize Tools
                </p>
                <div className="space-y-1.5">
                  {RELATIONAL_TOOLS.map((tool, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-rose-800">{tool.label}:</span>{' '}
                      <span className="text-rose-700/80">{tool.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Resolution Path
                </p>
                <ol className="space-y-1.5">
                  {OPERATIONAL_STEPS.map((step, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="font-bold text-blue-600">{i + 1}.</span>
                      <div>
                        <span className="font-medium text-blue-800">{step.label}</span>{' '}
                        <span className="text-blue-700/80">— {step.description}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Notes */}
            {issue.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{issue.notes}</p>
              </div>
            )}

            {/* Resolution */}
            {issue.resolution && (
              <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Resolution</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{issue.resolution}</p>
                {issue.date_resolved && (
                  <p className="text-xs text-emerald-600 mt-1">Resolved on {format(new Date(issue.date_resolved), 'MMM d, yyyy')}</p>
                )}
              </div>
            )}

            {/* Edit/Delete */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => onEdit(issue)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              {canDelete && (
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(issue)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}