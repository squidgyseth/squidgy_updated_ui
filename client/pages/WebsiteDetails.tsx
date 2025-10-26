import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { X, Menu, Globe, ChevronDown, Loader2 } from "lucide-react";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useUser } from '../hooks/useUser';
import { websiteApi, callN8NWebhook, saveWebsiteAnalysis, getWebsiteAnalysis } from '../lib/api';
import { ChatInterface } from '../components/ChatInterface';
import { UserAccountDropdown } from '../components/UserAccountDropdown';
import { SetupStepsSidebar } from '../components/SetupStepsSidebar';
import { createProxyUrl, maskStorageUrlsInText } from '../utils/urlMasking';

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



// Main Website Details Page Component
export default function WebsiteDetails() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, sessionId, agentId, isReady, user, profile } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  
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
  
  // Load existing data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (userId && !dataLoaded) {
        const existingData = await getWebsiteAnalysis(userId);
        console.log('🔍 WebsiteDetails: Loaded existing data:', existingData);
        
        if (existingData) {
          setWebsiteUrl(existingData.website_url || "");
          setCompanyDescription(existingData.company_description || "");
          setValueProposition(existingData.value_proposition || "");
          setBusinessNiche(existingData.business_niche || "");
          setTags(existingData.tags || []);
          setScreenshotUrl(existingData.screenshot_url || "");
          setFaviconUrl(existingData.favicon_url || "");
          setDataLoaded(true);
        } else {
          console.log('🔍 WebsiteDetails: No existing data found');
          setDataLoaded(true);
        }
      }
    };
    
    loadExistingData();
  }, [userId, dataLoaded]);

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
      
      // Clean the response by removing screenshot and favicon links
      let cleanedResponse = agentResponse;
      
      // Use the improved URL masking utility to handle all Supabase URLs
      cleanedResponse = maskStorageUrlsInText(cleanedResponse);
      
      // Additional specific cleaning for website analysis responses
      cleanedResponse = cleanedResponse.replace(/screenshot.*?(?:can be (?:viewed|accessed|found)|is available).*?\[here\]\([^)]+\)[^.]*\./gi, '');
      cleanedResponse = cleanedResponse.replace(/(?:I have also captured|captured) a screenshot.*?\[here\]\([^)]+\)[^.]*\./gi, '');
      cleanedResponse = cleanedResponse.replace(/favicon.*?(?:can be (?:viewed|accessed|found)|is available).*?\[here\]\([^)]+\)[^.]*\./gi, '');
      cleanedResponse = cleanedResponse.replace(/(?:and the |the )?favicon.*?\[here\]\([^)]+\)[^.]*\./gi, '');
      
      // Remove any remaining storage link references
      cleanedResponse = cleanedResponse.replace(/\[Link\]\s*[-.]/gi, '');
      cleanedResponse = cleanedResponse.replace(/\[Image\]\s*[-.]/gi, '');
      cleanedResponse = cleanedResponse.replace(/\[File\]\s*[-.]/gi, '');
      
      // Look for company description
      const companyMatch = cleanedResponse.match(/company name:\s*([^|]+)/i) || 
                          cleanedResponse.match(/description:\s*([^|]+)/i) ||
                          cleanedResponse.match(/what.*company.*does[:\s]*([^|]+)/i);
      
      // Look for value proposition/takeaways
      const valueMatch = cleanedResponse.match(/takeaways:\s*([^|]+)/i) ||
                        cleanedResponse.match(/value proposition[:\s]*([^|]+)/i);
      
      // Look for business niche
      const nicheMatch = cleanedResponse.match(/niche:\s*([^|]+)/i) ||
                        cleanedResponse.match(/market[:\s]*([^|]+)/i);
      
      // Look for tags and limit to top 5
      const tagsMatch = cleanedResponse.match(/tags:\s*([^|]+)/i);
      let extractedTags: string[] = [];
      if (tagsMatch && tagsMatch[1]) {
        const allTags = tagsMatch[1].split(/[,.]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
        // Limit to top 5 tags only
        extractedTags = allTags.slice(0, 5);
      }

      // Extract screenshot URL from the original response (before cleaning)
      const screenshotMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/screenshots\/[^\s]*/i) ||
                             agentResponse.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/i);
      
      // Extract favicon URL from the original response (before cleaning) 
      const faviconMatch = agentResponse.match(/https?:\/\/[^\s]*supabase[^\s]*\/favicons\/[^\s]*/i) ||
                          agentResponse.match(/https?:\/\/[^\s]*favicon[^\s]*/i);
      
      console.log('🔍 Screenshot match result:', screenshotMatch);
      console.log('🔍 Favicon match result:', faviconMatch);
      
      return {
        companyDescription: companyMatch ? companyMatch[1].trim() : null,
        valueProposition: valueMatch ? valueMatch[1].trim() : null,
        businessNiche: nicheMatch ? nicheMatch[1].trim() : null,
        tags: extractedTags.length > 0 ? extractedTags : null,
        screenshotUrl: screenshotMatch ? screenshotMatch[0] : null,
        faviconUrl: faviconMatch ? faviconMatch[0] : null
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
    
    setLoading(true);
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
      
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please log in to analyze websites",
          variant: "destructive"
        });
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
        
        toast({
          title: "Website analyzed successfully",
          description: "Form fields have been updated with AI analysis results."
        });
      } else {
        throw new Error('No agent response received from N8N webhook');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze website",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setScreenshotLoading(false);
      clearProgress();
    }
  };

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
      
      toast({
        title: "Website analyzed successfully",
        description: "Form fields have been updated with the analysis results from chat."
      });
    };

    window.addEventListener('websiteAnalysisComplete', handleWebsiteAnalysisComplete as EventListener);
    
    return () => {
      window.removeEventListener('websiteAnalysisComplete', handleWebsiteAnalysisComplete as EventListener);
    };
  }, [toast]);

  const handleContinue = async () => {
    if (!isReady || !userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      
      // Save website analysis data to database
      toast({
        title: "Saving website analysis...",
        description: "Storing your business information"
      });

      const websiteAnalysisData = {
        firm_user_id: userId,
        agent_id: 'SOL',
        website_url: websiteUrl.startsWith('http') ? websiteUrl : `https://www.${websiteUrl}`,
        company_description: companyDescription.trim() || null,
        value_proposition: valueProposition.trim() || null,
        business_niche: businessNiche.trim() || null,
        tags: tags.length > 0 ? tags : null,
        screenshot_url: screenshotUrl.trim() || null, // Capture screenshot URL
        favicon_url: faviconUrl.trim() || null, // Capture favicon URL
        analysis_status: 'completed'
      };

      await saveWebsiteAnalysis({
        ...websiteAnalysisData,
        isAnalyzeButton: true // Continue button includes screenshots/favicons
      });
      
      toast({
        title: "Website analysis saved!",
        description: "Your business information has been stored successfully"
      });

      toast({
        title: "Setup complete!",
        description: "Your Solar Sales Agent is ready to use"
      });
      
      navigate('/business-details');
    } catch (error) {
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Failed to complete agent setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-grey-700 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="w-6 h-6 bg-squidgy-gradient rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-bold text-lg text-text-primary">Squidgy</span>
          <UserAccountDropdown />
        </div>
        <button className="text-squidgy-purple font-bold text-sm px-5 py-3 rounded-button hover:bg-gray-50 transition-colors">
          Close (save draft)
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-grey-800">
        <div className="h-full w-32 bg-squidgy-gradient"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="p-5">
          <ChatInterface 
            agentName="Seth agent"
            agentDescription="Website Setup Assistant"
            context="website_setup"
          />
        </div>

        {/* Main Form Content */}
        <div className="flex-1 max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-8">Create an agent</h1>
          </div>

          {/* Form */}
          <div className="max-w-lg mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-squidgy-purple" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">1. Website details</h2>
              <p className="text-text-secondary text-sm">
                Please review if information from your website accurately describes your business. Edit if necessary.
              </p>
            </div>

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
                <img 
                  src={screenshotUrl ? createProxyUrl(screenshotUrl, 'image') : "https://api.builder.io/api/v1/image/assets/TEMP/f4d168c44c076c21cd4c9f5f8d6e8c8c8cb1fbed?width=840"}
                  alt={websiteUrl ? `${websiteUrl} website screenshot` : "Website screenshot placeholder"}
                  className="w-full h-64 object-cover"
                  onLoad={() => setScreenshotLoading(false)}
                  onError={(e) => {
                    setScreenshotLoading(false);
                    // Fallback to placeholder if screenshot fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "https://api.builder.io/api/v1/image/assets/TEMP/f4d168c44c076c21cd4c9f5f8d6e8c8c8cb1fbed?width=840") {
                      target.src = "https://api.builder.io/api/v1/image/assets/TEMP/f4d168c44c076c21cd4c9f5f8d6e8c8c8cb1fbed?width=840";
                      console.log('⚠️ Screenshot failed to load, using fallback');
                    }
                  }}
                />
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
                  disabled={!websiteUrl.trim() || loading || !isReady}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
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
              {loading && progressSteps.length > 0 && (
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
                💡 <strong>Tip:</strong> You can analyze your website using the button above OR by pasting the URL in the chat on the right - Seth will automatically extract your business information!
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
                  onClick={addTag}
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

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={loading || !isReady}
              className="w-full bg-squidgy-gradient text-white font-bold text-sm py-3 px-5 rounded-button hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 21 21">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.83333 10.1123H17.1667M17.1667 10.1123L12.1667 5.1123M17.1667 10.1123L12.1667 15.1123" />
              </svg>
            </button>
          </div>
        </div>

        {/* Setup Steps Sidebar */}
        <div className="hidden lg:block">
          <SetupStepsSidebar currentStep={1} />
        </div>
      </div>

      {/* Mobile Setup Steps Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full">
            <SetupStepsSidebar currentStep={1} />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
