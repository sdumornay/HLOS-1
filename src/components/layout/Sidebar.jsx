import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Compass, Rocket, RefreshCw,
  ClipboardCheck, Target, Calendar, BarChart3, BookOpen, Settings,
  ChevronLeft, ChevronRight, Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/useCurrentUser';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: 'all' },
  { label: 'Team Dashboard', path: '/team', icon: Users, roles: 'all' },
  { type: 'divider', label: 'Framework' },
  { label: 'Stabilize', path: '/stage/stabilize', icon: Shield, roles: 'all' },
  { label: 'Align', path: '/stage/align', icon: Compass, roles: 'all' },
  { label: 'Execute', path: '/stage/execute', icon: Rocket, roles: 'all' },
  { label: 'Sustain', path: '/stage/sustain', icon: RefreshCw, roles: 'all' },
  { type: 'divider', label: 'Tools' },
  { label: 'Assessments', path: '/assessments', icon: ClipboardCheck, roles: 'all' },
  { label: 'Actions', path: '/actions', icon: Target, roles: 'all' },
  { label: 'Sessions', path: '/sessions', icon: Calendar, roles: 'all' },
  { label: 'Reviews', path: '/reviews', icon: BarChart3, roles: 'all' },
  { label: 'Resources', path: '/resources', icon: BookOpen, roles: 'all' },
  { type: 'divider', label: 'Admin' },
  { label: 'Organizations', path: '/organizations', icon: Settings, roles: ['super_admin', 'coach'] },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user, canManageAll } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.type === 'divider') return true;
    if (item.roles === 'all') return true;
    return item.roles?.includes(user?.role);
  });

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Heart className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-sidebar-primary-foreground truncate">LHOS</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">Leadership Health OS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item, i) => {
          if (item.type === 'divider') {
            return !collapsed ? (
              <p key={i} className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 pt-4 pb-1">
                {item.label}
              </p>
            ) : <div key={i} className="h-4" />;
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}