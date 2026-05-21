import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/useCurrentUser';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, loading } = useCurrentUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!loading && user && !user.organization_id && !skipped) {
      setShowOnboarding(true);
    }
  }, [user, loading, skipped]);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard
        open={showOnboarding}
        onComplete={(completed) => {
          setShowOnboarding(false);
          if (completed) {
            window.location.reload();
          } else {
            setSkipped(true);
          }
        }}
      />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={cn("hidden lg:block", mobileOpen && "!block")}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        <TopBar onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}