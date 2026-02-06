import React, { useState } from 'react';
import TermsModal from './TermsModal';

interface AuthFooterLinksProps {
  text?: string;
}

/**
 * Reusable footer component for auth pages (Login/Register)
 * Shows "By creating an account, you agree to our Terms of service and Privacy policy"
 * with clickable links that open respective modals
 */
export default function AuthFooterLinks({
  text = "By creating an account, you agree to our"
}: AuthFooterLinksProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const openTermsModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsModalOpen(true);
  };

  const openPrivacyModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPrivacyModalOpen(true);
  };

  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-[#9CA3AF] text-[11px] leading-4">
          {text}{" "}
          <button
            type="button"
            onClick={openTermsModal}
            className="font-bold text-[#5E17EB] hover:underline"
          >
            Terms of service
          </button>
          {" "}and{" "}
          <button
            type="button"
            onClick={openPrivacyModal}
            className="font-bold text-[#5E17EB] hover:underline"
          >
            Privacy policy
          </button>
        </p>
      </div>

      {/* Terms of Service Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onScrollComplete={() => {}}
        type="terms"
      />

      {/* Privacy Policy Modal */}
      <TermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onScrollComplete={() => {}}
        type="privacy"
      />
    </>
  );
}
