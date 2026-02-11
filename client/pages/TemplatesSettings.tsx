import React from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { useUser } from '../hooks/useUser';
import TemplateSelector from '../components/templates/TemplateSelector';

export default function TemplatesSettings() {
  const { profile } = useUser();
  
  // Get businessId from profile's company_id
  const businessId = profile?.company_id;

  return (
    <SettingsLayout title="Templates">
      <TemplateSelector
        isOpen={true}
        onClose={() => {}}
        businessId={businessId}
      />
    </SettingsLayout>
  );
}
