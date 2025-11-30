import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader from '@/services/businessFlowLoader';
import { onboardingDataService } from '@/services/onboardingDataService';
import { Building2, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { saveBusinessDetails, getBusinessDetails, getWebsiteAnalysis } from '@/lib/api';
import { COUNTRIES, getCountryByCode, formatPhoneNumber, detectCountryFromWebsite, getPhoneNumberPlaceholder } from '@/utils/phoneNumberUtils';

export default function BusinessDetailsOnboarding() {
  const navigate = useNavigate();
  const { isReady, userId } = useUser();
  const [loading, setLoading] = useState(true);
  const flowLoader = BusinessFlowLoader.getInstance();

  // Form state variables
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('GB');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [emergencyNumbers, setEmergencyNumbers] = useState(['']);
  const [addressMethod, setAddressMethod] = useState('lookup');
  const [dataLoaded, setDataLoaded] = useState(false);

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 6,
    totalSteps: 8,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Configure Assistants', 'Website Details', 'Business Details', 'Welcome']
  });

  useEffect(() => {
    const loadConfiguration = async () => {
      if (!isReady) {
        return;
      }
      
      try {
        // Load flow configuration
        const flowConfig = await flowLoader.getFlowConfig();
        setProgress({
          currentStep: 6,
          totalSteps: 8,
          stepTitles: flowConfig.step_titles
        });
        setLoading(false);

        // Load existing onboarding data
        if (userId) {
          const existingData = await onboardingDataService.getOnboardingProgress(userId);
          if (!existingData || !existingData.completed_steps?.includes(5)) {
            // If they haven't completed website details step, redirect back
            navigate('/onboarding/website-details');
          }

          // Load existing business details if available
          const existingBusinessData = await getBusinessDetails(userId);
          if (existingBusinessData) {
            setBusinessName(existingBusinessData.business_name || "");
            setBusinessEmail(existingBusinessData.business_email || "");
            setPhoneNumber(existingBusinessData.phone_number || "");
            setEmergencyNumbers(existingBusinessData.emergency_numbers?.length > 0 ? existingBusinessData.emergency_numbers : ['']);
            setCountry(existingBusinessData.country || "GB");
            setAddressMethod(existingBusinessData.address_method || "lookup");
            setAddress(existingBusinessData.address || "");
            setCity(existingBusinessData.city || "");
            setState(existingBusinessData.state || "");
            setPostalCode(existingBusinessData.postal_code || "");
            setDataLoaded(true);
          } else {
            // Try to pre-populate from website analysis
            const websiteData = await getWebsiteAnalysis(userId);
            if (websiteData?.website_url) {
              const detectedCountry = detectCountryFromWebsite(websiteData.website_url);
              if (detectedCountry) {
                setCountry(detectedCountry);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId, navigate, flowLoader]);

  const addEmergencyNumber = () => {
    setEmergencyNumbers([...emergencyNumbers, '']);
  };

  const removeEmergencyNumber = (index: number) => {
    if (emergencyNumbers.length > 1) {
      setEmergencyNumbers(emergencyNumbers.filter((_, i) => i !== index));
    }
  };

  const updateEmergencyNumber = (index: number, value: string) => {
    const updated = [...emergencyNumbers];
    updated[index] = value;
    setEmergencyNumbers(updated);
  };

  const handleAddressSelect = (selectedAddress: any) => {
    setAddress(selectedAddress.formatted_address || '');
    setCity(selectedAddress.city || '');
    setState(selectedAddress.state || '');
    setPostalCode(selectedAddress.postal_code || '');
    
    // Try to detect country from address
    if (selectedAddress.country) {
      const countryCode = Object.keys(COUNTRIES).find(
        key => COUNTRIES[key].name.toLowerCase() === selectedAddress.country.toLowerCase()
      );
      if (countryCode) {
        setCountry(countryCode);
      }
    }
  };

  const validateForm = () => {
    if (!businessName.trim()) {
      toast.error('Business name is required');
      return false;
    }
    if (!businessEmail.trim()) {
      toast.error('Business email is required');
      return false;
    }
    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Save business details
      await saveBusinessDetails({
        user_id: userId,
        business_name: businessName.trim(),
        business_email: businessEmail.trim(),
        phone_number: phoneNumber.trim(),
        emergency_numbers: emergencyNumbers.filter(num => num.trim()),
        country,
        address_method: addressMethod,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim()
      });

      // Update onboarding progress and mark as complete
      const existingData = await onboardingDataService.getOnboardingProgress(userId) || {};
      await onboardingDataService.saveOnboardingProgress({
        ...existingData,
        user_id: userId,
        current_step: 7,
        completed_steps: [...(existingData.completed_steps || []), 6],
        last_updated: new Date().toISOString()
      });

      // Mark onboarding as complete
      await onboardingDataService.markOnboardingCompleted(userId);

      toast.success('Business details saved successfully');
      navigate('/onboarding/welcome');
    } catch (error) {
      console.error('Error saving business details:', error);
      toast.error('Failed to save business details');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/website-details');
  };

  if (loading && !isReady) {
    return (
      <OnboardingLayout
        title="Loading..."
        description="Please wait while we load your information"
        progress={progress}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </OnboardingLayout>
    );
  }

  const selectedCountry = COUNTRIES[country];

  return (
    <OnboardingLayout
      title="Business Details"
      description="Provide your business contact information and location"
      progress={progress}
      onContinue={handleContinue}
      onBack={handleBack}
      continueText="Complete Setup"
      showActions={true}
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Business Name */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Name
          </h3>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            required
          />
        </div>

        {/* Business Email */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Business Email</h3>
          <Input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            placeholder="business@example.com"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Phone Number</h3>
          <div className="space-y-3">
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRIES).map(([code, countryData]) => (
                    <SelectItem key={code} value={code}>
                      {countryData.flag} {countryData.name} (+{countryData.dialCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {selectedCountry?.flag} +{selectedCountry?.dialCode}
                  </span>
                </div>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={getPhoneNumberPlaceholder(country)}
                  className="rounded-l-none border-l-0"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Numbers */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Emergency Numbers</h3>
            <Button
              type="button"
              onClick={addEmergencyNumber}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Number
            </Button>
          </div>
          <div className="space-y-3">
            {emergencyNumbers.map((number, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {selectedCountry?.flag} +{selectedCountry?.dialCode}
                  </span>
                </div>
                <Input
                  value={number}
                  onChange={(e) => updateEmergencyNumber(index, e.target.value)}
                  placeholder={getPhoneNumberPlaceholder(country)}
                  className="rounded-l-none border-l-0 flex-1"
                />
                {emergencyNumbers.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeEmergencyNumber(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Business Address</h3>
          
          {/* Address Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Entry Method</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAddressMethod('lookup')}
                className={`px-4 py-2 rounded-md border ${
                  addressMethod === 'lookup'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Address Lookup
              </button>
              <button
                type="button"
                onClick={() => setAddressMethod('manual')}
                className={`px-4 py-2 rounded-md border ${
                  addressMethod === 'manual'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          {addressMethod === 'lookup' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search and select your address
              </label>
              <AddressAutocomplete onAddressSelect={handleAddressSelect} />
              {address && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-700">Selected Address:</p>
                  <p className="text-sm text-gray-600">{address}</p>
                  <p className="text-sm text-gray-600">
                    {city}, {state} {postalCode}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State/Province"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal Code"
                  className="max-w-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}