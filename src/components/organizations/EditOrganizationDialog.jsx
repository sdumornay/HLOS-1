import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function EditOrganizationDialog({ org }) {
  const { isLeadPastor, isAdmin, isCoach } = useCurrentUser();
  const canEdit = isLeadPastor || isAdmin || isCoach;
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || '',
        type: org.type || 'church',
        city: org.city || '',
        state: org.state || '',
        lead_pastor_name: org.lead_pastor_name || '',
        mission: org.mission || '',
        desired_outcomes: org.desired_outcomes || '',
      });
    }
  }, [org, open]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateOrganization', { id: org.id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['org-journey', org.id] });
      setOpen(false);
      toast.success('Church information updated.');
    },
    onError: (err) => toast.error('Failed to save: ' + (err?.message || 'Unknown error')),
  });

  if (!canEdit || !org) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
        title="Edit church information"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit Info
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Church Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Church or organization name"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="church">Church</SelectItem>
                  <SelectItem value="ministry">Ministry</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city || ''}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Lead Pastor Name</Label>
              <Input
                value={form.lead_pastor_name || ''}
                onChange={e => setForm(f => ({ ...f, lead_pastor_name: e.target.value }))}
                placeholder="Name of the lead pastor"
              />
            </div>
            <div>
              <Label>Mission</Label>
              <Textarea
                value={form.mission || ''}
                onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
                placeholder="Current mission or ministry focus"
                rows={2}
              />
            </div>
            <div>
              <Label>Desired Outcomes</Label>
              <Textarea
                value={form.desired_outcomes || ''}
                onChange={e => setForm(f => ({ ...f, desired_outcomes: e.target.value }))}
                placeholder="Desired outcomes for the current season"
                rows={2}
              />
            </div>
            <Button
              onClick={() => updateMutation.mutate(form)}
              className="w-full"
              disabled={!form.name?.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}