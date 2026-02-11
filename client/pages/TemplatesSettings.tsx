import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { useUser } from '../hooks/useUser';
import { templatesService } from '../lib/templates-api';
import TemplateSelector from '../components/templates/TemplateSelector';

export default function TemplatesSettings() {
  const { user } = useUser();
  const [firmUserId, setFirmUserId] = useState<string | null>(null);

  const getUserFirmId = async () => {
    if (!user?.email) return;
    
    try {
      const { businessId } = await templatesService.getBusinessId(user.email);
      if (businessId) {
        setFirmUserId(businessId);
      }
    } catch (error) {
      console.error('Error getting business ID:', error);
    }
  };

  useEffect(() => {
    getUserFirmId();
  }, [user]);

  return (
    <SettingsLayout title="Templates">
      <TemplateSelector
        isOpen={true}
        onClose={() => {}}
        userId={firmUserId || undefined}
      />
    </SettingsLayout>
  );
}
