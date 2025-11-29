import React from 'react';
import { ResponsiveLayout } from '../components/mobile/layout/ResponsiveLayout';
import { MobileAccount } from '../components/mobile/account/MobileAccount';
import { LeftNavigation } from '../components/layout/LeftNavigation';
export default function AccountPage() {
  const desktopLayout = (
    <div className="min-h-screen bg-white">
      <LeftNavigation currentPage="account" />
      <div className="ml-[60px] bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600">Account settings coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the mobile view to access account features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <ResponsiveLayout
      desktopLayout={desktopLayout}
      showBottomNav={true}
    >
      <MobileAccount />
    </ResponsiveLayout>
  );
}