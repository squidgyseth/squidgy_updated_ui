import "./global.css";

import { Toaster } from "./components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { UserProvider } from "./hooks/useUser";
import { ProtectedRoute } from "./components/ProtectedRoute";
import GlobalNotificationBell from "./components/GlobalNotificationBell";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import SetNewPassword from './pages/SetNewPassword';
import WebsiteDetails from "./pages/WebsiteDetails";
import BusinessDetails from "./pages/BusinessDetails";
import SolarSetup from "./pages/SolarSetup";
import SolarConfig from "./pages/SolarConfig";
import CalendarSetup from "./pages/CalendarSetup";
import NotificationsPreferences from "./pages/NotificationsPreferences";
import FacebookConnect from "./pages/FacebookConnect";
import SetupComplete from "./pages/SetupComplete";
import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import BusinessSettings from "./pages/BusinessSettings";
import TeamSettings from "./pages/TeamSettings";
import PersonalisationSettings from "./pages/PersonalisationSettings";
import BillingSettings from "./pages/BillingSettings";
import Leads from "./pages/Leads";
import TestEmailCheck from "./pages/TestEmailCheck";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import AgentSettings from "./pages/AgentSettings";
import NewsletterEditor from "./pages/NewsletterEditor";

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

      console.log('AuthHandler: Checking URL params:', {
        pathname: location.pathname,
        code: !!code,
        type,
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        error,
        allParams: Object.fromEntries(urlParams.entries())
      });

      // Only redirect if we're on the root path with auth parameters
      if (location.pathname === '/' && (code || accessToken) && !error) {
        console.log('AuthHandler: Auth callback detected on root path');
        
        if (type === 'recovery') {
          // Password reset flow
          console.log('AuthHandler: Redirecting to reset password page');
          navigate('/reset-password' + location.search, { replace: true });
        } else if (type === 'signup') {
          // Signup confirmation flow
          console.log('AuthHandler: Redirecting to login page for signup confirmation');
          navigate('/login' + location.search, { replace: true });
        } else if (code || accessToken) {
          // Generic auth callback - could be either, check for password reset indicators
          // If no specific type, default to login page
          console.log('AuthHandler: Generic auth callback, redirecting to login');
          navigate('/login' + location.search, { replace: true });
        }
      }
      
      // Also check if we're on /login with password reset parameters
      if (location.pathname === '/login' && code && !type) {
        console.log('AuthHandler: Checking if this is a password reset on login page');
        // This might be a password reset that landed on /login
        // Let's check if the user gets authenticated and then redirect to reset-password
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('AuthHandler: User authenticated via password reset link, redirecting to reset-password');
              navigate('/reset-password' + location.search, { replace: true });
            }
          } catch (error) {
            console.log('AuthHandler: Not a password reset link');
          }
        }, 500);
      }
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
          <Route path="/test-email-check" element={<TestEmailCheck />} />
          <Route path="/" element={<Login />} />
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Index />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
