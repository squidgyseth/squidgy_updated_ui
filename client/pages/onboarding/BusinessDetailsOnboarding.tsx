import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import BusinessFlowLoader from '@/services/businessFlowLoader';
import { onboardingDataService } from '@/services/onboardingDataService';
import { Building2, Building, Plus, Trash2, ChevronDown, Upload, File, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { saveBusinessDetails, getBusinessDetails, getWebsiteAnalysis } from '@/lib/api';
import { COUNTRIES, getCountryByCode, formatPhoneNumber, detectCountryFromWebsite, getPhoneNumberPlaceholder } from '@/utils/phoneNumberUtils';
import { supabase } from '@/lib/supabase';

interface CompanyMaterial {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function BusinessDetailsOnboarding() {
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
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
  const [addressSearch, setAddressSearch] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // File upload state variables
  const [uploadedMaterials, setUploadedMaterials] = useState<CompanyMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 6,
    totalSteps: 6,
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
          totalSteps: 6,
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
            if (websiteData) {
              // Use company_name field if available, otherwise try to extract from description
              let businessNameToUse = "";
              
              // First try to use the dedicated company_name field
              if (websiteData.company_name) {
                businessNameToUse = websiteData.company_name;
              } 
              // Fallback: try to extract from company_description (for legacy data)
              else if (websiteData.company_description) {
                // Try to extract business name from various patterns
                const nameMatch = websiteData.company_description.match(/^([^-|*•]+)/);
                if (nameMatch) {
                  businessNameToUse = nameMatch[1].trim();
                  // Remove common prefixes/suffixes
                  businessNameToUse = businessNameToUse.replace(/^(company name:|name:)/i, '').trim();
                }
              }
              
              // Detect country from website URL
              const detectedCountry = detectCountryFromWebsite(
                websiteData.website_url || "", 
                websiteData.company_description
              );
              
              // Populate form with website analysis data
              setBusinessName(businessNameToUse || "");
              setCountry(detectedCountry);
              setDataLoaded(true);
              
              console.log('🔄 BusinessDetails: Populated from website analysis data:', {
                businessName: businessNameToUse,
                detectedCountry,
                websiteUrl: websiteData.website_url,
                companyName: websiteData.company_name,
                originalDescription: websiteData.company_description
              });
            } else {
              setDataLoaded(true);
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

  const handleAddressMethodChange = (method: string) => {
    setAddressMethod(method);
    if (method === 'manual') {
      // Clear auto-filled fields when switching to manual
      setCity('');
      setState('');
      setPostalCode('');
    }
  };

  const handleAddressSelect = (addressData: any) => {
    // Auto-fill the city, state, and postal code
    if (addressData.city) setCity(addressData.city);
    if (addressData.state) setState(addressData.state);
    if (addressData.postal_code) setPostalCode(addressData.postal_code);
    // Set the full address
    setAddress(`${addressData.street_number || ''} ${addressData.street_name || ''}`.trim() || addressData.formatted_address || '');
    
    // Try to detect country from address
    if (addressData.country) {
      const countryCode = Object.keys(COUNTRIES).find(
        key => COUNTRIES[key].name.toLowerCase() === addressData.country.toLowerCase()
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

  // Backend integration for company materials
  const saveCompanyMaterial = async (file: File, fileUrl: string) => {
    try {
      const formData = new FormData();
      formData.append('firm_user_id', userId);
      formData.append('file_name', file.name);
      formData.append('file_url', fileUrl);
      formData.append('agent_id', 'personal_assistant'); // Use personal_assistant for company materials
      formData.append('agent_name', 'Personal Assistant');

      const response = await fetch('http://localhost:8000/api/knowledge-base/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save company material');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving company material:', error);
      throw error;
    }
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    if (!userId) {
      toastHook({
        title: "Authentication Required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    const newMaterials: CompanyMaterial[] = [];
    
    for (const file of files) {
      try {
        // Upload to Supabase storage first
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}_${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          toastHook({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('company')
          .getPublicUrl(fileName);

        // Save to knowledge base using the same API as agent-settings
        const result = await saveCompanyMaterial(file, publicUrl);
        
        if (result.success) {
          newMaterials.push({
            id: result.file_id || `${timestamp}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            file
          });
          
          console.log('Company material saved successfully:', result.file_id);
        } else {
          throw new Error('Failed to save to knowledge base');
        }
        
      } catch (error) {
        console.error('Error processing file:', error);
        toastHook({
          title: "Upload Failed",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    if (newMaterials.length > 0) {
      setUploadedMaterials(prev => [...prev, ...newMaterials]);
      toastHook({
        title: "Files Uploaded",
        description: `Successfully uploaded ${newMaterials.length} file(s)`,
      });
    }
    
    setUploading(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedMaterials(prev => prev.filter(material => material.id !== id));
    toastHook({
      title: "File Removed",
      description: "File has been removed from upload queue",
    });
  };

  const handleContinue = async () => {
    if (!isReady || !userId) {
      toastHook({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      
      // Save business details data to database
      toastHook({
        title: "Saving business details...",
        description: "Storing your business information"
      });

      const businessDetailsData = {
        firm_user_id: userId,
        agent_id: 'SOL',
        business_name: businessName.trim(),
        business_email: businessEmail.trim(),
        phone_number: phoneNumber.trim(),
        emergency_numbers: emergencyNumbers.filter(num => num.trim().length > 0),
        country: country,
        address_method: addressMethod,
        address_line: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        setup_status: 'completed'
      };

      await saveBusinessDetails(businessDetailsData);
      
      toastHook({
        title: "Business details saved!",
        description: "Your business information has been stored successfully"
      });

      // Update onboarding progress and mark as complete
      const existingData = await onboardingDataService.getOnboardingProgress(userId) || {};
      const existingCompletedSteps = existingData.completed_steps || [];
      const updatedCompletedSteps = existingCompletedSteps.includes(6) 
        ? existingCompletedSteps 
        : [...existingCompletedSteps, 6];
      
      await onboardingDataService.saveOnboardingProgress({
        ...existingData,
        user_id: userId,
        current_step: 6, // Stay at step 6 since this is the final step
        completed_steps: updatedCompletedSteps,
        is_completed: true, // Mark onboarding as complete
        last_updated: new Date().toISOString()
      });

      // Mark onboarding as complete
      await onboardingDataService.markOnboardingCompleted(userId);

      // Navigate to onboarding welcome instead of solar-setup
      navigate('/onboarding/welcome');
    } catch (error) {
      toastHook({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save business details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/website-details');
  };

  if (loading && !isReady) {
    return (
      <OnboardingLayout
        stepTitle="Loading..."
        stepDescription="Please wait while we load your information"
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
      stepTitle="Configure your business details"
      stepDescription="Provide your business contact information and location"
      progress={progress}
      onContinue={handleContinue}
      onBack={handleBack}
      continueText="Continue"
      showActions={true}
    >
      {/* Form */}
      <div className="max-w-lg mx-auto">

        {/* Business Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Business name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
          />
        </div>

        {/* Business Email */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Business email</label>
          <div className="relative">
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full p-3 pl-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Phone number</label>
          <div className="relative">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={getPhoneNumberPlaceholder(country)}
              className="w-full p-3 pl-20 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-700 font-bold">{getCountryByCode(country)?.dialCode}</span>
            </div>
          </div>
        </div>

        {/* 24/7 Emergency Numbers */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">24/7 emergency number (optional)</label>
          {emergencyNumbers.map((number, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => updateEmergencyNumber(index, e.target.value)}
                  placeholder={getPhoneNumberPlaceholder(country)}
                  className="w-full p-3 pl-20 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-700 font-bold">{getCountryByCode(country)?.dialCode}</span>
                </div>
              </div>
              {emergencyNumbers.length > 1 && (
                <button
                  onClick={() => removeEmergencyNumber(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addEmergencyNumber}
            className="flex items-center gap-2 text-squidgy-purple font-semibold text-sm hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Country */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Country</label>
          <div className="relative">
            <select 
              value={country} 
              onChange={(e) => {
                setCountry(e.target.value);
                // Clear address fields when country changes
                setAddress('');
                setCity('');
                setState('');
                setPostalCode('');
              }} 
              className="w-full p-3 pl-10 pr-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent appearance-none">
              {Object.entries(COUNTRIES).map(([code, countryData]) => (
                <option key={code} value={code}>
                  {countryData.flag} {countryData.name}
                </option>
              ))}
            </select>
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.914a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Address Details */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-4">Address details</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="addressMethod"
                value="lookup"
                checked={addressMethod === 'lookup'}
                onChange={(e) => handleAddressMethodChange(e.target.value)}
                className="w-4 h-4 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
              />
              <span className="text-text-primary text-sm">Address lookup</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="addressMethod"
                value="manual"
                checked={addressMethod === 'manual'}
                onChange={(e) => handleAddressMethodChange(e.target.value)}
                className="w-4 h-4 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
              />
              <span className="text-text-primary text-sm">Add manually</span>
            </label>
          </div>
          {addressMethod === 'lookup' && (
            <p className="text-xs text-gray-500 italic">
              Start typing your address and select from suggestions. City, state, and postal code will be filled automatically.
            </p>
          )}
        </div>

        {/* Address Fields */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Address</label>
          {addressMethod === 'lookup' ? (
            <AddressAutocomplete
              value={addressSearch}
              onChange={setAddressSearch}
              onAddressSelect={handleAddressSelect}
              country={country}
              placeholder="Start typing your address..."
            />
          ) : (
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
              placeholder="Enter your address"
            />
          )}
        </div>

        {/* City */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent ${
              addressMethod === 'lookup' && city ? 'bg-green-50 border-green-300' : ''
            }`}
            placeholder={addressMethod === 'lookup' ? 'Will be auto-filled' : 'Enter city'}
            readOnly={addressMethod === 'lookup'}
          />
        </div>

        {/* State */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">State/Province</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={`w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent ${
              addressMethod === 'lookup' && state ? 'bg-green-50 border-green-300' : ''
            }`}
            placeholder={addressMethod === 'lookup' ? 'Will be auto-filled' : 'Enter state/province'}
            readOnly={addressMethod === 'lookup'}
          />
        </div>

        {/* Postal Code */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Postal code</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className={`w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent ${
              addressMethod === 'lookup' && postalCode ? 'bg-green-50 border-green-300' : ''
            }`}
            placeholder={addressMethod === 'lookup' ? 'Will be auto-filled' : 'Enter postal code'}
            readOnly={addressMethod === 'lookup'}
          />
        </div>

        {/* Upload Company Materials Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload company materials</h2>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Share promotional materials, logos, brochures, or any documents that help explain your business and services.
            </p>
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-8 transition-all ${
              isDragging 
                ? 'border-blue-400 bg-blue-50 scale-105' 
                : uploading
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors ${
                uploading ? 'bg-green-100' : isDragging ? 'bg-blue-100' : 'bg-white'
              }`}>
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                ) : (
                  <Upload className={`h-6 w-6 transition-colors ${
                    isDragging ? 'text-blue-600' : 'text-blue-500'
                  }`} />
                )}
              </div>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Click to upload'}
                </button>
                <span className="text-gray-600"> or drag and drop</span>
              </div>
              <p className="text-sm text-gray-500">
                PDF, PNG, JPG, SVG (max. 10MB each)
              </p>
              {isDragging && !uploading && (
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Drop your files here!
                </p>
              )}
              {uploading && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Processing files...
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.svg,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Suggested Documents */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Suggested documents to upload
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Company logos and brand assets</li>
                  <li>• Promotional brochures or flyers</li>
                  <li>• Service catalogs or product sheets</li>
                  <li>• Case studies or project portfolios</li>
                  <li>• Certifications or accreditations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedMaterials.length > 0 && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Uploaded Files ({uploadedMaterials.length})
              </h4>
              <div className="space-y-2">
                {uploadedMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-3">
                      <File className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{material.name}</p>
                        <p className="text-xs text-gray-500">
                          {(material.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeUploadedFile(material.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </OnboardingLayout>
  );
}