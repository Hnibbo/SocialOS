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
const CustomPage = lazy(() => import("./pages/CustomPage.tsx"));
  const OnboardingTest = lazy(() => import("./pages/OnboardingTest.tsx"));

// Legal
const TermsPage = lazy(() => import("./pages/legal/Terms.tsx"));
const PrivacyPage = lazy(() => import("./pages/legal/Privacy.tsx"));

// Protected pages
const WalletPage = lazy(() => import("./pages/Wallet"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const CreatorPortal = lazy(() => import("./pages/dashboard/CreatorPortal"));
const DashboardAgents = lazy(() => import("./pages/dashboard/DashboardAgents"));
const Marketplace = lazy(() => import("./pages/dashboard/Marketplace"));
const OrganizationSettings = lazy(() => import("./pages/dashboard/OrganizationSettings"));
const OrganizationBilling = lazy(() => import("./pages/dashboard/OrganizationBilling"));

// Marketplace & Commerce pages
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const GodModeConfig = lazy(() => import("./components/admin/GodModeConfig"));

// Management Pages
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminGDPR = lazy(() => import("./pages/admin/AdminGDPR"));
const AdminDataExport = lazy(() => import("./pages/admin/AdminDataExport"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminContent = lazy(() => import("./pages/admin/AdminContentBuilder"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
  const AdminOrganizations = lazy(() => import("./pages/admin/AdminOrganizations"));

// Social App pages
const LiveMapPage = lazy(() => import("./pages/LiveMap"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const DatingPage = lazy(() => import("./pages/DatingPage"));
const RandomChatPage = lazy(() => import("./pages/RandomChatPage"));
const LiveStreamPage = lazy(() => import("./pages/LiveStreamPage"));
const StreamDetailPage = lazy(() => import("./pages/StreamDetailPage"));
const SocialGridPage = lazy(() => import("./pages/SocialGrid"));
const MomentsPage = lazy(() => import("./pages/Moments"));
const ChallengesPage = lazy(() => import("./pages/Challenges"));
const MemoriesPage = lazy(() => import("./pages/Memories"));
const MessagingPage = lazy(() => import("./pages/MessagingPage"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const SearchPage = lazy(() => import("./pages/Search"));
  const GamificationPage = lazy(() => import("./pages/Gamification"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

import { ConsentManager } from "@/components/compliance/ConsentManager";
import { Toaster } from "@/components/ui/sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { SocialOSProvider, useSocialOS } from "@/contexts/SocialOSContext";
import { SystemStatusBar } from "@/components/ui/system-status-bar";
import { CommandHub } from "@/components/ui/command-hub";
import { HupAIAssistant } from "@/components/ui/HupAIAssistant";
import { LoadingState } from "@/components/ui/LoadingState";

const PageLoader = () => (
  <LoadingState size="lg" text="Loading..." fullScreen={true} />
);

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/map", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <PageLoader />;
  if (user) return null;

  return <Index />;
};

import AppLayout from "@/components/layout/AppLayout";

const AppContent = () => {
  const { isAIOpen, setIsAIOpen } = useSocialOS();

  return (
    <>
      <Toaster />
      <CustomCursor />
      <ConsentManager />
      <SystemStatusBar />
      <CommandHub />
      <HupAIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/docs/:slug" element={<Docs />} />
          <Route path="/p/:slug" element={<CustomPage />} />
          <Route path="/onboarding-test" element={<OnboardingTest />} />

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

            {/* Admin routes now use AppLayout for consistent navigation */}
            <Route element={<AdminRoute />}>
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
               <Route path="/admin/ai" element={<AdminAI />} />
               <Route path="/admin/support" element={<AdminSupport />} />
               <Route path="/admin/content" element={<AdminContent />} />
               <Route path="/admin/payouts" element={<AdminPayouts />} />
               <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
               <Route path="/admin/moderation" element={<AdminModeration />} />
               <Route path="/admin/organizations" element={<AdminOrganizations />} />
            </Route>
         </Route>
         <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SocialOSProvider>
            <AppContent />
          </SocialOSProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
