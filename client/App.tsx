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

const queryClient = new QueryClient();

// Component to handle auth redirects
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthRedirect = () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const type = urlParams.get('type');
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');


      // Only redirect if we're on the root path with auth parameters
      if (location.pathname === '/' && (code || accessToken) && !error) {
        
        if (type === 'recovery') {
          // Password reset flow
          navigate('/reset-password' + location.search, { replace: true });
        } else if (type === 'signup') {
          // Signup confirmation flow
          navigate('/login' + location.search, { replace: true });
        } else if (code || accessToken) {
          // Generic auth callback - could be either, check for password reset indicators
          // If no specific type, default to login page
          navigate('/login' + location.search, { replace: true });
        }
      }
      
      // Listen for PASSWORD_RECOVERY event from Supabase to handle password reset
      // This is the only reliable way to detect password reset vs email verification
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password', { replace: true });
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
        <BrowserRouter>
          <AuthHandler />
          <GlobalNotificationBell />
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<SetNewPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/test-email-check" element={<TestEmailCheck />} />
          <Route path="/" element={<Login />} />
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
