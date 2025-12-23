import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { usePlatform, usePlatformTheme } from '@/contexts/PlatformContext';

interface NewOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewOnboardingModal({ isOpen, onClose }: NewOnboardingModalProps) {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { platform } = usePlatform();
  const theme = usePlatformTheme();

  const handleStartSetup = () => {
    // Close the modal
    onClose();
    // Mark onboarding as seen
    localStorage.setItem('onboarding_seen', 'true');
    // Navigate to personal assistant chat
    navigate('/chat/personal_assistant');
  };

  const handleClose = () => {
    onClose();
    // Mark onboarding as seen in localStorage so it doesn't show again
    localStorage.setItem('onboarding_seen', 'true');
  };

  if (!isOpen) return null;

  const userName = profile?.full_name?.split(' ')[0] || 'user';

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      
      {/* Modal - Reduced size */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="relative bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative Sparkles */}
          <div className="absolute top-8 left-8 text-purple-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute bottom-8 left-12 text-pink-200">
            <Sparkles className="w-5 h-5" />
          </div>

          {/* Content with reduced spacing */}
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Avatar with Sparkle Badge - Smaller size */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-100">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
                  alt="Assistant Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Sparkle Badge */}
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(107deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Welcome Text - Smaller font sizes */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {userName}! I'm your {platform.displayName} personal assistant
              </h1>
              <p className="text-base text-gray-600 max-w-sm">
                I'll help you set up your account, but first I need some info from you!
              </p>
            </div>

            {/* Start Setup Button - Smaller size */}
            <button
              onClick={handleStartSetup}
              className="px-10 py-3 text-white font-semibold text-base rounded-full transition-all transform hover:scale-105 shadow-lg"
              style={{
                background: `linear-gradient(107deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`
              }}
            >
              Start Setup
            </button>
          </div>
        </div>
      </div>
    </>
  );
}