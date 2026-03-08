import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { signUp } from '../lib/api';
import BetaUserAgreementModal from '../components/BetaUserAgreementModal';
import TermsModal from '../components/TermsModal';
import AuthFooterLinks from '../components/AuthFooterLinks';
import AuthCarousel from '../components/AuthCarousel';
import ReferralService from '../services/referralService';

// Google Icon from design
const GoogleIcon = () => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.5347 9.69141C18.5347 9.13183 18.484 8.60058 18.3972 8.0835H10.2192V11.2781H14.9017C14.6918 12.3264 14.0766 13.2118 13.1647 13.8139V15.9389H15.9583C17.5939 14.4585 18.5347 12.2768 18.5347 9.69141Z" fill="#4285F4"/>
    <path d="M10.2202 18C12.565 18 14.5263 17.235 15.9592 15.9387L13.1657 13.8137C12.3841 14.3237 11.3926 14.6354 10.2202 14.6354C7.95498 14.6354 6.03714 13.1408 5.34961 11.1221H2.46924V13.3108C3.89495 16.0875 6.82599 18 10.2202 18Z" fill="#34A853"/>
    <path d="M5.34863 11.1219C5.1677 10.6119 5.07362 10.0665 5.07362 9.4998C5.07362 8.93313 5.17494 8.38771 5.34863 7.87771V5.68896H2.46826C1.87481 6.83646 1.53467 8.12563 1.53467 9.4998C1.53467 10.874 1.87481 12.1631 2.46826 13.3106L5.34863 11.1219Z" fill="#FBBC05"/>
    <path d="M10.2202 4.36458C11.5012 4.36458 12.6446 4.79667 13.5493 5.63959L16.0244 3.21708C14.5263 1.84292 12.565 1 10.2202 1C6.82599 1 3.89495 2.9125 2.46924 5.68917L5.34961 7.87792C6.03714 5.85917 7.95498 4.36458 10.2202 4.36458Z" fill="#EA4335"/>
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Consent checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [aiConsentAccepted, setAiConsentAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Modal state
  const [isBetaAgreementModalOpen, setIsBetaAgreementModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Tracking if user has viewed and scrolled through documents
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);
  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);

  // Modal handlers
  const openBetaAgreementModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsBetaAgreementModalOpen(true);
  };

  const openPrivacyModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPrivacyModalOpen(true);
  };

  const handleBetaAgreementScrollComplete = () => {
    setTermsScrolledToBottom(true);
  };

  const handlePrivacyScrollComplete = () => {
    setPrivacyScrolledToBottom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate referral code if provided
    if (referralCode.trim()) {
      const referralService = ReferralService.getInstance();
      const isValidCode = await referralService.validateReferralCode(referralCode);

      if (!isValidCode) {
        toast.error('Invalid referral code. Please check and try again.');
        return;
      }
    }

    // Validate required consents
    if (!termsAccepted) {
      toast.error('You must accept the Terms and Privacy Policy to continue');
      return;
    }

    if (!aiConsentAccepted) {
      toast.error('You must consent to AI processing to use our services');
      return;
    }

    setLoading(true);

    try {
      const response = await signUp({
        email,
        password,
        fullName,
        referralCode: referralCode.trim() || undefined,
        termsAccepted,
        aiProcessingConsent: aiConsentAccepted,
        marketingConsent
      });

      if (response.needsEmailConfirmation) {
        toast.success('Account created! Please check your email to verify your account before signing in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.success('Account created successfully! Please sign in to continue.');
        // Redirect to login page
        navigate('/login');
      }
    } catch (error: any) {
      console.error('❌ REGISTER: Error during signup:', error);
      
      // If email already exists, redirect to forgot password
      if (error.message?.includes('already exists')) {
        toast.error('An account with this email already exists. Redirecting to password reset...');
        setTimeout(() => {
          navigate('/forgot-password', { state: { email } });
        }, 1500);
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-['Open_Sans']">
      {/* Left Side - Registration Form */}
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

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-[#101828] mb-2 font-['Open_Sans']">
              Create account
            </h1>
            <p className="text-[15px] text-center text-[#4A5565] font-['Open_Sans']">
              Boost your business with seamless Squidgy AI
            </p>
          </div>

          {/* Back to Sign In */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 mb-6 text-[#5E17EB] hover:underline"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.89062 8.125L8.39062 11.625L7.5 12.5L2.5 7.5L7.5 2.5L8.39062 3.375L4.89062 6.875H12.5V8.125H4.89062Z" fill="#5E17EB"/>
            </svg>
            <span className="text-[15px] font-['Open_Sans']">Back to sign in</span>
          </button>

          {/* Google Sign Up */}
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
                or sign up using email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-[13px] py-4 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-[13px] py-4 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-[13px] py-4 pr-12 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                  placeholder="Create a password"
                  required
                  minLength={8}
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-[13px] py-4 pr-12 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#99A1AF]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Referral Code Field */}
            <div>
              <label htmlFor="referralCode" className="block text-[14px] text-[#364153] mb-1 font-['Open_Sans']">
                Referral Code
              </label>
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-[13px] py-4 border border-[#D1D5DC] rounded-[10px] text-[15px] placeholder:text-[rgba(10,10,10,0.5)] font-['Open_Sans'] focus:outline-none focus:ring-2 focus:ring-[#5E17EB] focus:border-transparent uppercase"
                placeholder="Enter referral code"
                required
              />
              <p className="mt-2 text-xs text-[#6A7282] font-['Open_Sans']">
                💡 Enter a valid referral code
              </p>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              {/* Instructional message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-800 font-medium">
                  📖 Please click and read through the complete Beta User Agreement and Privacy Policy before you can accept.
                </p>
              </div>

              {/* Terms and Privacy Policy - Required */}
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5E17EB] focus:ring-[#5E17EB] cursor-pointer"
                  required
                />
                <span className="text-[13px] text-[#4A5565] leading-snug font-['Open_Sans']">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={openBetaAgreementModal}
                    className="text-[#5E17EB] hover:underline font-semibold"
                  >
                    Beta User Agreement
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={openPrivacyModal}
                    className="text-[#5E17EB] hover:underline font-semibold"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>

              {/* AI Processing Consent - Required */}
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={aiConsentAccepted}
                  onChange={(e) => setAiConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5E17EB] focus:ring-[#5E17EB] cursor-pointer"
                  required
                />
                <span className="text-[13px] text-[#4A5565] leading-snug font-['Open_Sans']">
                  I consent to my content being processed by AI services as described in the Agreement
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>

              {/* Marketing Communications - Optional */}
              <label className="flex items-start gap-2 cursor-pointer group bg-gray-50 p-3 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-400 text-gray-500 focus:ring-gray-400 cursor-pointer"
                />
                <span className="text-[13px] text-gray-600 leading-snug font-['Open_Sans']">
                  I'd like to receive marketing communications and product updates (optional)
                </span>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-[10px] bg-gradient-to-r from-[#FB252A] to-[#6017E8] text-white font-bold text-[15px] font-['Open_Sans'] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <span className="text-[14px] text-[#4A5565] font-['Open_Sans']">Already have an account? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-[14px] font-bold text-[#5E17EB] font-['Open_Sans'] hover:underline"
            >
              Sign in
            </button>
          </div>

          {/* Terms and Privacy - Reusable Component */}
          <AuthFooterLinks />
        </div>
      </div>

      {/* Right Side - Carousel */}
      <AuthCarousel />

      {/* Beta User Agreement Modal */}
      <BetaUserAgreementModal
        isOpen={isBetaAgreementModalOpen}
        onClose={() => setIsBetaAgreementModalOpen(false)}
        onScrollComplete={handleBetaAgreementScrollComplete}
      />

      {/* Privacy Policy Modal */}
      <TermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onScrollComplete={handlePrivacyScrollComplete}
        type="privacy"
      />
    </div>
  );
}
