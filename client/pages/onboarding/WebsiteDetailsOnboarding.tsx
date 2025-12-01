import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader from '@/services/businessFlowLoader';
import { onboardingDataService } from '@/services/onboardingDataService';
import { X, Globe, Loader2, ChevronDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { websiteApi, callN8NWebhook, saveWebsiteAnalysis, getWebsiteAnalysis } from '@/lib/api';
import { createProxyUrl, maskStorageUrlsInText } from '@/utils/urlMasking';
import newsletterWebhookService from '@/services/newsletterWebhookService';
// Import webhook debugger for development
if (import.meta.env.DEV) {
  import('../../utils/webhookDebugger');
}

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
  const { isReady, userId, sessionId, agentId, user, profile } = useUser();
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
  const [faviconUrl, setFaviconUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Function to add progress step
  const addProgressStep = (step: string) => {
    setProgressStep(step);
    setProgressSteps(prev => [...prev, step]);
  };

  // Function to clear progress
  const clearProgress = () => {
    setProgressStep("");
    setProgressSteps([]);
  };

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 5,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Configure Assistants', 'Website Details', 'Business Details', 'Welcome']
  });

  useEffect(() => {
    const loadConfiguration = async () => {
      console.log('🔍 WebsiteDetails: loadConfiguration called', { isReady, userId });
      if (!isReady) {
        console.log('🔍 WebsiteDetails: Not ready yet, waiting...');
        return;
      }
      
      try {
        // Load flow configuration
        const flowConfig = await flowLoader.getFlowConfig();
        setProgress({
          currentStep: 5,
          totalSteps: 6,
          stepTitles: flowConfig.step_titles
        });
        setLoading(false);

        // Load existing onboarding data
        if (userId) {
          const existingData = await onboardingDataService.getOnboardingProgress(userId);
          if (!existingData || !existingData.selected_assistants) {
            // If they haven't completed previous steps, redirect back
            navigate('/ai-onboarding/personalize');
          }

          // Load existing website analysis if available
          const websiteData = await getWebsiteAnalysis(userId);
          if (websiteData) {
            setWebsiteUrl(websiteData.website_url || "");
            setCompanyDescription(websiteData.company_description || "");
            setValueProposition(websiteData.value_proposition || "");
            setBusinessNiche(websiteData.business_niche || "");
            setTags(websiteData.tags || []);
            setScreenshotUrl(websiteData.screenshot_url || "");
            
            // Handle favicon URL and clean up any trailing characters
            if (websiteData.favicon_url) {
              let cleanFaviconUrl = websiteData.favicon_url;
              if (cleanFaviconUrl.endsWith('?)')) {
                cleanFaviconUrl = cleanFaviconUrl.slice(0, -2);
              }
              setFaviconUrl(cleanFaviconUrl);
            }
            
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

  // Listen for website analysis completion from chat
  useEffect(() => {
    const handleWebsiteAnalysisComplete = (event: CustomEvent) => {
      const { url, result } = event.detail;
      
      // Update URL field if it matches
      if (url) {
        setWebsiteUrl(url);
      }
      
      // Update form fields with analysis results if available
      if (result.company_description) setCompanyDescription(result.company_description);
      if (result.value_proposition) setValueProposition(result.value_proposition);
      if (result.business_niche) setBusinessNiche(result.business_niche);
      if (result.tags && Array.isArray(result.tags)) setTags(result.tags);
      
      // Update screenshot URL state if provided
      if (result.screenshot_url) {
        setScreenshotUrl(result.screenshot_url);
        console.log('✅ Screenshot URL updated from WebSocket event:', result.screenshot_url);
      }
      
      toast.success("Website analyzed successfully from chat");
    };

    window.addEventListener('websiteAnalysisComplete', handleWebsiteAnalysisComplete as EventListener);
    
    return () => {
      window.removeEventListener('websiteAnalysisComplete', handleWebsiteAnalysisComplete as EventListener);
    };
  }, []);

  // Helper function to parse agent response and extract business information
  const parseAgentResponse = (agentResponse: string) => {
    try {
      console.log('🔍 Parsing agent response:', agentResponse);
      
      // First extract URLs before cleaning
      // Extract screenshot URL from the original response (before cleaning)
      const screenshotMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/screenshots\/[^\s)]*/i) ||
                             agentResponse.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/i);
      
      // Extract favicon URL from the original response (before cleaning) 
      const faviconMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/favicons\/[^\s)]*/i) ||
                          agentResponse.match(/https?:\/\/[^\s]*favicon[^\s)]*/i);
      
      console.log('🔍 Screenshot match result:', screenshotMatch);
      console.log('🔍 Favicon match result:', faviconMatch);
      
      // Clean the response by removing ALL HTML and markdown links first
      let cleanedResponse = agentResponse
        .replace(/<a[^>]*>.*?<\/a>/gi, '') // Remove all HTML anchor tags and their content
        .replace(/<[^>]*>/g, '') // Remove any other HTML tags
        .replace(/\[View[^\]]*\]\([^)]*\)/gi, '') // Remove all [View...] markdown links (including empty parentheses)
        .replace(/\[Download[^\]]*\]\([^)]*\)/gi, '') // Remove all [Download...] markdown links (including empty parentheses)
        .replace(/\[Link\]\([^)]*\)/gi, '') // Remove [Link] markdown (including empty parentheses)
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/https?:\/\/[^\s]+/gi, '') // Remove any remaining URLs
        .replace(/I've captured the following.*$/i, '') // Remove capture message and everything after
        .replace(/Could you please confirm.*$/i, '') // Remove confirmation request
        .replace(/- Screenshot:.*$/i, '') // Remove screenshot line
        .replace(/- Favicon:.*$/i, '') // Remove favicon line
        .replace(/\n+/g, ' ') // Replace multiple newlines with space
        .replace(/\s+/g, ' '); // Normalize whitespace
      
      // Look for company description
      const companyMatch = cleanedResponse.match(/company name:\s*([^|.]+?)(?:\.|$)/i) || 
                          cleanedResponse.match(/description:\s*([^|.]+?)(?:\.|$)/i) ||
                          cleanedResponse.match(/what.*company.*does[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for value proposition/takeaways
      const valueMatch = cleanedResponse.match(/takeaways:\s*([^|.]+?)(?:\.|$)/i) ||
                        cleanedResponse.match(/value proposition[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for business niche - extract only until period or end of line
      const nicheMatch = cleanedResponse.match(/niche:\s*([^|.]+?)(?:\.|$)/i) ||
                        cleanedResponse.match(/market[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for tags and limit to top 5
      const tagsMatch = cleanedResponse.match(/tags:\s*([^|.]+?)(?:\.|$)/i);
      let extractedTags: string[] = [];
      if (tagsMatch && tagsMatch[1]) {
        const allTags = tagsMatch[1].split(/[,]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
        // Limit to top 5 tags only
        extractedTags = allTags.slice(0, 5);
      }
      
      // Helper to clean extracted values
      const cleanExtractedValue = (value: string | null) => {
        if (!value) return null;
        return value
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      };
      
      return {
        companyDescription: cleanExtractedValue(companyMatch ? companyMatch[1] : null),
        valueProposition: cleanExtractedValue(valueMatch ? valueMatch[1] : null),
        businessNiche: cleanExtractedValue(nicheMatch ? nicheMatch[1] : null),
        tags: extractedTags.length > 0 ? extractedTags : null,
        screenshotUrl: screenshotMatch ? screenshotMatch[0].replace(/\)$/, '') : null,
        faviconUrl: faviconMatch ? faviconMatch[0].replace(/\)$/, '') : null
      };
    } catch (error) {
      console.error('Error parsing agent response:', error);
      return {
        companyDescription: null,
        valueProposition: null,
        businessNiche: null,
        tags: null,
        screenshotUrl: null,
        faviconUrl: null
      };
    }
  };

  const analyzeWebsite = async () => {
    if (!isReady || !websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    if (!userId) {
      toast.error('Authentication required. Please log in to analyze websites.');
      return;
    }

    setAnalyzing(true);
    setScreenshotLoading(true);
    clearProgress();
    
    // Clear all previous form data before starting new analysis
    setCompanyDescription("");
    setValueProposition("");
    setBusinessNiche("");
    setTags([]);
    setScreenshotUrl("");
    setFaviconUrl("");
    
    // Add detailed progress steps
    const progressSteps = [
      { message: '🔍 Finding website...', delay: 500 },
      { message: '🌐 Connecting to server...', delay: 800 },
      { message: '📄 Accessing home page...', delay: 1200 },
      { message: '🏗️ Analyzing site structure...', delay: 1000 },
      { message: '📝 Scanning page content...', delay: 1500 },
      { message: '📸 Capturing screenshot...', delay: 2000 },
      { message: '🎨 Getting favicon...', delay: 800 },
      { message: '🔎 Extracting business data...', delay: 1200 },
      { message: '🧠 Processing with AI...', delay: 2500 }
    ];

    // Show progress steps with realistic timing
    const showProgressSteps = async () => {
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        addProgressStep(step.message);
      }
    };

    // Start progress steps (don't await so it runs parallel to actual work)
    showProgressSteps();
    
    try {
      // Ensure URL has protocol and www
      let formattedUrl = websiteUrl;
      
      // Add https:// if no protocol
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Add www. if not present (but skip for subdomains)
      const urlObj = new URL(formattedUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Only add www. if:
      // 1. It doesn't already have www.
      // 2. It's not already a subdomain (no dots before the main domain)
      // 3. It's not localhost or an IP address
      if (!hostname.startsWith('www.') && 
          hostname.split('.').length === 2 && // Only domain.tld format
          !hostname.includes('localhost') &&
          !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) { // Not an IP address
        urlObj.hostname = `www.${hostname}`;
        formattedUrl = urlObj.toString();
      }

      // Generate unique IDs for the N8N request
      const requestId = crypto.randomUUID();
      const currentTime = new Date().toISOString();

      // Prepare N8N webhook payload
      const n8nPayload = {
        user_id: userId,
        user_mssg: formattedUrl, // Send the website URL as the message
        session_id: `${sessionId}_SOL_${Date.now()}`,
        agent_name: "SOL", // Using SOL as specified
        timestamp_of_call_made: currentTime,
        request_id: requestId
      };

      console.log('Sending N8N webhook request:', n8nPayload);
      
      // Call N8N webhook
      const n8nResponse = await callN8NWebhook(n8nPayload);
      
      console.log('N8N webhook response:', n8nResponse);
      
      // Parse the agent response to extract business information
      if (n8nResponse.agent_response) {
        const parsedData = parseAgentResponse(n8nResponse.agent_response);
        
        // Update form fields with extracted data (always set, even if empty)
        setCompanyDescription(parsedData.companyDescription || "");
        setValueProposition(parsedData.valueProposition || "");
        setBusinessNiche(parsedData.businessNiche || "");
        setTags(parsedData.tags || []);
        
        // Update screenshot URL state (React will handle UI update)
        if (parsedData.screenshotUrl) {
          setScreenshotUrl(parsedData.screenshotUrl);
          console.log('✅ Screenshot URL extracted and state updated:', parsedData.screenshotUrl);
        } else {
          console.log('⚠️ No screenshot URL found in agent response');
        }
        
        // Update favicon URL state
        if (parsedData.faviconUrl) {
          setFaviconUrl(parsedData.faviconUrl);
          console.log('✅ Favicon URL extracted:', parsedData.faviconUrl);
        } else {
          console.log('⚠️ No favicon URL found in agent response');
        }
        
        toast.success('Website analyzed successfully');
      } else {
        throw new Error('No agent response received from N8N webhook');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      toast.error('Failed to analyze website. Please try again.');
    } finally {
      setAnalyzing(false);
      setScreenshotLoading(false);
      clearProgress();
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Helper function to parse agent response and extract business information
  const parseAgentResponse = (agentResponse: string) => {
    try {
      console.log('🔍 Parsing agent response:', agentResponse);
      
      // First extract URLs before cleaning
      // Extract screenshot URL from the original response (before cleaning)
      const screenshotMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/screenshots\/[^\s)]*/i) ||
                             agentResponse.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/i);
      
      // Extract favicon URL from the original response (before cleaning) 
      const faviconMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/favicons\/[^\s)]*/i) ||
                          agentResponse.match(/https?:\/\/[^\s]*favicon[^\s)]*/i);
      
      console.log('🔍 Screenshot match result:', screenshotMatch);
      console.log('🔍 Favicon match result:', faviconMatch);
      
      // Clean the response by removing ALL HTML and markdown links first
      let cleanedResponse = agentResponse
        .replace(/<a[^>]*>.*?<\/a>/gi, '') // Remove all HTML anchor tags and their content
        .replace(/<[^>]*>/g, '') // Remove any other HTML tags
        .replace(/\[View[^\]]*\]\([^)]*\)/gi, '') // Remove all [View...] markdown links (including empty parentheses)
        .replace(/\[Download[^\]]*\]\([^)]*\)/gi, '') // Remove all [Download...] markdown links (including empty parentheses)
        .replace(/\[Link\]\([^)]*\)/gi, '') // Remove [Link] markdown (including empty parentheses)
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/https?:\/\/[^\s]+/gi, '') // Remove any remaining URLs
        .replace(/I've captured the following.*$/i, '') // Remove capture message and everything after
        .replace(/Could you please confirm.*$/i, '') // Remove confirmation request
        .replace(/- Screenshot:.*$/i, '') // Remove screenshot line
        .replace(/- Favicon:.*$/i, '') // Remove favicon line
        .replace(/\n+/g, ' ') // Replace multiple newlines with space
        .replace(/\s+/g, ' '); // Normalize whitespace
      
      // Look for company description
      const companyMatch = cleanedResponse.match(/company name:\s*([^|.]+?)(?:\.|$)/i) || 
                          cleanedResponse.match(/description:\s*([^|.]+?)(?:\.|$)/i) ||
                          cleanedResponse.match(/what.*company.*does[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for value proposition/takeaways
      const valueMatch = cleanedResponse.match(/takeaways:\s*([^|.]+?)(?:\.|$)/i) ||
                        cleanedResponse.match(/value proposition[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for business niche - extract only until period or end of line
      const nicheMatch = cleanedResponse.match(/niche:\s*([^|.]+?)(?:\.|$)/i) ||
                        cleanedResponse.match(/market[:\s]*([^|.]+?)(?:\.|$)/i);
      
      // Look for tags and limit to top 5
      const tagsMatch = cleanedResponse.match(/tags:\s*([^|.]+?)(?:\.|$)/i);
      let extractedTags: string[] = [];
      if (tagsMatch && tagsMatch[1]) {
        const allTags = tagsMatch[1].split(/[,]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
        // Limit to top 5 tags only
        extractedTags = allTags.slice(0, 5);
      }
      
      // Helper to clean extracted values
      const cleanExtractedValue = (value: string | null) => {
        if (!value) return null;
        return value
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      };
      
      return {
        companyDescription: cleanExtractedValue(companyMatch ? companyMatch[1] : null),
        valueProposition: cleanExtractedValue(valueMatch ? valueMatch[1] : null),
        businessNiche: cleanExtractedValue(nicheMatch ? nicheMatch[1] : null),
        tags: extractedTags.length > 0 ? extractedTags : null,
        screenshotUrl: screenshotMatch ? screenshotMatch[0].replace(/\)$/, '') : null,
        faviconUrl: faviconMatch ? faviconMatch[0].replace(/\)$/, '') : null
      };
    } catch (error) {
      console.error('Error parsing agent response:', error);
      return {
        companyDescription: null,
        valueProposition: null,
        businessNiche: null,
        tags: null,
        screenshotUrl: null,
        faviconUrl: null
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!isReady || !websiteUrl.trim()) return;
    
    setAnalyzing(true);
    setScreenshotLoading(true);
    clearProgress();
    
    // Clear all previous form data before starting new analysis
    setCompanyDescription("");
    setValueProposition("");
    setBusinessNiche("");
    setTags([]);
    setScreenshotUrl("");
    setFaviconUrl("");
    
    // Add detailed progress steps
    const progressStepsList = [
      { message: '🔍 Finding website...', delay: 500 },
      { message: '🌐 Connecting to server...', delay: 800 },
      { message: '📄 Accessing home page...', delay: 1200 },
      { message: '🏗️ Analyzing site structure...', delay: 1000 },
      { message: '📝 Scanning page content...', delay: 1500 },
      { message: '📸 Capturing screenshot...', delay: 2000 },
      { message: '🎨 Getting favicon...', delay: 800 },
      { message: '🔎 Extracting business data...', delay: 1200 },
      { message: '🧠 Processing with AI...', delay: 2500 }
    ];

    // Show progress steps with realistic timing
    const showProgressSteps = async () => {
      for (const step of progressStepsList) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        addProgressStep(step.message);
      }
    };

    // Start progress steps (don't await so it runs parallel to actual work)
    showProgressSteps();
    
    try {
      // Ensure URL has protocol and www
      let formattedUrl = websiteUrl;
      
      // Add https:// if no protocol
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Add www. if not present (but skip for subdomains)
      const urlObj = new URL(formattedUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Only add www. if:
      // 1. It doesn't already have www.
      // 2. It's not already a subdomain (no dots before the main domain)
      // 3. It's not localhost or an IP address
      if (!hostname.startsWith('www.') && 
          hostname.split('.').length === 2 && // Only domain.tld format
          !hostname.includes('localhost') &&
          !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) { // Not an IP address
        urlObj.hostname = `www.${hostname}`;
        formattedUrl = urlObj.toString();
      }
      
      if (!userId) {
        toast.error("Please log in to analyze websites");
        return;
      }

      // Generate unique IDs for the N8N request
      const requestId = crypto.randomUUID();
      const currentTime = new Date().toISOString();

      // Prepare N8N webhook payload
      const n8nPayload = {
        user_id: userId,
        user_mssg: formattedUrl, // Send the website URL as the message
        session_id: `${sessionId}_SOL_${Date.now()}`,
        agent_name: "SOL", // Using SOL as specified
        timestamp_of_call_made: currentTime,
        request_id: requestId
      };

      console.log('Sending N8N webhook request:', n8nPayload);
      
      // Call N8N webhook
      const n8nResponse = await callN8NWebhook(n8nPayload);
      
      console.log('N8N webhook response:', n8nResponse);
      
      // Parse the agent response to extract business information
      if (n8nResponse.agent_response) {
        const parsedData = parseAgentResponse(n8nResponse.agent_response);
        
        // Update form fields with extracted data (always set, even if empty)
        setCompanyDescription(parsedData.companyDescription || "");
        setValueProposition(parsedData.valueProposition || "");
        setBusinessNiche(parsedData.businessNiche || "");
        setTags(parsedData.tags || []);
        
        // Update screenshot URL state (React will handle UI update)
        if (parsedData.screenshotUrl) {
          setScreenshotUrl(parsedData.screenshotUrl);
          console.log('✅ Screenshot URL extracted and state updated:', parsedData.screenshotUrl);
        } else {
          console.log('⚠️ No screenshot URL found in agent response');
        }
        
        // Update favicon URL state
        if (parsedData.faviconUrl) {
          setFaviconUrl(parsedData.faviconUrl);
          console.log('✅ Favicon URL extracted:', parsedData.faviconUrl);
        } else {
          console.log('⚠️ No favicon URL found in agent response');
        }
        
        toast.success("Website analyzed successfully");
      } else {
        throw new Error('No agent response received from N8N webhook');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze website");
    } finally {
      setAnalyzing(false);
      setScreenshotLoading(false);
      clearProgress();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
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
    console.log('🔍 WebsiteDetails: handleContinue called', { userId, isReady });
    if (!isReady || !userId) {
      console.error('🔍 WebsiteDetails: Authentication check failed', { userId, isReady });
      toast.error('Authentication required. Please log in and try again.');
      return;
    }
    
    setLoading(true);
    try {
      
      // Save website analysis data to database
      toast.success('Saving website analysis...');

      const websiteAnalysisData = {
        firm_user_id: userId,
        agent_id: 'SOL',
        website_url: websiteUrl.startsWith('http') ? websiteUrl : `https://www.${websiteUrl}`,
        company_description: companyDescription.trim() || null,
        value_proposition: valueProposition.trim() || null,
        business_niche: businessNiche.trim() || null,
        tags: tags.length > 0 ? tags : null,
        screenshot_url: screenshotUrl.trim() || null,
        favicon_url: faviconUrl.trim() || null,
        analysis_status: 'completed'
      };

      // Double-check userId before API call
      if (!userId) {
        console.error('🔍 WebsiteDetails: userId became undefined before API call');
        throw new Error('User authentication lost. Please refresh the page and try again.');
      }

      console.log('🔍 WebsiteDetails: About to save website analysis with userId:', userId);
      const savedData = await saveWebsiteAnalysis({
        ...websiteAnalysisData,
        isAnalyzeButton: true // Continue button includes screenshots/favicons
      });
      
      console.log('[Newsletter] saveWebsiteAnalysis result:', savedData);
      console.log('[Newsletter] savedData.id:', savedData?.id);
      
      // Fire webhook asynchronously (doesn't block the UI)
      // This runs in the background without delaying navigation
      if (savedData?.id) {
        console.log('[Newsletter] Using saved website analysis ID for webhook:', savedData.id);
        newsletterWebhookService.fireWebhookAsync({
          firm_user_id: userId,
          id: savedData.id, // Use the actual saved record ID
          ghl_location_id: profile?.ghl_location_id || '', // Get from profile if available
          company_description: companyDescription.trim(),
          value_proposition: valueProposition.trim(),
          business_niche: businessNiche.trim(),
          ghl_user_id: profile?.ghl_user_id || user?.id || '' // Get from profile/user if available
        });
        
        console.log('[Newsletter] Webhook triggered in background for newsletter questions generation');
      } else {
        console.error('[Newsletter] Cannot fire webhook - no saved website analysis ID available');
        console.log('[Newsletter] savedData:', savedData);
      }
      
      toast.success('Website analysis saved!');

      // Update onboarding progress
      const existingData = await onboardingDataService.getOnboardingProgress(userId) || {};
      const existingCompletedSteps = existingData.completed_steps || [];
      const updatedCompletedSteps = existingCompletedSteps.includes(5) 
        ? existingCompletedSteps 
        : [...existingCompletedSteps, 5];
      
      await onboardingDataService.saveOnboardingProgress({
        ...existingData,
        user_id: userId,
        current_step: 6,
        completed_steps: updatedCompletedSteps,
        last_updated: new Date().toISOString()
      });

      toast.success('Website details saved successfully');
      navigate('/onboarding/business-details');
    } catch (error) {
      console.error('Error saving website details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save website details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/ai-onboarding/personalize');
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

  return (
    <OnboardingLayout
      stepTitle="Configure your website details"
      stepDescription="Please review if information from your website accurately describes your business. Edit if necessary."
      progress={progress}
      onContinue={isReady && userId ? handleContinue : undefined}
      onBack={handleBack}
      continueText="Continue"
      showActions={true}
      continueDisabled={!isReady || !userId}
    >
      {/* Form */}
      <div className="max-w-lg mx-auto">

        {/* Screenshot Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Screenshot
            {screenshotUrl && (
              <span className="ml-2 text-xs text-green-600 font-normal">
                ✓ From website analysis
              </span>
            )}
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden relative">
            {screenshotLoading && (
              <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10 p-4">
                <Loader2 className="w-8 h-8 text-squidgy-purple animate-spin mb-3" />
                {progressStep && (
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">{progressStep}</span>
                    <div className="text-xs text-gray-500 space-y-1">
                      {progressSteps.slice(-3).map((step, index) => (
                        <div key={index} className="opacity-60">{step}</div>
                      ))}
                    </div>
                  </div>
                )}
                {!progressStep && (
                  <span className="text-sm text-gray-600">Analyzing website...</span>
                )}
              </div>
            )}
            
            {/* Screenshot Loading Placeholder */}
            {analyzing && !screenshotUrl && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Capturing screenshot...</div>
                  <div className="text-xs text-gray-400">This may take a few seconds</div>
                </div>
              </div>
            )}
            
            {/* Screenshot Image */}
            {(!analyzing && screenshotUrl) && (
              <img 
                src={screenshotUrl}
                alt={`${websiteUrl} website screenshot`}
                className="w-full h-64 object-cover rounded-lg"
                onLoad={() => setScreenshotLoading(false)}
                onError={(e) => {
                  setScreenshotLoading(false);
                  console.log('⚠️ Screenshot failed to load');
                }}
              />
            )}
            
            {/* Screenshot Placeholder */}
            {(!analyzing && !screenshotUrl) && (
              <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Screenshot will be displayed here</div>
                  <div className="text-xs text-gray-400">Click "Analyze Website" to capture</div>
                </div>
              </div>
            )}
          </div>
          {!screenshotUrl && (
            <p className="text-xs text-gray-500 mt-1">
              Click "Analyze Website" to capture a screenshot of your website
            </p>
          )}
        </div>

        {/* Website URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Website URL</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyzeWebsite}
              disabled={!websiteUrl.trim() || analyzing || !isReady}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progressStep || 'Analyzing...'}
                </>
              ) : (
                'Analyze Website'
              )}
            </Button>
          </div>
          
          {/* Progress Steps Display */}
          {analyzing && progressSteps.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="text-xs font-medium text-gray-700 mb-2">Analysis Progress:</div>
              <div className="space-y-1">
                {progressSteps.slice(-4).map((step, index) => (
                  <div 
                    key={index} 
                    className={`text-xs flex items-center ${
                      index === progressSteps.slice(-4).length - 1 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-500'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      index === progressSteps.slice(-4).length - 1 
                        ? 'bg-blue-600' 
                        : 'bg-gray-400'
                    }`}></div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200 mt-2">
            💡 <strong>Tip:</strong> Click "Analyze Website" to automatically extract your business information from your website!
          </div>
        </div>

        {/* What the company does */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">What the company does</label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            className="w-full h-32 p-3 border border-grey-500 rounded-md text-text-primary text-base resize-none focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
          />
        </div>

        {/* Value proposition */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Value proposition (AI generated)</label>
          <textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            className="w-full h-36 p-3 border border-grey-500 rounded-md text-text-primary text-base resize-none focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
          />
        </div>

        {/* Business niche */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Business niche</label>
          <textarea
            value={businessNiche}
            onChange={(e) => setBusinessNiche(e.target.value)}
            className="w-full h-32 p-3 border border-grey-500 rounded-md text-text-primary text-base resize-none focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
          />
        </div>

        {/* Captured Content Section */}
        {(screenshotUrl || faviconUrl) && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-primary mb-2">Captured Content</label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-4">
                {screenshotUrl && (
                  <a 
                    href={screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-squidgy-purple text-white rounded-lg hover:bg-squidgy-purple/90 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Screenshot
                  </a>
                )}
                {faviconUrl && (
                  <a 
                    href={faviconUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    View Logo
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tags Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">Tags</label>
          <div className="relative mb-4">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Start typing to add more..."
              className="w-full p-3 pr-10 border border-grey-500 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
            />
            <button
              onClick={handleAddTag}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-primary hover:text-squidgy-purple transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tags Display */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <TagChip
                key={index}
                label={tag}
                onRemove={() => removeTag(index)}
              />
            ))}
          </div>
        </div>

      </div>
    </OnboardingLayout>
  );
}