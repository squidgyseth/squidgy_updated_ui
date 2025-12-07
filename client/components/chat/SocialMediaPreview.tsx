import React, { useMemo } from 'react';
import { ExternalLink, Share2 } from 'lucide-react';
import contentRepurposerParser from '../../services/contentRepurposerParser';
import { PLATFORM_NAMES } from '../../constants/platforms';

interface SocialMediaPreviewProps {
  content: string;
  historyId?: string;
}

export default function SocialMediaPreview({ content, historyId }: SocialMediaPreviewProps) {
  // Parse the content using our new parser
  const parsedContent = useMemo(() => {
    return contentRepurposerParser.parseContentResponse(content);
  }, [content]);

  // Get platform counts from parsed content
  const getPlatformCounts = () => {
    const counts: Record<string, number> = {};
    
    // Count social media posts
    parsedContent.posts.forEach(post => {
      const platformKey = post.platform === 'Instagram' ? PLATFORM_NAMES.INSTAGRAM_FACEBOOK : 
                         post.platform === 'TikTok' ? PLATFORM_NAMES.TIKTOK_REELS : 
                         post.platform === 'LinkedIn' ? PLATFORM_NAMES.LINKEDIN : post.platform;
      counts[platformKey] = (counts[platformKey] || 0) + 1;
    });
    
    // Count Additional Assets (GeneralAssets)
    if (parsedContent.generalAssets) {
      let additionalAssetsCount = 0;
      
      if (parsedContent.generalAssets.quotes?.length) {
        additionalAssetsCount += parsedContent.generalAssets.quotes.length;
      }
      if (parsedContent.generalAssets.tips?.length) {
        additionalAssetsCount += parsedContent.generalAssets.tips.length;
      }
      if (parsedContent.generalAssets.stats?.length) {
        additionalAssetsCount += parsedContent.generalAssets.stats.length;
      }
      if (parsedContent.generalAssets.faqs?.length) {
        additionalAssetsCount += parsedContent.generalAssets.faqs.length;
      }
      if (parsedContent.generalAssets.callToActions?.length) {
        additionalAssetsCount += parsedContent.generalAssets.callToActions.length;
      }
      
      if (additionalAssetsCount > 0) {
        counts[PLATFORM_NAMES.ADDITIONAL_ASSETS] = additionalAssetsCount;
      }
    }
    
    return counts;
  };

  const handleOpenInNewWindow = () => {
    if (historyId) {
      window.open(`/social-preview?history_id=${historyId}`, '_blank');
    }
  };

  const counts = getPlatformCounts();
  const totalPosts = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Social Media Content Generated</h3>
        </div>
        <button
          onClick={handleOpenInNewWindow}
          disabled={!historyId}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            historyId 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ExternalLink size={14} />
          {historyId ? 'Open Preview' : 'Processing...'}
        </button>
      </div>

      {/* Content Summary */}
      <div className="space-y-3">
        {/* Platform Breakdown */}
        <div className="bg-gray-50 rounded-lg p-3">
          {totalPosts > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-2">Generated {totalPosts} posts across platforms:</p>
              <div className="space-y-2">
                {Object.entries(counts).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{platform}</span>
                    <span className="text-sm text-gray-600">{count} posts</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Social media content generated successfully!</p>
          )}
        </div>
      </div>
    </div>
  );
}