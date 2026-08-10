import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

export default function CoachOrgDashboard() {
  const { orgId } = useParams();
  return <Dashboard orgId={orgId} />;
}