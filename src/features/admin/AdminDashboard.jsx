import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AdminOverview from './pages/AdminOverview';
import UserManagement from './pages/UserManagement';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminFeedback from './pages/AdminFeedback';
import AdminNotifications from './pages/AdminNotifications';
import AdminQuizReview from './pages/AdminQuizReview';
import AdminLeaderboard from './pages/AdminLeaderboard';
import AdminCertificatePage from './pages/AdminCertificatePage';
import AdminStudentProfile from './pages/AdminStudentProfile';
import ProfilePage from '../dashboard/pages/ProfilePage';
import MaterialsPage from '../dashboard/pages/MaterialsPage';
import MaterialViewer from '../dashboard/pages/MaterialViewer';
import AdminBookmarks from './pages/AdminBookmarks';
import ComingSoon from '../dashboard/pages/ComingSoon';

const NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', end: true, label: 'Dashboard', icon: 'LayoutDashboard' },
      { to: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/admin/users', label: 'Students', icon: 'Users' },
      { to: '/admin/leaderboard', label: 'Leaderboard & Approvals', icon: 'Trophy' },
      { to: '/admin/quiz-review', label: 'Quiz Review', icon: 'Award' },
      { to: '/explore', label: 'Explore Resources', icon: 'Compass' },
      { to: '/admin/materials', label: 'Learning Materials', icon: 'GraduationCap' },
      { to: '/admin/notifications', label: 'Notifications', icon: 'Bell' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/admin/bookmarks', label: 'Bookmarks', icon: 'Bookmark' },
      { to: '/admin/feedback', label: 'Feedback', icon: 'MessageSquare' },
      { to: '/admin/settings', label: 'Site Settings', icon: 'Settings' },
    ],
  },
];

function AdminDashboard() {
  return (
    <DashboardShell title="Admin Console" nav={NAV}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="student/:userId" element={<AdminStudentProfile />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="leaderboard" element={<AdminLeaderboard />} />
        <Route path="certificate/:userId/:resource" element={<AdminCertificatePage />} />
        <Route path="quiz-review" element={<AdminQuizReview />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="materials/:resource" element={<MaterialViewer />} />
        <Route path="bookmarks" element={<AdminBookmarks />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="resources" element={<ComingSoon title="Resource Management" note="Add, edit, delete, feature, hide and publish resources; upload logos, PDFs and PPTs. Arriving in the next phase." />} />
        <Route path="categories" element={<ComingSoon title="Category Management" note="Add, edit, delete, reorder categories and change icons. Arriving in the next phase." />} />
        <Route path="settings" element={<ComingSoon title="Site Settings" note="Configure site logo, name, contact info, theme, footer content and social links. Arriving in the next phase." />} />
      </Routes>
    </DashboardShell>
  );
}

export default AdminDashboard;
