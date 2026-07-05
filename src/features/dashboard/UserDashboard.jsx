import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Overview from './pages/Overview';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizRunner from './pages/QuizRunner';
import QuizResultsPage from './pages/QuizResultsPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialViewer from './pages/MaterialViewer';
import CertificatesPage from './pages/CertificatesPage';
import CertificatePage from './pages/CertificatePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ComingSoon from './pages/ComingSoon';

const NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', end: true, label: 'Dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { to: '/dashboard/materials', label: 'Learning Materials', icon: 'GraduationCap' },
      { to: '/dashboard/quizzes', label: 'Quizzes', icon: 'Trophy' },
      { to: '/dashboard/results', label: 'My Results', icon: 'Award' },
      { to: '/dashboard/certificates', label: 'Certificates', icon: 'Award' },
      { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: 'Trophy' },
      { to: '/dashboard/bookmarks', label: 'Bookmarks', icon: 'Bookmark' },
      { to: '/dashboard/history', label: 'History', icon: 'History' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/profile', label: 'Profile', icon: 'User' },
      { to: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
      { to: '/dashboard/feedback', label: 'Feedback', icon: 'MessageSquare' },
    ],
  },
];

function UserDashboard() {
  return (
    <DashboardShell title="My Dashboard" nav={NAV}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="resources" element={<ComingSoon title="Resources" note="Browse, search, filter, sort and bookmark AI resources from your dashboard." cta="/explore" />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="materials/:resource" element={<MaterialViewer />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="quizzes/:resource" element={<QuizRunner />} />
        <Route path="results" element={<QuizResultsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificate/:resource" element={<CertificatePage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Routes>
    </DashboardShell>
  );
}

export default UserDashboard;
