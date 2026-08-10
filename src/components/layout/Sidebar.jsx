import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Compass, Rocket, Leaf,
  ClipboardCheck, Target, Calendar, BarChart3, BookOpen, Settings,
  ChevronLeft, ChevronRight, Heart, Briefcase, Activity, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/useCurrentUser';

const LEADER_ROLES = ['super_admin', 'coach', 'lead_pastor'];
const ADMIN_ROLES = ['super_admin', 'coach'];

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: 'all' },
  { type: 'divider', label: 'Framework' },
  { label: 'Stabilize', path: '/stabilize', icon: Shield, roles: 'all' },
  { label: 'Align', path: '/align', icon: Compass, roles: 'all' },
  { label: 'Execute', path: '/execute', icon: Rocket, roles: 'all' },
  { label: 'Sustain', path: '/sustain', icon: Leaf, roles: 'all' },
  { type: 'divider', label: 'Tools' },
  { label: 'Assessments', path: '/assessments', icon: ClipboardCheck, roles: 'all' },
  { label: 'Issues', path: '/issues', icon: AlertCircle, roles: 'all' },
  { label: 'Actions', path: '/actions', icon: Target, roles: 'all' },
  { label: 'Resources', path: '/resources', icon: BookOpen, roles: 'all' },
  { type: 'divider', label: 'Insights', roles: LEADER_ROLES },
  { label: 'Team Dashboard', path: '/team', icon: Users, roles: LEADER_ROLES },
  { label: 'Org Health', path: '/org-health', icon: Activity, roles: LEADER_ROLES },
  { label: 'Momentum', path: '/momentum', icon: Rocket, roles: LEADER_ROLES },
  { label: 'Sessions', path: '/sessions', icon: Calendar, roles: LEADER_ROLES },
  { label: 'Reports', path: '/reviews', icon: BarChart3, roles: LEADER_ROLES },
  { type: 'divider', label: 'Admin', roles: ADMIN_ROLES },
  { label: 'Coach Workspace', path: '/coach', icon: Briefcase, roles: ['coach'] },
  { label: 'Organizations', path: '/organizations', icon: Settings, roles: ADMIN_ROLES },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useCurrentUser();

  // Detect consultant viewing a specific org (from /coach/:orgId route or ?org= param)
  const routeOrgMatch = location.pathname.match(/\/coach\/([^/]+)/);
  const routeOrgId = routeOrgMatch?.[1];
  const queryOrgId = searchParams.get('org');
  const activeOrgId = routeOrgId || queryOrgId;
  const isPortfolioList = location.pathname === '/coach';
  const shouldCarryOrg = activeOrgId && !isPortfolioList;

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.type === 'divider') {
      if (item.roles && !item.roles.includes(user?.role)) return false;
      return true;
    }
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
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(240,180,41,0.5)]">
          <Heart className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-base font-barlow font-bold tracking-widest text-sidebar-primary uppercase truncate">HLOS</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">Healthy Leadership OS</p>
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

          // Carry org context via ?org= when consultant is viewing a specific org
          const linkTo = shouldCarryOrg && item.path !== '/coach'
            ? `${item.path}?org=${activeOrgId}`
            : item.path;

          return (
            <Link
              key={item.path}
              to={linkTo}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold border-l-2 border-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
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