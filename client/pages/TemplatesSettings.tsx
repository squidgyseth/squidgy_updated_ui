import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { useUser } from '../hooks/useUser';
import { supabase } from '../lib/supabase';
import TemplateSelector from '../components/templates/TemplateSelector';

export default function TemplatesSettings() {
  const { userId } = useUser();
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching business_settings:', error);
          return;
        }

        if (data) {
          setBusinessId(data.id);
          console.log('Business ID loaded:', data.id);
        }
      } catch (err) {
        console.error('Error in fetchBusinessId:', err);
      }
    };

    fetchBusinessId();
  }, [userId]);

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
