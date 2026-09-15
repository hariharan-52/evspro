import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './components/routing/PrivateRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import ContactPage from './pages/public/ContactPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import DonatePage from './pages/user/DonatePage';
import RecyclePage from './pages/user/RecyclePage';
import MyRequestsPage from './pages/user/MyRequestsPage';
import ImpactPage from './pages/user/ImpactPage';
import ProfilePage from './pages/user/ProfilePage';

// NGO Pages
import NGODashboard from './pages/ngo/NGODashboard';
import NGORequestsPage from './pages/ngo/NGORequestsPage';
import NGOAcceptedPage from './pages/ngo/NGOAcceptedPage';
import NGOHistoryPage from './pages/ngo/NGOHistoryPage';
import NGOProfilePage from './pages/ngo/NGOProfilePage';

// Scrap Dealer Pages
import DealerDashboard from './pages/scrapdealer/DealerDashboard';
import DealerRequestsPage from './pages/scrapdealer/DealerRequestsPage';
import DealerAcceptedPage from './pages/scrapdealer/DealerAcceptedPage';
import DealerHistoryPage from './pages/scrapdealer/DealerHistoryPage';
import DealerProfilePage from './pages/scrapdealer/DealerProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminNGOsPage from './pages/admin/AdminNGOsPage';
import AdminDealersPage from './pages/admin/AdminDealersPage';
import AdminDonationsPage from './pages/admin/AdminDonationsPage';
import AdminRecyclingPage from './pages/admin/AdminRecyclingPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Other
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>

            {/* User Dashboard */}
            <Route element={<PrivateRoute role="user" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/donate" element={<DonatePage />} />
                <Route path="/recycle" element={<RecyclePage />} />
                <Route path="/my-requests" element={<MyRequestsPage />} />
                <Route path="/impact" element={<ImpactPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* NGO Dashboard */}
            <Route element={<PrivateRoute role="ngo" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/ngo/dashboard" element={<NGODashboard />} />
                <Route path="/ngo/requests" element={<NGORequestsPage />} />
                <Route path="/ngo/accepted" element={<NGOAcceptedPage />} />
                <Route path="/ngo/history" element={<NGOHistoryPage />} />
                <Route path="/ngo/profile" element={<NGOProfilePage />} />
              </Route>
            </Route>

            {/* Scrap Dealer Dashboard */}
            <Route element={<PrivateRoute role="scrapdealer" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dealer/dashboard" element={<DealerDashboard />} />
                <Route path="/dealer/requests" element={<DealerRequestsPage />} />
                <Route path="/dealer/accepted" element={<DealerAcceptedPage />} />
                <Route path="/dealer/history" element={<DealerHistoryPage />} />
                <Route path="/dealer/profile" element={<DealerProfilePage />} />
              </Route>
            </Route>

            {/* Admin Dashboard */}
            <Route element={<PrivateRoute role="admin" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/ngos" element={<AdminNGOsPage />} />
                <Route path="/admin/scrap-dealers" element={<AdminDealersPage />} />
                <Route path="/admin/donations" element={<AdminDonationsPage />} />
                <Route path="/admin/recycling" element={<AdminRecyclingPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route element={<PublicLayout />}>
               <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
