import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from
'@/components/ui/dropdown-menu';
import { LogOut, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_ORDER = [
'/', '/team',
'/stabilize', '/align', '/execute', '/sustain',
'/assessments', '/actions', '/sessions', '/reviews', '/resources', '/organizations'];


export default function TopBar({ onMenuToggle }) {
  const { user } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = PAGE_ORDER.indexOf(location.pathname);
  const prevPath = currentIndex > 0 ? PAGE_ORDER[currentIndex - 1] : null;
  const nextPath = currentIndex < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIndex + 1] : null;

  const initials = user?.full_name ?
  user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) :
  '?';

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Prev / Next navigation */}
      <div className="flex items-center gap-1 ml-2">
        <Button variant="ghost" size="icon" disabled={!prevPath} onClick={() => prevPath && navigate(prevPath)} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled={!nextPath} onClick={() => nextPath && navigate(nextPath)} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground hidden">{ROLE_LABELS[user?.role] || 'Team Member'}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => base44.auth.logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>);

}