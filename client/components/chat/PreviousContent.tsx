import React, { useState, useEffect } from 'react';
import { FileText, Share2, ExternalLink, Calendar, Clock } from 'lucide-react';
import ChatHistoryService, { 
  NewsletterHistory, 
  SocialContentHistory 
} from '../../services/chatHistoryService';
import { useUser } from '../../hooks/useUser';
import ScheduledContent from './ScheduledContent';

interface PreviousContentProps {
  className?: string;
  agentId?: string; // Add agentId to filter content
}

export default function PreviousContent({ className = '', agentId }: PreviousContentProps) {
  const { userId } = useUser();
  const [newsletters, setNewsletters] = useState<NewsletterHistory[]>([]);
  const [socialContent, setSocialContent] = useState<SocialContentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Only show Previous Content for agents that generate newsletters or social content
  const shouldShowPreviousContent = agentId === 'newsletter' || agentId === 'content_repurposer' || agentId === 'social_media_agent' || !agentId;

  useEffect(() => {
    if (shouldShowPreviousContent) {
      loadPreviousContent();
    }
  }, [userId, agentId, shouldShowPreviousContent]); // Re-run when agentId changes

  const loadPreviousContent = async () => {
    if (!userId) return;

    setLoading(true);
    
    // Clear existing state immediately when switching agents
    setNewsletters([]);
    setSocialContent([]);
    
    try {
      const chatService = ChatHistoryService.getInstance();
      
      
      // Load content based on agent type
      let newsletterData: NewsletterHistory[] = [];
      let socialData: SocialContentHistory[] = [];

      if (agentId === 'newsletter') {
        // Only load newsletters for newsletter agent
        newsletterData = await chatService.getPreviousNewsletters(userId);
      } else if (agentId === 'content_repurposer') {
        // Only load social content for content repurposer agent
        socialData = await chatService.getPreviousSocialContent(userId);
      } else if (!agentId) {
        // Load both if no specific agent (fallback)
        [newsletterData, socialData] = await Promise.all([
          chatService.getPreviousNewsletters(userId),
          chatService.getPreviousSocialContent(userId)
        ]);
      }
      // For other agents, don't load any content (arrays stay empty)

      setNewsletters(newsletterData);
      setSocialContent(socialData);
    } catch (error) {
      console.error('Error loading previous content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterClick = () => {
    if (newsletters.length === 0) return;
    
    // No need to store in localStorage anymore - historical page loads directly from database
    window.open('/historical-newsletters', '_blank');
  };

  const handleSocialContentClick = () => {
    if (socialContent.length === 0) return;
    
    // No need to store in localStorage anymore - historical page loads directly from database  
    window.open('/historical-social-posts', '_blank');
  };

  const formatCount = (count: number): string => {
    return count === 1 ? '1 item' : `${count} items`;
  };

  const getLatestDate = (content: { timestamp: string; created_at: string }[]): string => {
    if (content.length === 0) return '';
    
    const latest = content[0]; // Already sorted by timestamp desc
    const dateStr = latest.timestamp || latest.created_at;
    return ChatHistoryService.formatDate(dateStr);
  };

  // Clean HTML tags, JSON, and get readable text for preview
  const cleanContentPreview = (content: NewsletterHistory | SocialContentHistory): string => {
    let textContent = '';
    
    // Extract content based on type
    if ('newsletter_content' in content) {
      // Newsletter content
      textContent = content.newsletter_content || '';
    } else if ('social_content' in content) {
      // Social content
      textContent = content.social_content || '';
    }
    
    // Try to extract readable content from JSON
    if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(textContent);
        
        // For social media content, extract meaningful text
        if (parsed.LinkedIn && parsed.LinkedIn.Post1 && parsed.LinkedIn.Post1.Caption) {
          textContent = parsed.LinkedIn.Post1.Caption;
        } else if (parsed.InstagramFacebook && parsed.InstagramFacebook.Post1 && parsed.InstagramFacebook.Post1.Caption) {
          textContent = parsed.InstagramFacebook.Post1.Caption;
        } else if (parsed.TikTokReels && parsed.TikTokReels.Post1 && parsed.TikTokReels.Post1.Caption) {
          textContent = parsed.TikTokReels.Post1.Caption;
        } else {
          // Generic JSON - show descriptive text
          textContent = "Social media content generated";
        }
      } catch {
        // If JSON parsing fails, continue with text cleaning
      }
    }
    
    // Remove HTML tags
    const withoutTags = textContent.replace(/<[^>]*>/g, ' ');
    // Remove extra whitespace and normalize
    const normalized = withoutTags.replace(/\s+/g, ' ').trim();
    // Take first 60 characters for preview
    return normalized.length > 60 ? normalized.substring(0, 60) + '...' : normalized;
  };

  // Don't render anything for agents that don't generate content
  if (!shouldShowPreviousContent) {
    return null;
  }

  if (loading) {
    return (
      <div className={`previous-content-loading ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // For social_media_agent, don't show empty state - just show scheduled content
  if (agentId === 'social_media_agent') {
    return (
      <div className={`previous-content-container ${className}`}>
        <ScheduledContent agentId={agentId} />
      </div>
    );
  }

  if (newsletters.length === 0 && socialContent.length === 0) {
    return (
      <div className={`previous-content-empty ${className}`}>
        <div className="p-4 text-center text-gray-500 text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No previous content found</p>
          <p className="text-xs mt-1">Generate some newsletters or social posts to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`previous-content-container ${className}`}>
      <div className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-gray-700">Previous Content</h3>
        
        {/* Previous Newsletters */}
        {newsletters.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={handleNewsletterClick}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Previous Newsletters</p>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCount(newsletters.length)}{newsletters.length > 0 && ` • ${cleanContentPreview(newsletters[0])}`}
                  </p>
                  
                  {newsletters.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Latest: {getLatestDate(newsletters)}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Previous Social Content */}
        {socialContent.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={handleSocialContentClick}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Share2 className="w-4 h-4 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Previous Social content posts</p>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-500" />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCount(socialContent.length)}{socialContent.length > 0 && ` • ${cleanContentPreview(socialContent[0])}`}
                  </p>
                  
                  {socialContent.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Latest: {getLatestDate(socialContent)}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Scheduled Content - Only for social_media_agent */}
        {agentId === 'social_media_agent' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500" />
              <h4 className="text-sm font-semibold text-gray-700">Scheduled Content</h4>
            </div>
            <ScheduledContent agentId={agentId} />
          </div>
        )}
      </div>
    </div>
  );
}
