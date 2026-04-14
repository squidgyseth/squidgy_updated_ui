import "./global.css";
import "./styles/mobile/mobile.css";

// Capture email verification params IMMEDIATELY before Supabase processes them
// This runs at module load time, before React mounts
(function captureEmailVerification() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const code = params.get('code');
  
  // If this looks like an email verification callback (not password recovery)
  if ((type === 'signup' || type === 'email_change' || code) && type !== 'recovery') {
    sessionStorage.setItem('email_verified', 'true');
  }
})();

import { Toaster } from "./components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { UserProvider } from "./hooks/useUser";
import { ProtectedRoute } from "./components/ProtectedRoute";
import GlobalNotificationBell from "./components/GlobalNotificationBell";
import { MobileProvider } from "./components/mobile";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import SetNewPassword from './pages/SetNewPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import WebsiteDetails from "./pages/WebsiteDetails";
import BusinessDetails from "./pages/BusinessDetails";
import SolarSetup from "./pages/SolarSetup";
import SolarConfig from "./pages/SolarConfig";
import CalendarSetup from "./pages/CalendarSetup";
import NotificationsPreferences from "./pages/NotificationsPreferences";
import FacebookConnect from "./pages/FacebookConnect";
import FacebookOAuthTest from "./pages/FacebookOAuthTest";
import SetupComplete from "./pages/SetupComplete";
import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import AccountPage from "./pages/AccountPage";
import Help from "./pages/Help";
import BusinessSettings from "./pages/BusinessSettings";
import TeamSettings from "./pages/TeamSettings";
import PersonalisationSettings from "./pages/PersonalisationSettings";
import IntegrationsSettings from "./pages/IntegrationsSettings";
import TemplatesSettings from "./pages/TemplatesSettings";
import BillingSettings from "./pages/BillingSettings";
import Leads from "./pages/Leads";
import TestEmailCheck from "./pages/TestEmailCheck";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import AgentSettings from "./pages/AgentSettings";
import NewsletterEditor from "./pages/NewsletterEditor";
import NewsletterPreview from "./pages/NewsletterPreview";
import SocialMediaPreview from "./pages/SocialMediaPreview";
import HistoricalNewsletters from "./pages/HistoricalNewsletters";
import HistoricalSocialPosts from "./pages/HistoricalSocialPosts";
import SocialPostAction from "./pages/SocialPostAction";

// AI Onboarding Pages
import BusinessTypeSelection from "./pages/onboarding/BusinessTypeSelection";
import SupportAreasSelection from "./pages/onboarding/SupportAreasSelection";
import ChooseAssistants from "./pages/onboarding/ChooseAssistants";
import PersonalizeAssistants from "./pages/onboarding/PersonalizeAssistants";
import WebsiteDetailsOnboarding from "./pages/onboarding/WebsiteDetailsOnboarding";
import BusinessDetailsOnboarding from "./pages/onboarding/BusinessDetailsOnboarding";
import Welcome from "./pages/onboarding/Welcome";
import ComprehensiveOnboarding from "./components/onboarding/ComprehensiveOnboarding";

// Referral Pages  
import ReferralHub from "./pages/referrals/ReferralHub";
import WaitlistWelcome from "./pages/WaitlistWelcome";

// Mobile Pages
import MobileChats from "./pages/mobile/chats";

// New Onboarding
import NewOnboarding from "./pages/new_onboarding";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import { AdminRoute } from "./components/AdminRoute";
import ImpersonationBanner from "./components/ImpersonationBanner";
import { RootRedirect } from "./components/RootRedirect";

const queryClient = new QueryClient();

