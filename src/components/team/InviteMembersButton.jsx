import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteMembersButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState(['']);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const valid = emails.filter(e => e.trim());
      await Promise.allSettled(valid.map(e => base44.users.inviteUser(e.trim(), 'team_member')));
    },
    onSuccess: () => {
      toast.success('Invitations sent!');
      setOpen(false);
      setEmails(['']);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Some invitations could not be sent.'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            They'll receive an email invitation to join your organization as team members.
          </p>
          {emails.map((email, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="email"
                value={email}
                onChange={e => setEmails(list => list.map((v, idx) => idx === i ? e.target.value : v))}
                placeholder="email@church.org"
                className="flex-1"
              />
              {emails.length > 1 && (
                <button
                  onClick={() => setEmails(list => list.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setEmails(list => [...list, ''])}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add another
          </button>
          <Button
            onClick={() => inviteMutation.mutate()}
            className="w-full"
            disabled={!emails.some(e => e.trim()) || inviteMutation.isPending}
          >
            {inviteMutation.isPending ? 'Sending...' : 'Send Invitations'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}