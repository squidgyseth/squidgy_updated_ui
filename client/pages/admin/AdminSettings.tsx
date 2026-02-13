// Admin Settings - Platform settings management page

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { Settings, ArrowLeft, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSetting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at?: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadSettings();
    }
  }, [userId, isAdmin, adminLoading, navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value, description, updated_at')
        .order('setting_key');
      
      if (error) throw error;
      
      setSettings(data || []);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      // If table doesn't exist, show empty state
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (setting: PlatformSetting) => {
    const currentValue = setting.setting_value === 'true';
    const newValue = (!currentValue).toString();
    
    try {
      setSaving(setting.setting_key);
      
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: newValue })
        .eq('setting_key', setting.setting_key);
      
      if (error) throw error;
      
      setSettings(settings.map(s => 
        s.setting_key === setting.setting_key 
          ? { ...s, setting_value: newValue }
          : s
      ));
      toast.success(`${setting.setting_key} updated`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateSetting = async (setting: PlatformSetting, newValue: string) => {
    try {
      setSaving(setting.setting_key);
      
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: newValue })
        .eq('setting_key', setting.setting_key);
      
      if (error) throw error;
      
      setSettings(settings.map(s => 
        s.setting_key === setting.setting_key 
          ? { ...s, setting_value: newValue }
          : s
      ));
      toast.success(`${setting.setting_key} updated`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const isBooleanSetting = (value: string | null | undefined) => {
    const strValue = String(value || '');
    return strValue === 'true' || strValue === 'false';
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-sm text-gray-500">Configure platform-wide settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
          {settings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No settings configured
            </div>
          ) : (
            settings.map((setting) => (
              <div key={setting.setting_key} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {(setting.setting_key || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {setting.description && (
                      <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    {isBooleanSetting(String(setting.setting_value || '')) ? (
                      <button
                        onClick={() => handleToggleSetting(setting)}
                        disabled={saving === setting.setting_key}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          String(setting.setting_value) === 'true' ? 'bg-purple-600' : 'bg-gray-200'
                        } ${saving === setting.setting_key ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            String(setting.setting_value) === 'true' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <SettingInput
                        value={String(setting.setting_value || '').replace(/^"|"$/g, '')}
                        onSave={(value) => handleUpdateSetting(setting, value)}
                        saving={saving === setting.setting_key}
                      />
                    )}
                  </div>
                </div>
                {setting.updated_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Setting Input Component for non-boolean settings
interface SettingInputProps {
  value: string;
  onSave: (value: string) => void;
  saving: boolean;
}

function SettingInput({ value, onSave, saving }: SettingInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    if (inputValue !== value) {
      onSave(inputValue);
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          {value}
        </button>
      )}
    </div>
  );
}