// Component to handle auth redirects
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // First, let Supabase process any auth tokens in the URL
      // This is important for email verification links
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          // User's email is confirmed and they have a session
          sessionStorage.setItem('email_verified', 'true');
        }
      } catch (e) {
        console.error('Error getting session:', e);
      }

      // Check both query params and hash fragment (Supabase uses hash for tokens)
      const urlParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace('#', ''));
      
      const code = urlParams.get('code');
      const error = urlParams.get('error') || hashParams.get('error');
      const type = urlParams.get('type') || hashParams.get('type');
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');

      // Handle auth parameters on root path or login page
      if ((location.pathname === '/' || location.pathname === '/login') && (code || accessToken || type) && !error) {
        
        // If we have tokens in hash, try to establish session
        if (accessToken && refreshToken) {
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!sessionError && data.session) {
              // Session set successfully - user is now logged in
              sessionStorage.setItem('email_verified', 'true');
              // Clear hash to prevent re-processing
              window.history.replaceState(null, '', location.pathname);
              navigate('/login', { replace: true });
              return;
            }
          } catch (e) {
            console.error('Failed to set session from tokens:', e);
          }
        }
        
        if (type === 'recovery') {
          // Password reset flow
          navigate('/reset-password', { replace: true });
        } else if (type === 'signup') {
          // Email verification confirmation
          // The tokens in the URL have already been processed by Supabase
          // which sets email_confirmed_at in auth.users
          sessionStorage.setItem('email_verified', 'true');
          // Clear URL params and redirect to login
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        } else if (type === 'email_change') {
          // Email change confirmation
          sessionStorage.setItem('email_verified', 'true');
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        } else if (code) {
          // Code-based auth callback - exchange code for session
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && data.session) {
              sessionStorage.setItem('email_verified', 'true');
            }
          } catch (e) {
            console.error('Failed to exchange code for session:', e);
          }
          sessionStorage.setItem('email_verified', 'true');
          window.history.replaceState(null, '', '/login');
          navigate('/login', { replace: true });
        }
      }
      
      // Listen for PASSWORD_RECOVERY event from Supabase to handle password reset
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password', { replace: true });
        }
        // Handle successful sign in from email verification
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          sessionStorage.setItem('email_verified', 'true');
        }
      });

      // Clean up subscription after a short delay
      setTimeout(() => {
        subscription.unsubscribe();
      }, 2000);
    };

    // Small delay to ensure the component is mounted
    const timer = setTimeout(handleAuthRedirect, 100);
    return () => clearTimeout(timer);
  }, [navigate, location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <MobileProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthHandler />
          <ImpersonationBanner />
          <GlobalNotificationBell />
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<SetNewPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/test-email-check" element={<TestEmailCheck />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/comprehensive-onboarding" element={
            <ProtectedRoute>
              <ComprehensiveOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/website-details" element={
            <ProtectedRoute>
              <WebsiteDetails />
            </ProtectedRoute>
          } />
          <Route path="/business-details" element={
            <ProtectedRoute>
              <BusinessDetails />
            </ProtectedRoute>
          } />
          <Route path="/solar-setup" element={
            <ProtectedRoute>
              <SolarSetup />
            </ProtectedRoute>
          } />
          <Route path="/solar-config" element={
            <ProtectedRoute>
              <SolarConfig />
            </ProtectedRoute>
          } />
          <Route path="/calendar-setup" element={
            <ProtectedRoute>
              <CalendarSetup />
            </ProtectedRoute>
          } />
          <Route path="/notifications-preferences" element={
            <ProtectedRoute>
              <NotificationsPreferences />
            </ProtectedRoute>
          } />
          <Route path="/facebook-connect" element={
            <ProtectedRoute>
              <FacebookConnect />
            </ProtectedRoute>
          } />
          <Route path="/facebook-oauth-test" element={
            <ProtectedRoute>
              <FacebookOAuthTest />
            </ProtectedRoute>
          } />
          <Route path="/setup-complete" element={
            <ProtectedRoute>
              <SetupComplete />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />
          <Route path="/business-settings" element={
            <ProtectedRoute>
              <BusinessSettings />
            </ProtectedRoute>
          } />
          <Route path="/team-settings" element={
            <ProtectedRoute>
              <TeamSettings />
            </ProtectedRoute>
          } />
          <Route path="/personalisation-settings" element={
            <ProtectedRoute>
              <PersonalisationSettings />
            </ProtectedRoute>
          } />
          <Route path="/integrations-settings" element={
            <ProtectedRoute>
              <IntegrationsSettings />
            </ProtectedRoute>
          } />
          <Route path="/templates-settings" element={
            <ProtectedRoute>
              <TemplatesSettings />
            </ProtectedRoute>
          } />
          <Route path="/billing-settings" element={
            <ProtectedRoute>
              <BillingSettings />
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          } />
          <Route path="/chat/*" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/chats" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/agent-settings/:agentId" element={
            <ProtectedRoute>
              <AgentSettings />
            </ProtectedRoute>
          } />
          <Route path="/newsletter-editor" element={
            <ProtectedRoute>
              <NewsletterEditor />
            </ProtectedRoute>
          } />
          <Route path="/newsletter-preview" element={
            <ProtectedRoute>
              <NewsletterPreview />
            </ProtectedRoute>
          } />
          <Route path="/social-preview" element={
            <ProtectedRoute>
              <SocialMediaPreview />
            </ProtectedRoute>
          } />
          <Route path="/historical-newsletters" element={
            <ProtectedRoute>
              <HistoricalNewsletters />
            </ProtectedRoute>
          } />
          <Route path="/historical-social-posts" element={
            <ProtectedRoute>
              <HistoricalSocialPosts />
            </ProtectedRoute>
          } />
          <Route path="/social-post-action" element={<SocialPostAction />} />
          
          {/* AI Onboarding Routes */}
          <Route path="/ai-onboarding/business-type" element={
            <ProtectedRoute>
              <BusinessTypeSelection />
            </ProtectedRoute>
          } />
          <Route path="/ai-onboarding/support-areas" element={
            <ProtectedRoute>
              <SupportAreasSelection />
            </ProtectedRoute>
          } />
          <Route path="/ai-onboarding/choose-assistants" element={
            <ProtectedRoute>
              <ChooseAssistants />
            </ProtectedRoute>
          } />
          <Route path="/ai-onboarding/personalize" element={
            <ProtectedRoute>
              <PersonalizeAssistants />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/website-details" element={
            <ProtectedRoute>
              <WebsiteDetailsOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/business-details" element={
            <ProtectedRoute>
              <BusinessDetailsOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />
          <Route path="/ai-onboarding/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />
          
          {/* Referral Routes */}
          <Route path="/referrals" element={
            <ProtectedRoute>
              <ReferralHub />
            </ProtectedRoute>
          } />
          
          {/* Waitlist Welcome - shown after registration */}
          <Route path="/waitlist-welcome" element={
            <ProtectedRoute>
              <WaitlistWelcome />
            </ProtectedRoute>
          } />
          
          {/* Mobile Pages */}
          <Route path="/mobile/chats" element={
            <ProtectedRoute>
              <MobileChats />
            </ProtectedRoute>
          } />
          
          {/* New Onboarding Flow */}
          <Route path="/new_onboarding" element={
            <ProtectedRoute>
              <NewOnboarding />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } />
          <Route path="/admin/activity" element={
            <AdminRoute>
              <AdminActivity />
            </AdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          } />
          <Route path="/admin/leaderboard" element={
            <AdminRoute>
              <AdminLeaderboard />
            </AdminRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </MobileProvider>
    </UserProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
