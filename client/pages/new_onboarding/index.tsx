import React from 'react';
import NewOnboardingWelcome from './Welcome';

export default function NewOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl" />
      </div>
      
      {/* Welcome Modal */}
      <NewOnboardingWelcome />
    </div>
  );
}