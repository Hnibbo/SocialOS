
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import { useEffect, Suspense, lazy } from "react";

// Public pages
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Docs = lazy(() => import("./pages/Docs.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Legal
const TermsPage = lazy(() => import("./pages/legal/Terms.tsx"));
const PrivacyPage = lazy(() => import("./pages/legal/Privacy.tsx"));

// Protected pages
const WalletPage = lazy(() => import("./pages/Wallet")); // New Wallet UI
const Settings = lazy(() => import("./pages/Settings"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const CreatorPortal = lazy(() => import("./pages/dashboard/CreatorPortal"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const PerformanceDashboard = lazy(() => import("./pages/admin/PerformanceDashboard"));
const GodModeConfig = lazy(() => import("./components/admin/GodModeConfig"));

// Management Pages
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminGiveaways = lazy(() => import("./pages/admin/AdminGiveaways"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminGDPR = lazy(() => import("./pages/admin/AdminGDPR"));
const AdminDataExport = lazy(() => import("./pages/admin/AdminDataExport"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));

// Social App pages
const LiveMapPage = lazy(() => import("./pages/LiveMap"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const DatingPage = lazy(() => import("./pages/DatingPage"));
const RandomChatPage = lazy(() => import("./pages/RandomChatPage"));
const LiveStreamPage = lazy(() => import("./pages/LiveStreamPage"));
const SocialGridPage = lazy(() => import("./pages/SocialGrid"));
const MomentsPage = lazy(() => import("./pages/Moments"));
const ChallengesPage = lazy(() => import("./pages/Challenges"));
const MemoriesPage = lazy(() => import("./pages/Memories"));

const queryClient = new QueryClient();

import { CookieConsent } from "@/components/compliance/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

/**
 * HomeRedirect handles authenticated user logic.
 * If logged in, they skip landing/onboarding and go to the map.
 */
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/map", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <PageLoader />;
  if (user) return null; // Redirect happening in useEffect

  return <Index />;
};

// Core App Layout
import AppLayout from "@/components/layout/AppLayout";

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <CustomCursor />
      <CookieConsent />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Entry Point with Redirect */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Legal & Docs */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/docs/:slug" element={<Docs />} />

              {/* Main App (Protected Shell) */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/map" element={<LiveMapPage />} />
                <Route path="/explore" element={<LiveMapPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/social" element={<SocialGridPage />} />
                <Route path="/moments" element={<MomentsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/memories" element={<MemoriesPage />} />
                <Route path="/dating" element={<DatingPage />} />
                <Route path="/chat" element={<RandomChatPage />} />
                <Route path="/live" element={<LiveStreamPage />} />

                {/* Profile & Settings (The "You" Tab) */}
                <Route path="/profile" element={<Settings />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/dashboard/privacy" element={<PrivacySettings />} />
                <Route path="/dashboard/referrals" element={<Referrals />} />
                <Route path="/dashboard/billing" element={<Billing />} />
                <Route path="/dashboard/creator" element={<CreatorPortal />} />

                {/* Admin */}
                <Route element={<AdminRoute><AppLayout adminMode={true} /></AdminRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/security" element={<AdminSecurity />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/businesses" element={<AdminBusinesses />} />
                  <Route path="/admin/plans" element={<AdminPlans />} />
                  <Route path="/admin/god-mode" element={<GodModeConfig />} />
                  <Route path="/admin/notifications-center" element={<AdminNotifications />} />
                  <Route path="/admin/referrals" element={<AdminReferrals />} />
                  <Route path="/admin/gdpr" element={<AdminGDPR />} />
                  <Route path="/admin/data-export" element={<AdminDataExport />} />
                  <Route path="/admin/email-templates" element={<AdminEmailTemplates />} />
                  <Route path="/admin/audit-log" element={<AdminAuditLog />} />
                  <Route path="/admin/faq" element={<AdminFAQ />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/content" element={<AdminContent />} />
                  <Route path="/admin/payouts" element={<AdminPayouts />} />
                  <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
