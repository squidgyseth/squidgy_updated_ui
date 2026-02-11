import React from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { useUser } from '../hooks/useUser';
import TemplateSelector from '../components/templates/TemplateSelector';

export default function TemplatesSettings() {
  const { userId } = useUser();

  return (
    <SettingsLayout title="Templates">
      <TemplateSelector
        isOpen={true}
        onClose={() => {}}
        userId={userId}
      />
    </SettingsLayout>
  );
}
