import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Upload, X, File, ChevronLeft, ChevronRight, Settings, CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { OnboardingLayout } from './OnboardingLayout';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { saveBusinessDetails, saveWebsiteAnalysis } from '../../lib/api';
import { COUNTRIES, getPhoneNumberPlaceholder } from '../../utils/phoneNumberUtils';
import { CURRENCIES } from '../../utils/currencyUtils';
import { OnboardingProgress } from '../../types/onboarding.types';

interface AgentConfig {
  agent: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    presetup_required?: boolean;
    presetup_page?: string;
  };
  presetup_required?: boolean;
  presetup_page?: string;
}

interface CompanyMaterial {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}


interface OnboardingData {
  // Business Details
  companyName: string;
  companyWebsite: string;
  businessEmail: string;
  phoneNumber: string;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  companyDescription: string;
  specialty: string;
  teamSize: string;
  // Agent Presetup
  selectedAgents: string[];
  agentConfigs: Record<string, any>;
  // Materials Upload
  uploadedMaterials: CompanyMaterial[];
}

export default function ComprehensiveOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isReady } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [selectedAgentsToConfig, setSelectedAgentsToConfig] = useState<AgentConfig[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [completedConfigurations, setCompletedConfigurations] = useState<Set<string>>(new Set());
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  const [progress] = useState<OnboardingProgress>({
    currentStep: 5,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  });

  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    companyWebsite: '',
    businessEmail: '',
    phoneNumber: '',
    country: 'GB',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    companyDescription: '',
    specialty: '',
    teamSize: '',
    selectedAgents: [],
    agentConfigs: {},
    uploadedMaterials: []
  });

  const [extractedContent, setExtractedContent] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);


  // Load agents that require presetup
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Load from agents.ts - this would need to be updated to include presetup_required field
        const response = await fetch('/agents-compiled.json');
        const agentsData = await response.json();

        // Filter agents that have presetup_required: true
        const presetupAgents = agentsData.agents?.filter((agent: any) =>
          agent.presetup_required === true || agent.agent?.presetup_required === true
        ) || [];

        setAgents(presetupAgents);
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    };

    loadAgents();
  }, []);

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyzeWebsite = async () => {
    if (!data.companyWebsite.trim()) {
      toast({
        title: "Website Required",
        description: "Please enter a website URL to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to analyze websites.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);

    try {
      // Call the website analysis webhook directly
      const response = await fetch('http://localhost:8000/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firm_user_id: userId,
          website_url: data.companyWebsite
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const result = await response.json();

      // Update extracted content and screenshot
      if (result.extracted_content) {
        setExtractedContent(result.extracted_content);
      }

      if (result.screenshot_url) {
        setScreenshotUrl(result.screenshot_url);
      }

      setHasAnalyzed(true);

      toast({
        title: "Website Analyzed",
        description: "Website content has been extracted successfully.",
      });

    } catch (error: any) {
      console.error('Error analyzing website:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    if (!userId) {
      toast({
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
          toast({
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
        console.error('Failed to process file:', file.name, error);
        toast({
          title: "Upload Failed",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (newMaterials.length > 0) {
      updateData('uploadedMaterials', [...data.uploadedMaterials, ...newMaterials]);
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${newMaterials.length} file(s)`,
      });
    }

    setUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeMaterial = (id: string) => {
    updateData('uploadedMaterials', data.uploadedMaterials.filter(m => m.id !== id));
  };

  const handleAgentSelection = (agentId: string, selected: boolean) => {
    if (selected) {
      updateData('selectedAgents', [...data.selectedAgents, agentId]);

      // Add to configuration list if has presetup_required
      const agent = agents.find(a => a.agent.id === agentId);
      if (agent && (agent.agent.presetup_page || agent.presetup_page)) {
        setSelectedAgentsToConfig(prev => [...prev, agent]);
      }
    } else {
      updateData('selectedAgents', data.selectedAgents.filter(id => id !== agentId));

      // Remove from configuration list
      setSelectedAgentsToConfig(prev => prev.filter(a => a.agent.id !== agentId));

      // Remove config for deselected agent
      const newConfigs = { ...data.agentConfigs };
      delete newConfigs[agentId];
      updateData('agentConfigs', newConfigs);

      // Remove from completed configurations
      setCompletedConfigurations(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        return newSet;
      });
    }
  };

  const saveAgentConfig = (agentId: string, config: any) => {
    updateData('agentConfigs', {
      ...data.agentConfigs,
      [agentId]: config
    });
  };

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

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Save business details
      // Save business details
      await saveBusinessDetails({
        firm_user_id: userId,
        agent_id: 'SOL',
        business_name: data.companyName,
        business_email: data.businessEmail,
        phone_number: data.phoneNumber,
        country: data.country,
        address_line: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        emergency_numbers: [],
        address_method: 'manual',
      });

      // Save website analysis
      if (data.companyWebsite) {
        await saveWebsiteAnalysis({
          firm_user_id: userId,
          agent_id: 'SOL',
          website_url: data.companyWebsite,
          company_description: data.companyDescription,
          value_proposition: '',
          business_niche: data.specialty,
          tags: []
        });
      }

      // Agent configurations are saved by their respective presetup pages
      // Each agent's config page handles its own data persistence

      // Company materials are uploaded immediately when selected (no need to process again)

      toast({
        title: "Setup Complete!",
        description: "Your business details and agent configurations have been saved.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextAgent = () => {
    if (currentAgentIndex < agents.length - 1) {
      setCurrentAgentIndex(currentAgentIndex + 1);
    }
  };

  const prevAgent = () => {
    if (currentAgentIndex > 0) {
      setCurrentAgentIndex(currentAgentIndex - 1);
    }
  };

  const canSubmit = () => {
    return data.companyName.trim() && data.businessEmail.trim();
  };

  const handleBack = () => {
    navigate('/ai-onboarding/personalize');
  };

  const handleContinue = async () => {
    if (canSubmit()) {
      await handleSubmit();
      navigate('/ai-onboarding/welcome');
    }
  };

  const markConfigurationComplete = (agentId: string) => {
    setCompletedConfigurations(prev => new Set([...prev, agentId]));
  };

  const nextConfiguration = () => {
    if (currentConfigIndex < selectedAgentsToConfig.length - 1) {
      setCurrentConfigIndex(currentConfigIndex + 1);
    }
  };

  const prevConfiguration = () => {
    if (currentConfigIndex > 0) {
      setCurrentConfigIndex(currentConfigIndex - 1);
    }
  };

  const getAgentConfigComponent = (agent: AgentConfig) => {
    const presetupPage = agent.agent.presetup_page || agent.presetup_page;

    // Dynamic component mapping based on presetup_page from YAML
    // This maps the presetup_page URL to the actual React component
    const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
      '/solar-config': () => import('../../pages/SolarConfig'),
      // Add more agent config pages here as they get implemented
      // The key should match the presetup_page value in the agent's YAML file
      // Example:
      // '/newsletter-config': () => import('../../pages/NewsletterConfig'),
      // '/smm-config': () => import('../../pages/SmmConfig'),
    };

    return componentMap[presetupPage || ''];
  };

  const renderAgentConfigPage = (agent: AgentConfig) => {
    const presetupPage = agent.agent.presetup_page || agent.presetup_page;

    if (!presetupPage) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {agent.agent.name} Configuration
          </h3>
          <p className="text-gray-600 mb-4">
            No presetup page specified for this agent in YAML configuration.
          </p>
          <Button
            onClick={() => markConfigurationComplete(agent.agent.id)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Configured
          </Button>
        </div>
      );
    }

    const ComponentLoader = getAgentConfigComponent(agent);

    if (ComponentLoader) {
      const LazyComponent = React.lazy(ComponentLoader);

      return (
        <div className="w-full h-full">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-600 mt-2">Loading {agent.agent.name} configuration...</p>
            </div>
          }>
            <LazyComponent />
          </Suspense>
        </div>
      );
    }

    // Fallback for agents with presetup_page but no implemented component
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {agent.agent.name} Configuration
        </h3>
        <p className="text-gray-600 mb-4">
          Configuration page ({presetupPage}) not yet implemented.
        </p>
        <Button
          onClick={() => markConfigurationComplete(agent.agent.id)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Configured
        </Button>
      </div>
    );
  };

  const renderBusinessDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Building2 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
        <p className="text-sm text-gray-600">Tell us about your company</p>
      </div>

      <div className="space-y-3">
        {/* Screenshot Display - Only show after analysis */}
        {hasAnalyzed && screenshotUrl && (
          <div className="mb-4">
            <div className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Screenshot captured
            </div>
            <img
              src={screenshotUrl}
              alt="Website Screenshot"
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <Input
            placeholder="e.g. Sunshine Solutions"
            value={data.companyName}
            onChange={(e) => updateData('companyName', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Business Email *
          </label>
          <Input
            type="email"
            placeholder="info@yourcompany.com"
            value={data.businessEmail}
            onChange={(e) => updateData('businessEmail', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Company Website
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.yourcompany.com"
              value={data.companyWebsite}
              onChange={(e) => updateData('companyWebsite', e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              onClick={handleAnalyzeWebsite}
              disabled={analyzing || !data.companyWebsite.trim()}
              size="sm"
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            placeholder={getPhoneNumberPlaceholder(data.country)}
            value={data.phoneNumber}
            onChange={(e) => updateData('phoneNumber', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Country
          </label>
          <Select value={data.country} onValueChange={(value) => updateData('country', value)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Team Size
          </label>
          <Select value={data.teamSize} onValueChange={(value) => updateData('teamSize', value)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select team size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Just me</SelectItem>
              <SelectItem value="2-5">2-5 employees</SelectItem>
              <SelectItem value="6-10">6-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="50+">50+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Brief Description
          </label>
          <Textarea
            placeholder="Tell us about your business..."
            value={data.companyDescription}
            onChange={(e) => updateData('companyDescription', e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {data.companyDescription.length}/500
          </div>
        </div>

        {/* Extracted Content - Only show after analysis */}
        {hasAnalyzed && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Extracted Content
            </label>
            <Textarea
              placeholder="Website analysis content will appear here..."
              value={extractedContent}
              onChange={(e) => setExtractedContent(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              maxLength={1000}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {extractedContent.length}/1000
            </div>
          </div>
        )}
      </div>
    </div>
  );


  const renderFileUpload = () => (
    <div className="space-y-4">
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
        className={`border-2 border-dashed rounded-lg p-8 transition-all ${isDragging
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
          <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors ${uploading ? 'bg-green-100' : isDragging ? 'bg-blue-100' : 'bg-white'
            }`}>
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            ) : (
              <Upload className={`h-6 w-6 transition-colors ${isDragging ? 'text-blue-600' : 'text-blue-500'
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
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
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

      {/* Uploaded Files */}
      {data.uploadedMaterials.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Uploaded Files ({data.uploadedMaterials.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {data.uploadedMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <File className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{material.name}</p>
                    <p className="text-xs text-gray-500">
                      {(material.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMaterial(material.id)}
                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAgentConfigurationCarousel = () => {
    // Find SOL Bot specifically or create default
    const solBot = agents.find(agent => agent.agent.id === 'SOL') || {
      agent: {
        id: 'SOL',
        name: 'SOL Bot',
        description: 'Solar sales expert - Calculate savings, design systems, close deals',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=solar&backgroundColor=ffb238'
      },
      presetup_required: true,
      presetup_page: '/solar-config'
    };

    return (
      <div>
        {/* SOL Bot Header with Expand/Collapse */}
        <div
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
        >
          {solBot.agent.avatar && (
            <img
              src={solBot.agent.avatar}
              alt={solBot.agent.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {solBot.agent.name}
            </h3>
            <p className="text-sm text-gray-600">
              {solBot.agent.description}
            </p>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isConfigExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {/* Expandable Configuration Content */}
        {isConfigExpanded && (
          <div className="mt-6 space-y-6">
            {renderAgentConfigPage(solBot)}
          </div>
        )}
      </div>
    );
  };


  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Company Details"
      stepDescription="Complete your business setup in one place"
      onContinue={handleContinue}
      continueDisabled={!canSubmit() || loading || uploading}
      continueText={loading || uploading ? (uploading ? 'Uploading...' : 'Saving...') : 'Continue'}
    >
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="space-y-8">
          {/* Section 1: Business Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderBusinessDetails()}
          </div>

          {/* Section 2: Agent Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderAgentConfigurationCarousel()}
          </div>

          {/* Section 3: File Upload */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderFileUpload()}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}