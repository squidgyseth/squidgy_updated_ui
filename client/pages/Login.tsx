import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useUser } from "@/hooks/useUser";
import { onboardingRouter } from "@/services/onboardingRouter";
import { linkScoresToUser, getGameHistory } from '@/services/anonymousPlayer';
import AuthFooterLinks from '../components/AuthFooterLinks';
import AuthCarousel from '../components/AuthCarousel';

// SVG Icons from the design
const GoogleIcon = () => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.5347 9.69141C18.5347 9.13183 18.484 8.60058 18.3972 8.0835H10.2192V11.2781H14.9017C14.6918 12.3264 14.0766 13.2118 13.1647 13.8139V15.9389H15.9583C17.5939 14.4585 18.5347 12.2768 18.5347 9.69141Z" fill="#4285F4"/>
    <path d="M10.2202 18C12.565 18 14.5263 17.235 15.9592 15.9387L13.1657 13.8137C12.3841 14.3237 11.3926 14.6354 10.2202 14.6354C7.95498 14.6354 6.03714 13.1408 5.34961 11.1221H2.46924V13.3108C3.89495 16.0875 6.82599 18 10.2202 18Z" fill="#34A853"/>
    <path d="M5.34863 11.1219C5.1677 10.6119 5.07362 10.0665 5.07362 9.4998C5.07362 8.93313 5.17494 8.38771 5.34863 7.87771V5.68896H2.46826C1.87481 6.83646 1.53467 8.12563 1.53467 9.4998C1.53467 10.874 1.87481 12.1631 2.46826 13.3106L5.34863 11.1219Z" fill="#FBBC05"/>
    <path d="M10.2202 4.36458C11.5012 4.36458 12.6446 4.79667 13.5493 5.63959L16.0244 3.21708C14.5263 1.84292 12.565 1 10.2202 1C6.82599 1 3.89495 2.9125 2.46924 5.68917L5.34961 7.87792C6.03714 5.85917 7.95498 4.36458 10.2202 4.36458Z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { setUserId, userId } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  // Modal state for Terms/Privacy

  // Check if user arrived after email confirmation
  useEffect(() => {
    const emailVerified = sessionStorage.getItem('email_verified');
    
    if (emailVerified === 'true') {
      sessionStorage.removeItem('email_verified');
      toast.success('Email verified successfully!');
    }
  }, []);

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      // Use resend with type 'signup' to resend the actual email verification link
      // This marks email_confirmed_at in auth.users when clicked
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: `${import.meta.env.VITE_FRONTEND_URL}/login`
        }
      });
      
      if (error) {
        // If resend fails (e.g., user already confirmed), try magic link as fallback
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.toLowerCase(),
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${import.meta.env.VITE_FRONTEND_URL}/login`
          }
        });
        
        if (otpError) {
          toast.error('Failed to send verification email. Please try again.');
        } else {
          toast.success('Verification email sent! Please check your inbox.');
        }
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleChangeEmail = () => {
    setShowVerificationPanel(false);
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Try actual authentication with Supabase
      const response = await signIn({ email, password });
      
      if (response.needsEmailConfirmation) {
        setShowVerificationPanel(true);
        return;
      }
      
      // Get user ID directly from the sign-in response
      const loggedInUserId = response.profile?.user_id || response.user?.id;

      if (!loggedInUserId) {
        console.error('❌ Login: No user ID in response');
        toast.error('Login failed. Please try again.');
        return;
      }

      toast.success('Login successful!');
      
      // Link any anonymous game scores to this user
      const pendingScores = getGameHistory();
      if (pendingScores.length > 0) {
        try {
          const linkedCount = await linkScoresToUser(loggedInUserId);
          if (linkedCount > 0) {
            toast.success(`${linkedCount} game score${linkedCount > 1 ? 's' : ''} saved to your account!`);
          }
        } catch (err) {
          // Failed to link game scores
        }
      }
      
      // Use smart onboarding router to determine where to go
      try {
        const routeDecision = await onboardingRouter.determineLoginRoute(loggedInUserId);
        navigate(routeDecision.redirectPath);
      } catch (error) {
        console.error('❌ Login: Error determining route:', error);
        // Fallback to dashboard with onboarding on error
        navigate('/dashboard?onboarding=true');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show proper error message to user
      if (error.message?.includes('Invalid email or password')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Too many login attempts')) {
        toast.error('Too many login attempts. Please wait a few minutes and try again.');
      } else if (error.message?.includes('Supabase is not configured')) {
        toast.error('Authentication service is not configured. Please contact support.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 md:px-8 md:py-0 lg:px-16 xl:px-20 2xl:px-24 md:max-w-[600px]">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-16">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
              alt="Squidgy"
              className="w-[145px] h-[59px]"
            />
          </div>

          {/* Verification Panel - shown when email not verified */}
          {showVerificationPanel ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#5E17EB]" />
                </div>
                <h2 className="text-xl font-bold text-[#101828] mb-2 font-['Open_Sans']">
                  Email Verification Required
                </h2>
                <p className="text-[15px] text-[#4A5565] font-['Open_Sans']">
                  Your email <span className="font-semibold">{email}</span> hasn't been verified yet.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                  className="w-full px-4 py-3 rounded-[10px] bg-gradient-to-r from-[#FB252A] to-[#6017E8] text-white font-bold text-[15px] font-['Open_Sans'] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  {sendingVerification ? "Sending..." : "Resend Verification Email"}
                </button>

                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="w-full px-4 py-3 rounded-[10px] border border-[#D1D5DC] text-[#364153] font-bold text-[15px] font-['Open_Sans'] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Use a Different Email
                </button>
              </div>

              <p className="text-[13px] text-center text-[#6A7282] font-['Open_Sans']">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-center text-[#101828] mb-2 font-['Open_Sans']">
                  Welcome back
                </h1>
                <p className="text-[15px] text-center text-[#4A5565] font-['Open_Sans']">
                  Sign in to your Squidgy account
                </p>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 px-[17px] py-[13px] border border-[#E5E7EB] rounded-[10px] mb-3 bg-gray-100 cursor-not-allowed opacity-60"
              >
                <GoogleIcon />
                <span className="text-[15px] text-[#9CA3AF] font-['Open_Sans']">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D1D5DC]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[13px] text-[#6A7282] font-['Open_Sans']">
                    or login using email
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-[13px] py-4 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-[13px] py-4 pr-12 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#99A1AF]"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[13px] font-bold text-[#5E17EB] font-['Open_Sans'] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-[10px] bg-gradient-to-r from-[#FB252A] to-[#6017E8] text-white font-bold text-[15px] font-['Open_Sans'] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <span className="text-[14px] text-[#4A5565] font-['Open_Sans']">Don't have account? </span>
                <button
                  onClick={() => navigate('/register')}
                  className="text-[14px] font-bold text-[#5E17EB] font-['Open_Sans'] hover:underline"
                >
                  Sign Up
                </button>
              </div>

              {/* Terms and Privacy - Reusable Component */}
              <AuthFooterLinks />
            </>
          )}
        </div>
      </div>

      {/* Right Side - Carousel */}
      <AuthCarousel />

    </div>
  );
}
