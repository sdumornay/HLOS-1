import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import TeamDashboard from '@/pages/TeamDashboard';

import Assessments from '@/pages/Assessments';
import OrgHealth from '@/pages/OrgHealth';
import Momentum from '@/pages/Momentum';
import Issues from '@/pages/Issues';
import Actions from '@/pages/Actions';
import Sessions from '@/pages/Sessions';
import Reviews from '@/pages/Reviews';
import Resources from '@/pages/Resources';
import Organizations from '@/pages/Organizations';
import CoachWorkspace from '@/pages/CoachWorkspace';
import Stabilize from '@/pages/Stabilize';
import Align from '@/pages/Align';
import Execute from '@/pages/Execute';
import Sustain from '@/pages/Sustain';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/team" element={<TeamDashboard />} />

        <Route path="/stabilize" element={<Stabilize />} />
        <Route path="/align" element={<Align />} />
        <Route path="/execute" element={<Execute />} />
        <Route path="/sustain" element={<Sustain />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/org-health" element={<OrgHealth />} />
        <Route path="/momentum" element={<Momentum />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/coach" element={<CoachWorkspace />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App