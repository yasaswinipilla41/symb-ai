// Route guards.
//
// ProtectedRoute — requires an authenticated session.
// AdminRoute      — requires an authenticated session AND role === 'admin'.
// Both wait for the auth state to finish loading before deciding, so we never
// bounce a signed-in user to /login on a hard refresh.

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

function FullPageLoader() {
  return (
    <div className="route-loader">
      <div className="route-loader-spinner" aria-label="Loading" />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
