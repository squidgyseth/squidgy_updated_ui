import React, { useState } from 'react';
import { 
  Plus,
  Check,
  Wand2,
  Briefcase,
  Smile,
  Save
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';

interface Avatar {
  id: string;
  src: string;
  selected: boolean;
}

type AssistantTone = 'friendly' | 'professional' | 'casual';

export default function PersonalisationSettings() {
  const { user, userId } = useUser();
  const [saving, setSaving] = useState(false);
  
  const [assistantName, setAssistantName] = useState('Solar Sales Assistant');
  const [selectedTone, setSelectedTone] = useState<AssistantTone>('friendly');
  
  const [avatars, setAvatars] = useState<Avatar[]>([
    {
      id: '1',
      src: 'https://i.pravatar.cc/150?img=3',
      selected: true
    },
    {
      id: '2',
      src: 'https://i.pravatar.cc/150?img=5',
      selected: false
    },
    {
      id: '3',
      src: 'https://i.pravatar.cc/150?img=8',
      selected: false
    }
  ]);

  const handleAvatarSelect = (avatarId: string) => {
    setAvatars(avatars.map(avatar => ({
      ...avatar,
      selected: avatar.id === avatarId
    })));
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('Please log in to save settings');
      return;
    }

    if (!assistantName.trim()) {
      toast.error('Please enter an assistant name');
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Implement API call to save personalisation settings
      const selectedAvatar = avatars.find(a => a.selected);
      
      console.log('Saving settings:', {
        assistantName,
        selectedAvatar: selectedAvatar?.id,
        tone: selectedTone
      });
      
      toast.success('Personalisation settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newAvatar: Avatar = {
            id: Date.now().toString(),
            src: e.target?.result as string,
            selected: true
          };
          setAvatars([
            ...avatars.map(a => ({ ...a, selected: false })),
            newAvatar
          ]);
          toast.success('Avatar uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  return (
    <SettingsLayout title="Personalisation Settings">
      {/* AI Assistant Customization */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-medium text-gray-900 mb-8">AI Assistant Customization</h2>
        
        {/* Assistant Name */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assistant Name
          </label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Assistant Avatar */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assistant Avatar
          </label>
          <div className="flex gap-4 items-center">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                className={`relative w-20 h-20 rounded-full overflow-hidden border-3 transition-all ${
                  avatar.selected 
                    ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img 
                  src={avatar.src} 
                  alt="Avatar option" 
                  className="w-full h-full object-cover"
                />
                {avatar.selected && (
                  <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={handleUploadAvatar}
              className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-purple-500 flex items-center justify-center transition-colors bg-gray-50 hover:bg-purple-50"
            >
              <Plus className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Assistant Tone */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assistant Tone
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Friendly Tone */}
            <button
              onClick={() => setSelectedTone('friendly')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTone === 'friendly'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTone === 'friendly' ? 'bg-purple-600' : 'bg-purple-100'
                }`}>
                  <Wand2 className={`w-4 h-4 ${
                    selectedTone === 'friendly' ? 'text-white' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Friendly</h3>
                    {selectedTone === 'friendly' && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Warm, approachable tone
                  </p>
                </div>
              </div>
            </button>

            {/* Professional Tone */}
            <button
              onClick={() => setSelectedTone('professional')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTone === 'professional'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTone === 'professional' ? 'bg-purple-600' : 'bg-blue-100'
                }`}>
                  <Briefcase className={`w-4 h-4 ${
                    selectedTone === 'professional' ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Professional</h3>
                    {selectedTone === 'professional' && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Business-oriented tone
                  </p>
                </div>
              </div>
            </button>

            {/* Casual Tone */}
            <button
              onClick={() => setSelectedTone('casual')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTone === 'casual'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTone === 'casual' ? 'bg-purple-600' : 'bg-teal-100'
                }`}>
                  <Smile className={`w-4 h-4 ${
                    selectedTone === 'casual' ? 'text-white' : 'text-teal-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Casual</h3>
                    {selectedTone === 'casual' && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Relaxed, conversational tone
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Personalization'}
          </button>
        </div>
      </div>
    </SettingsLayout>
  );
}