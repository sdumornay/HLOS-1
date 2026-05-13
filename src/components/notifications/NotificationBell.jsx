import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, AlertCircle, Calendar, MessageSquare, TrendingDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  overdue_action: AlertCircle,
  session_reminder: Calendar,
  health_decline: TrendingDown,
  new_comment: MessageSquare,
  general: Bell,
};

export default function NotificationBell() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.read);

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  const dismiss = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  const recent = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 15);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications
            </div>
          ) : (
            recent.map(n => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-3.5 w-3.5 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {n.created_date ? format(new Date(n.created_date), 'MMM d, h:mm a') : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!n.read && (
                      <button onClick={() => markRead.mutate(n.id)} title="Mark read">
                        <Check className="h-3.5 w-3.5 text-primary hover:text-primary/70" />
                      </button>
                    )}
                    <button onClick={() => dismiss.mutate(n.id)} title="Dismiss">
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}