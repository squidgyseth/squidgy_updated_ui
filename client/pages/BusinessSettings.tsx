import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Upload,
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { COUNTRIES, getCountryByCode, getPhoneNumberPlaceholder } from '../utils/phoneNumberUtils';

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
  const navigate = useNavigate();
  const { user, profile, isReady, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<BusinessSettingsData>({
    companyName: '',
    industry: '',
    teamSize: 'manual',
    businessEmail: '',
    phoneNumber: '',
    emergencyNumber: '',
    country: 'US',
    addressMethod: 'manual',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const finalIndustries = [
    ...industries
      .filter((i) => i && i.toLowerCase() !== "other")
      .sort((a, b) => a.localeCompare(b)),
    "Other",
  ];

  const [emergencyNumbers, setEmergencyNumbers] = useState(['']);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Load existing business settings
  useEffect(() => {
    const loadBusinessSettings = async () => {
      if (!profile?.user_id) return;

      setLoading(true);
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', profile.user_id)
          .single();

        if (data) {
          // Store the business_settings.id
          setBusinessId(data.id);
          setSettings({
            companyName: data.company_name || '-',
            industry: '', // data.industry || '' YERİNE DİREKT BOŞ BIRAKTIK
            teamSize: data.team_size || 'manual',
            businessEmail: data.business_email || '',
            phoneNumber: data.phone_number || '',
            emergencyNumber: '',
            country: data.country || 'US',
            addressMethod: data.address_method || 'manual',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            postalCode: data.postal_code || '',
            companyLogo: data.company_logo_url || ''
          });

          // Load emergency numbers from JSONB
          if (data.emergency_numbers && Array.isArray(data.emergency_numbers)) {
            setEmergencyNumbers(data.emergency_numbers.length > 0 ? data.emergency_numbers : ['']);
          }
        } else {
        }
      } catch (error) {
        console.error('Error loading business settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isReady && isAuthenticated) {
      loadBusinessSettings();
    }
  }, [profile?.user_id, isReady, isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleSave = async () => {
    if (!profile?.user_id) {
      toast.error('Please log in to save settings');
      return;
    }

    try {
      setSaving(true);

      let newLogoUrl = settings.companyLogo;

      // Upload logo if changed
      if (logoFile) {
        try {
          const uploadedUrl = await uploadCompanyLogo(logoFile);
          if (uploadedUrl) {
            newLogoUrl = uploadedUrl;
            // Update settings state with the actual URL (not base64)
            setSettings(prev => ({ ...prev, companyLogo: uploadedUrl }));
          }
        } catch (error: any) {
          throw new Error(`Logo upload failed: ${error.message}`);
        }
      }

      const { supabase } = await import('../lib/supabase');

      // Prepare data for upsert
      const businessData = {
        user_id: profile.user_id,
        company_name: settings.companyName.trim(),
        industry: settings.industry,
        team_size: settings.teamSize,
        business_email: settings.businessEmail.trim(),
        phone_number: settings.phoneNumber.trim(),
        emergency_numbers: emergencyNumbers.filter(num => num.trim() !== ''),
        country: settings.country,
        address_method: settings.addressMethod,
        address: settings.address.trim(),
        city: settings.city.trim(),
        state: settings.state.trim(),
        postal_code: settings.postalCode.trim(),
        company_logo_url: newLogoUrl,
        updated_at: new Date().toISOString()
      };


      // Use upsert since we have unique constraint on user_id
      const { error } = await supabase
        .from('business_settings')
        .upsert(businessData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Supabase upsert error:', error);
        throw new Error(error.message || 'Failed to save business settings');
      }

      toast.success('Business settings saved successfully!');

      // Reset file input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
      setLogoFile(null);

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image file is too large (max 5MB)');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSettings(prev => ({ ...prev, companyLogo: e.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);

    setLogoFile(file);
  };

  const uploadCompanyLogo = async (file: File): Promise<string | null> => {
    if (!user || !profile?.user_id) return null;

    setIsUploadingLogo(true);

    try {
      const { supabase } = await import('../lib/supabase');

      // Generate a unique filename with business_logos subfolder and userId
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `business_logos/${profile.user_id}/${fileName}`;

      // Upload to static bucket (business_logos subfolder)
      const { error } = await supabase
        .storage
        .from('static')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('static')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded logo');
      }

      return urlData.publicUrl;

    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SettingsLayout title="Business Settings">

      {/* Company Logo Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center border-2 border-gray-200">
            {settings.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Company Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">
                {settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'C'}
              </span>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Company Logo</h3>
            <p className="text-sm text-gray-500 mb-4">This will be displayed on your company profile</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSettings(prev => ({ ...prev, companyLogo: '' }));
                  setLogoFile(null);
                  toast.success('Company logo removed');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isUploadingLogo ? 'Uploading...' : 'Change'}
              </button>
            </div>
          </div>
          {/* Business ID - Right bottom like Profile page */}
          <div className="text-right space-y-1 self-end ml-auto">
            <p className="text-xs text-gray-400">Business ID: {businessId || 'N/A'}</p>
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
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
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
                name="business_industry_manual_select"
                id="business_industry_manual_select"
                autoComplete="off"
                data-lpignore="true"
                value={settings.industry}
                onChange={(e) =>
                  setSettings({ ...settings, industry: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="" disabled hidden>Select Industry</option>
                {finalIndustries.map((industry) => (
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
                onChange={(e) => setSettings({ ...settings, teamSize: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
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
              <input
                type="tel"
                value={settings.phoneNumber}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                placeholder={getPhoneNumberPlaceholder(settings.country)}
                className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 font-bold">{getCountryByCode(settings.country)?.dialCode}</span>
              </div>
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
                  <input
                    type="tel"
                    value={number}
                    onChange={(e) => updateEmergencyNumber(index, e.target.value)}
                    placeholder={getPhoneNumberPlaceholder(settings.country)}
                    className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-bold">{getCountryByCode(settings.country)?.dialCode}</span>
                  </div>
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
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, addressMethod: e.target.value as 'lookup' | 'manual' })}
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
                  onChange={(e) => setSettings({ ...settings, addressMethod: e.target.value as 'lookup' | 'manual' })}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Add manually</span>
              </label>
            </div>

            {settings.addressMethod === 'lookup' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Start typing your address and select from suggestions. City, state, and postal code will be filled automatically.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {settings.addressMethod === 'lookup' ? (
                  <AddressAutocomplete
                    value={settings.address}
                    onChange={(value) => setSettings({ ...settings, address: value })}
                    onAddressSelect={(addressData) => {
                      // Auto-fill the city, state, and postal code
                      if (addressData.city) {
                        setSettings(prev => ({ ...prev, city: addressData.city || '' }));
                      }
                      if (addressData.state) {
                        setSettings(prev => ({ ...prev, state: addressData.state || '' }));
                      }
                      if (addressData.postal_code) {
                        setSettings(prev => ({ ...prev, postalCode: addressData.postal_code || '' }));
                      }
                    }}
                    country={settings.country}
                    placeholder="Start typing your address..."
                  />
                ) : (
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your address manually"
                  />
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
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
