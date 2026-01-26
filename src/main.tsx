import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocialOSProvider, useSocialOS } from '@/contexts/SocialOSContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';
import { Suspense, lazy } from 'react';

// Public pages
const Index = lazy(() => import('./pages/Index.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Signup = lazy(() => import('./pages/Signup.tsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));
const Docs = lazy(() => import('./pages/Docs.tsx'));
const Terms = lazy(() => import('./pages/legal/Terms.tsx'));
const Privacy = lazy(() => import('./pages/legal/Privacy.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));

// Protected pages
const WalletPage = lazy(() => import('./pages/Wallet.tsx'));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings.tsx'));
const Referrals = lazy(() => import('./pages/Referrals.tsx'));
const Billing = lazy(() => import('./pages/dashboard/Billing.tsx'));
const CreatorPortal = lazy(() => import('./pages/dashboard/CreatorPortal.tsx'));
const DashboardAgents = lazy(() => import('./pages/dashboard/DashboardAgents.tsx'));
const Marketplace = lazy(() => import('./pages/dashboard/Marketplace.tsx'));
const OrganizationSettings = lazy(() => import('./pages/dashboard/OrganizationSettings.tsx'));
const OrganizationBilling = lazy(() => import('./pages/dashboard/OrganizationBilling.tsx'));
const ProductListing = lazy(() => import('./pages/ProductListing.tsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.tsx'));
const Cart = lazy(() => import('./pages/Cart.tsx'));
const Checkout = lazy(() => import('./pages/Checkout.tsx'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess.tsx'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.tsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics.tsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.tsx'));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans.tsx'));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity.tsx'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications.tsx'));
const AdminBusinesses = lazy(() => import('./pages/admin/AdminBusinesses.tsx'));
const AdminGDPR = lazy(() => import('./pages/admin/AdminGDPR.tsx'));
const AdminDataExport = lazy(() => import('./pages/admin/AdminDataExport.tsx'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/AdminEmailTemplates.tsx'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog.tsx'));
const AdminFAQ = lazy(() => import('./pages/admin/AdminFAQ.tsx'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport.tsx'));
const AdminContentBuilder = lazy(() => import('./pages/admin/AdminContent.tsx'));
const AdminPayouts = lazy(() => import('./pages/admin/AdminPayouts.tsx'));
const AdminAI = lazy(() => import('./pages/admin/AdminAI.tsx'));
const AdminPromoCodes = lazy(() => import('./pages/admin/AdminPromoCodes.tsx'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration.tsx'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations.tsx'));
const AdminReferrals = lazy(() => import('./pages/admin/AdminReferrals.tsx'));
const AdminContent = lazy(() => import('./pages/admin/AdminContentBuilder.tsx'));

// Social pages
const LiveMapPage = lazy(() => import('./pages/LiveMap.tsx'));
const DashboardPage = lazy(() => import('./pages/Dashboard.tsx'));
const DatingPage = lazy(() => import('./pages/DatingPage.tsx'));
const RandomChatPage = lazy(() => import('./pages/RandomChatPage.tsx'));
const LiveStreamPage = lazy(() => import('./pages/LiveStreamPage.tsx'));
const StreamDetailPage = lazy(() => import('./pages/StreamDetailPage.tsx'));
const SocialGridPage = lazy(() => import('./pages/SocialGrid.tsx'));
const MomentsPage = lazy(() => import('./pages/Moments.tsx'));
const ChallengesPage = lazy(() => import('./pages/Challenges.tsx'));
const MemoriesPage = lazy(() => import('./pages/Memories.tsx'));
const MessagingPage = lazy(() => import('./pages/MessagingPage.tsx'));
const ProfilePage = lazy(() => import('./pages/Profile.tsx'));
const SearchPage = lazy(() => import('./pages/Search.tsx'));
const GamificationPage = lazy(() => import('./pages/Gamification.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage.tsx'));
const HelpCenter = lazy(() => import('./pages/HelpCenter.tsx'));

// Import existing pages that were missing
const CustomPage = lazy(() => import('./pages/CustomPage.tsx'));
const OnboardingTest = lazy(() => import('./pages/OnboardingTest.tsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SocialOSProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/docs/:slug" element={<Docs />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/p/:slug" element={<CustomPage />} />
              <Route path="/onboarding-test" element={<OnboardingTest />} />

              {/* Pricing routes */}
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/map" element={<LiveMapPage />} />
                <Route path="/explore" element={<LiveMapPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/social" element={<SocialGridPage />} />
                <Route path="/moments" element={<MomentsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/memories" element={<MemoriesPage />} />
                <Route path="/dating" element={<DatingPage />} />
                <Route path="/random-chat" element={<RandomChatPage />} />
                <Route path="/messaging" element={<MessagingPage />} />
                <Route path="/live" element={<LiveStreamPage />} />
                <Route path="/live/:id" element={<StreamDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/gamification" element={<GamificationPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/dashboard/privacy" element={<PrivacySettings />} />
                <Route path="/dashboard/referrals" element={<Referrals />} />
                <Route path="/dashboard/billing" element={<Billing />} />
                <Route path="/dashboard/creator" element={<CreatorPortal />} />
                <Route path="/dashboard/agents" element={<DashboardAgents />} />
                <Route path="/dashboard/marketplace" element={<Marketplace />} />
                <Route path="/dashboard/organization" element={<OrganizationSettings />} />
                <Route path="/dashboard/organization/billing" element={<OrganizationBilling />} />
                <Route path="/products" element={<ProductListing />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
              </Route>

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/security" element={<AdminSecurity />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/businesses" element={<AdminBusinesses />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/god-mode" element={<AdminPlans />} />
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
                <Route path="/admin/ai" element={<AdminAI />} />
                <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/organizations" element={<AdminOrganizations />} />
              </Route>

              {/* Settings page */}
              <Route path="/settings" element={<Settings />} />

              {/* Existing routes */}
              <Route path="/p/:slug" element={<CustomPage />} />
              <Route path="/onboarding-test" element={<OnboardingTest />} />

              {/* Catch all */}
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SocialOSProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Mount the app
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);
root.render(<App />);