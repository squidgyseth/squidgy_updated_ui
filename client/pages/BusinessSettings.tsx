import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Upload, 
  Trash2, 
  Plus,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';

interface BusinessSettingsData {
  companyName: string;
  industry: string;
  teamSize: string;
  businessEmail: string;
  phoneNumber: string;
  emergencyNumber: string;
  country: string;
  addressMethod: 'lookup' | 'manual';
  address: string;
  city: string;
  state: string;
  postalCode: string;
  companyLogo?: string;
}

const industries = [
  'Renewable Energy',
  'Solar Energy',
  'Wind Energy',
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Other'
];

const teamSizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees'
];

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
];

export default function BusinessSettings() {
  const { user, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<BusinessSettingsData>({
    companyName: 'WasteLess Team',
    industry: 'Renewable Energy',
    teamSize: '11-50 employees',
    businessEmail: 'info@rmsenergy.com',
    phoneNumber: '888-683-3630',
    emergencyNumber: '888-683-3631',
    country: 'US',
    addressMethod: 'manual',
    address: '15396 183rd St Little Falls, MN 56345',
    city: 'Little Falls',
    state: 'Minnesota',
    postalCode: '56345'
  });

  const [emergencyNumbers, setEmergencyNumbers] = useState([
    '888-683-3631'
  ]);

  const handleSave = async () => {
    if (!userId) {
      toast.error('Please log in to save settings');
      return;
    }

    try {
      setSaving(true);
      // TODO: Implement API call to save business settings
      toast.success('Business settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addEmergencyNumber = () => {
    setEmergencyNumbers([...emergencyNumbers, '']);
  };

  const updateEmergencyNumber = (index: number, value: string) => {
    const updated = [...emergencyNumbers];
    updated[index] = value;
    setEmergencyNumbers(updated);
  };

  const removeEmergencyNumber = (index: number) => {
    setEmergencyNumbers(emergencyNumbers.filter((_, i) => i !== index));
  };

  return (
    <SettingsLayout title="Business Settings">

            {/* Company Logo Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">W</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Company Logo</h3>
                  <p className="text-sm text-gray-500 mb-4">This will be displayed on your company profile</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Delete
                    </button>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <div className="relative">
                    <select
                      value={settings.industry}
                      onChange={(e) => setSettings({...settings, industry: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Team Size */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size
                  </label>
                  <div className="relative">
                    <select
                      value={settings.teamSize}
                      onChange={(e) => setSettings({...settings, teamSize: e.target.value})}
                      className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      {teamSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-purple-600 mb-6">Detailed Contact Information</h3>
              
              <div className="space-y-6">
                {/* Business Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={settings.businessEmail}
                      onChange={(e) => setSettings({...settings, businessEmail: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Emergency Numbers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    24/7 emergency number (optional)
                  </label>
                  {emergencyNumbers.map((number, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={number}
                          onChange={(e) => updateEmergencyNumber(index, e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {emergencyNumbers.length > 1 && (
                        <button
                          onClick={() => removeEmergencyNumber(index)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addEmergencyNumber}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={settings.country}
                      onChange={(e) => setSettings({...settings, country: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Address Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Address details
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="addressMethod"
                        value="lookup"
                        checked={settings.addressMethod === 'lookup'}
                        onChange={(e) => setSettings({...settings, addressMethod: e.target.value as 'lookup' | 'manual'})}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Address lookup</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="addressMethod"
                        value="manual"
                        checked={settings.addressMethod === 'manual'}
                        onChange={(e) => setSettings({...settings, addressMethod: e.target.value as 'lookup' | 'manual'})}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Add manually</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => setSettings({...settings, address: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={settings.city}
                        onChange={(e) => setSettings({...settings, city: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={settings.state}
                        onChange={(e) => setSettings({...settings, state: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal code
                      </label>
                      <input
                        type="text"
                        value={settings.postalCode}
                        onChange={(e) => setSettings({...settings, postalCode: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent max-w-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </SettingsLayout>
  );
}