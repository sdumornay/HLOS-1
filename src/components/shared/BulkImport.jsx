import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TEMPLATES = {
  team_members: {
    label: 'Team Members',
    headers: 'full_name,email,role',
    example: 'John Smith,john@church.org,team_member\nJane Doe,jane@church.org,lead_pastor',
    description: 'Import team members. Role must be: super_admin, coach, lead_pastor, or team_member.',
  },
  actions: {
    label: 'Actions',
    headers: 'title,description,owner_email,priority,stage,due_date',
    example: 'Update Budget,Review Q2 budget,john@church.org,high,stabilize,2026-06-01\nTeam Retreat,Plan annual retreat,jane@church.org,medium,align,2026-07-15',
    description: 'Import action items. Priority: low/medium/high/critical. Stage: stabilize/align/execute/sustain.',
  },
  assessments: {
    label: 'Assessments',
    headers: 'respondent_email,type,trust,safety,clarity,accountability,meeting_effectiveness,conflict_intensity',
    example: 'john@church.org,pulse,8,7,9,6,8,3',
    description: 'Import assessments. All scores 1-10. Type: initial/pulse/quarterly/exit.',
  },
};

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

export default function BulkImport({ organizationId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('team_members');
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: async ({ type, rows }) => {
      const results = { success: 0, failed: 0, errors: [] };
      for (const row of rows) {
        const record = { ...row, organization_id: organizationId };
        // Parse numeric fields for assessments
        if (type === 'assessments') {
          ['trust', 'safety', 'clarity', 'accountability', 'meeting_effectiveness', 'conflict_intensity'].forEach(k => {
            if (record[k]) record[k] = parseFloat(record[k]);
          });
          const scores = ['trust', 'safety', 'clarity', 'accountability', 'meeting_effectiveness', 'conflict_intensity']
            .map(k => record[k] || 0);
          record.overall_health = parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1));
        }
        if (type === 'team_members') {
          try {
            await base44.users.inviteUser(record.email, record.role || 'team_member');
            results.success++;
          } catch (e) {
            results.failed++;
            results.errors.push(`${record.email}: ${e.message}`);
          }
          continue;
        }
        const entity = type === 'actions' ? base44.entities.Action : base44.entities.Assessment;
        try {
          await entity.create(record);
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${e.message}`);
        }
      }
      return results;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const handleImport = () => {
    const rows = parseCSV(csv);
    if (rows.length === 0) return;
    setResult(null);
    importMutation.mutate({ type: tab, rows });
  };

  const tmpl = TEMPLATES[tab];

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); setResult(null); setCsv(''); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" /> Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Import</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={v => { setTab(v); setCsv(''); setResult(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="team_members" className="flex-1 text-xs">Team Members</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1 text-xs">Actions</TabsTrigger>
            <TabsTrigger value="assessments" className="flex-1 text-xs">Assessments</TabsTrigger>
          </TabsList>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <TabsContent key={key} value={key} className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-mono text-muted-foreground mb-1 font-semibold">Format:</p>
                <p className="text-xs font-mono">{t.headers}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{t.example.split('\n')[0]}</p>
              </div>
              <textarea
                className="w-full h-32 rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={`Paste CSV here...\n\n${t.headers}\n${t.example}`}
                value={csv}
                onChange={e => setCsv(e.target.value)}
              />
            </TabsContent>
          ))}
        </Tabs>

        {result && (
          <div className={`rounded-lg p-3 text-xs ${result.failed === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {result.failed === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {result.success} imported successfully, {result.failed} failed
            </div>
            {result.errors.map((e, i) => <p key={i} className="text-xs opacity-80">{e}</p>)}
          </div>
        )}

        <Button onClick={handleImport} disabled={!csv.trim() || importMutation.isPending} className="w-full">
          {importMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : 'Import Data'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}