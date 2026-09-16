import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, User, Target, Sparkles } from 'lucide-react';
import EditOrganizationDialog from '@/components/organizations/EditOrganizationDialog';

const TYPE_LABELS = {
  church: 'Church',
  ministry: 'Ministry',
  nonprofit: 'Nonprofit',
  other: 'Other',
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {value || <span className="text-muted-foreground/60 italic">Not set yet — tap Edit Info to add</span>}
        </p>
      </div>
    </div>
  );
}

export default function OrganizationProfileCard({ org }) {
  if (!org) return null;
  const location = [org.city, org.state].filter(Boolean).join(', ');

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Profile</p>
              <p className="text-[10px] text-muted-foreground">The details you entered during setup</p>
            </div>
          </div>
          <EditOrganizationDialog
            org={org}
            buttonVariant="outline"
            buttonClassName="text-foreground hover:bg-muted gap-1.5"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">{org.name}</h3>
            {org.type && <Badge variant="secondary">{TYPE_LABELS[org.type] || org.type}</Badge>}
          </div>

          <InfoRow icon={MapPin} label="Location" value={location} />
          <InfoRow icon={User} label="Lead Pastor" value={org.lead_pastor_name} />
          <InfoRow icon={Target} label="Mission" value={org.mission} />
          <InfoRow icon={Sparkles} label="Desired Outcomes" value={org.desired_outcomes} />
        </div>
      </CardContent>
    </Card>
  );
}