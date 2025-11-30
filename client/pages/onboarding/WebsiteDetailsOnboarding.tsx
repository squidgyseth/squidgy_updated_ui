import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader from '@/services/businessFlowLoader';
import { onboardingDataService } from '@/services/onboardingDataService';
import { X, Globe, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { websiteApi, callN8NWebhook, saveWebsiteAnalysis, getWebsiteAnalysis } from '@/lib/api';
import { createProxyUrl, maskStorageUrlsInText } from '@/utils/urlMasking';

// Tag Chip Component
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md">
      <span className="px-3 py-1.5 text-sm text-text-primary">{label}</span>
      <button
        onClick={onRemove}
        className="p-2 hover:bg-gray-200 rounded-r-md transition-colors"
      >
        <X className="w-4 h-4 text-text-primary" />
      </button>
    </div>
  );
}

export default function WebsiteDetailsOnboarding() {
  const navigate = useNavigate();
  const { isReady, userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const flowLoader = BusinessFlowLoader.getInstance();

  // Website details state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 5,
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
          currentStep: 5,
          totalSteps: 8,
          stepTitles: flowConfig.step_titles
        });
        setLoading(false);

        // Load existing onboarding data
        if (userId) {
          const existingData = await onboardingDataService.getOnboardingProgress(userId);
          if (!existingData || !existingData.selected_assistants) {
            // If they haven't completed previous steps, redirect back
            navigate('/onboarding/personalize');
          }

          // Load existing website analysis if available
          const websiteData = await getWebsiteAnalysis(userId);
          if (websiteData) {
            setWebsiteUrl(websiteData.website_url || "");
            setCompanyDescription(websiteData.company_description || "");
            setValueProposition(websiteData.value_proposition || "");
            setBusinessNiche(websiteData.business_niche || "");
            setTags(websiteData.tags || []);
            setScreenshotUrl(websiteData.screenshot_url ? createProxyUrl(websiteData.screenshot_url) : "");
            setDataLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId, navigate, flowLoader]);

  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    setAnalyzing(true);
    try {
      const cleanUrl = websiteUrl.replace(/^https?:\/\//, '');
      const analysisResult = await websiteApi(cleanUrl);

      if (analysisResult) {
        setCompanyDescription(analysisResult.description || '');
        setValueProposition(analysisResult.valueProposition || '');
        setBusinessNiche(analysisResult.businessNiche || '');
        setTags(analysisResult.keywords || []);
        
        // Handle screenshot
        if (analysisResult.screenshot_s3_url) {
          const proxyUrl = createProxyUrl(analysisResult.screenshot_s3_url);
          setScreenshotUrl(proxyUrl);
        } else if (analysisResult.screenshot) {
          setScreenshotUrl(analysisResult.screenshot);
        }

        toast.success('Website analyzed successfully');
      }
    } catch (error) {
      console.error('Error analyzing website:', error);
      toast.error('Failed to analyze website. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleContinue = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Save website analysis data
      await saveWebsiteAnalysis(
        userId,
        websiteUrl,
        companyDescription,
        valueProposition,
        businessNiche,
        tags,
        screenshotUrl
      );

      // Update onboarding progress
      const existingData = await onboardingDataService.getOnboardingProgress(userId) || {};
      await onboardingDataService.saveOnboardingProgress({
        ...existingData,
        user_id: userId,
        current_step: 6,
        completed_steps: [...(existingData.completed_steps || []), 5],
        last_updated: new Date().toISOString()
      });

      toast.success('Website details saved successfully');
      navigate('/onboarding/business-details');
    } catch (error) {
      console.error('Error saving website details:', error);
      toast.error('Failed to save website details');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/personalize');
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

  return (
    <OnboardingLayout
      title="Website details"
      description="Please review if information from your website accurately describes your business. Edit if necessary."
      progress={progress}
      onContinue={handleContinue}
      onBack={handleBack}
      continueText="Continue"
      showActions={true}
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Screenshot Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Screenshot</h3>
          <div className="relative">
            {screenshotUrl ? (
              <div className="relative">
                <img
                  src={screenshotUrl}
                  alt="Website Screenshot"
                  className="w-full rounded-lg border border-gray-200"
                  onError={(e) => {
                    console.error('Failed to load screenshot');
                    setScreenshotUrl('');
                  }}
                />
                <button
                  onClick={() => setScreenshotUrl('')}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Screenshot will be displayed here</p>
                <p className="text-sm text-gray-500">Click "Analyze Website" to capture</p>
              </div>
            )}
          </div>
        </div>

        {/* Website URL Input */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Website URL</h3>
          <div className="flex gap-3">
            <Input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Enter website URL"
              className="flex-1"
            />
            <Button 
              onClick={analyzeWebsite} 
              disabled={analyzing || !websiteUrl.trim()}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Website'
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Click "Analyze Website" to automatically extract your business information!
          </p>
        </div>

        {/* Company Description */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">What the company does</h3>
          <Textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="Describe what your company does..."
            className="min-h-[100px]"
          />
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Value proposition</h3>
          <p className="text-sm text-gray-500 mb-4">(AI generated)</p>
          <Textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="Your unique value proposition..."
            className="min-h-[100px]"
          />
        </div>

        {/* Business Niche */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Business niche</h3>
          <Input
            value={businessNiche}
            onChange={(e) => setBusinessNiche(e.target.value)}
            placeholder="Your business niche..."
          />
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Tags</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <TagChip
                  key={index}
                  label={tag}
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Start typing to add more..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                onClick={handleAddTag}
                variant="outline"
                disabled={!newTag.trim()}
              >
                Add Tag
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}