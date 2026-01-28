import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export default function NewOnboardingWelcome() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(true);

  const handleStartSetup = () => {
    // Navigate to the first step of the new onboarding
    navigate('/new_onboarding/step1');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Navigate back to dashboard or previous page
    navigate('/dashboard');
  };

  if (!isOpen) return null;

  const userName = profile?.full_name?.split(' ')[0] || 'user';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Decorative Sparkles */}
        <div className="absolute top-12 left-12 text-purple-200">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute bottom-12 left-16 text-pink-200">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Avatar with Sparkle Badge */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-100">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
                alt="Assistant Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Sparkle Badge */}
            <div className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Hello, {userName}! I'm your Squidgy personal assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-lg">
              I'll help you set up your account, but first I need some info from you!
            </p>
          </div>

          {/* Start Setup Button */}
          <button
            onClick={handleStartSetup}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Setup
          </button>
        </div>
      </div>
    </div>
  );
}
