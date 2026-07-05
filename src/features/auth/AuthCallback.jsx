// OAuth landing page.
//
// Google redirects here after sign-in. Because the Supabase client is created
// with detectSessionInUrl: true, it parses the auth code from the URL and
// establishes the session automatically; AuthContext then loads the profile.
// We just wait for that to settle, then route by role (admins → /admin).

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

function AuthCallback() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="route-loader">
        <div className="route-loader-spinner" aria-label="Signing you in" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default AuthCallback;
