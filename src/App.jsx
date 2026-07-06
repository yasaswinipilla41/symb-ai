// App — top-level router.
//
// The original single-screen Knowledge Base now lives at /explore (fully
// preserved). Around it we add the Learning & Assessment Portal: a cover page,
// a home page, authentication, and role-based user/admin dashboards.
//
// Routes are code-split with React.lazy so the initial load (cover page) stays
// fast — dashboards, admin console, and the resource catalog load on demand.

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

const CoverPage = lazy(() => import('./features/landing/CoverPage'));
const HomePage = lazy(() => import('./features/home/HomePage'));
const KnowledgeBase = lazy(() => import('./features/explore/KnowledgeBase'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const AuthCallback = lazy(() => import('./features/auth/AuthCallback'));
const UserDashboard = lazy(() => import('./features/dashboard/UserDashboard'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const VerifyCertificatePage = lazy(() => import('./features/public/VerifyCertificatePage'));
const CertificateDownloadPage = lazy(() => import('./features/public/CertificateDownloadPage'));

function RouteFallback() {
  return (
    <div className="route-loader">
      <div className="route-loader-spinner" aria-label="Loading" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<CoverPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/explore" element={<KnowledgeBase />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify/:certId" element={<VerifyCertificatePage />} />
        <Route path="/certificate-download/:token" element={<CertificateDownloadPage />} />

        {/* Authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<UserDashboard />} />
        </Route>

        {/* Admins only */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
