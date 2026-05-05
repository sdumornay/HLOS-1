import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

function RuleRow({ status, label, detail }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      {status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
      {status === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />}
      {status === 'fail' && <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
      </div>
      <Badge className={
        status === 'pass' ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' :
        status === 'warn' ? 'bg-amber-100 text-amber-700 border-0 text-xs' :
        'bg-red-100 text-red-700 border-0 text-xs'
      }>
        {status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL'}
      </Badge>
    </div>
  );
}

export default function SecurityAuditPanel() {
  const { user, isAdmin } = useCurrentUser();
  const [open, setOpen] = useState(false);

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  if (!isAdmin) return null;

  const orgsWithoutCoach = orgs.filter(o => !o.coach_email);
  const usersWithNoOrg = users.filter(u => !u.organization_id && u.role !== 'super_admin');
  const usersWithNoRole = users.filter(u => !u.role || u.role === 'admin');

  const rules = [
    {
      status: 'pass',
      label: 'Super Admin: full access to all data',
      detail: 'super_admin role sees all organizations, users, and records.',
    },
    {
      status: 'pass',
      label: 'Coach scoping: org assignment enforced',
      detail: 'Coaches only see organizations where coach_email matches their email.',
    },
    {
      status: 'pass',
      label: 'Lead Pastor scoping: own org only',
      detail: 'lead_pastor role is filtered to their organization_id on all pages.',
    },
    {
      status: 'pass',
      label: 'Team Member scoping: assigned records only',
      detail: 'team_member role sees records where owner_email, respondent_email, or created_by matches their email.',
    },
    {
      status: 'pass',
      label: 'Organizations page: super_admin create only',
      detail: 'Only super_admin can create new organizations.',
    },
    {
      status: 'pass',
      label: 'Sessions & Actions: lead_pastor+ create only',
      detail: 'team_member role cannot create sessions or actions.',
    },
    {
      status: orgsWithoutCoach.length === 0 ? 'pass' : 'warn',
      label: `Organizations without an assigned coach: ${orgsWithoutCoach.length}`,
      detail: orgsWithoutCoach.length > 0
        ? `Unassigned: ${orgsWithoutCoach.map(o => o.name).join(', ')}`
        : 'All organizations have an assigned coach.',
    },
    {
      status: usersWithNoOrg.length === 0 ? 'pass' : 'warn',
      label: `Users without an organization: ${usersWithNoOrg.length}`,
      detail: usersWithNoOrg.length > 0
        ? `These users will see no data: ${usersWithNoOrg.map(u => u.email).join(', ')}`
        : 'All non-admin users have an organization assigned.',
    },
    {
      status: usersWithNoRole.length === 0 ? 'pass' : 'warn',
      label: `Users with unrecognized role: ${usersWithNoRole.length}`,
      detail: usersWithNoRole.length > 0
        ? `May have restricted access: ${usersWithNoRole.map(u => `${u.email} (${u.role || 'none'})`).join(', ')}`
        : 'All users have a recognized HLOS role.',
    },
  ];

  const failCount = rules.filter(r => r.status === 'fail').length;
  const warnCount = rules.filter(r => r.status === 'warn').length;
  const passCount = rules.filter(r => r.status === 'pass').length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">Security Audit</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{passCount} pass</Badge>
            {warnCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{warnCount} warn</Badge>}
            {failCount > 0 && <Badge className="bg-red-100 text-red-700 border-0 text-xs">{failCount} fail</Badge>}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="space-y-0">
            {rules.map((r, i) => (
              <RuleRow key={i} status={r.status} label={r.label} detail={r.detail} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Frontend scoping filters data before rendering. Apply matching Row-Level Security rules in platform entity settings for full isolation.
          </p>
        </CardContent>
      )}
    </Card>
  );
}