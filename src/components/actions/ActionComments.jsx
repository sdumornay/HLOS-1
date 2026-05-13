import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

export default function ActionComments({ actionId, organizationId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', actionId],
    queryFn: () => base44.entities.ActionComment.filter({ action_id: actionId }),
    enabled: !!actionId,
  });

  const addComment = useMutation({
    mutationFn: (data) => base44.entities.ActionComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', actionId] });
      setText('');
    },
  });

  const sorted = [...comments].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment.mutate({
      action_id: actionId,
      organization_id: organizationId,
      author_email: user.email,
      author_name: user.full_name || user.email,
      text: text.trim(),
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Comments ({comments.length})
      </p>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {sorted.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {(c.author_name || c.author_email || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-medium">{c.author_name || c.author_email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {c.created_date ? format(new Date(c.created_date), 'MMM d, h:mm a') : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.text}</p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No comments yet.</p>
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment or update..."
          className="min-h-0 h-9 py-2 text-xs resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        />
        <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSubmit} disabled={!text.trim() || addComment.isPending}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}