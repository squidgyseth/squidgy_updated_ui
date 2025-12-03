import React from 'react';
import { ExternalLink, Share2, Copy, Image } from 'lucide-react';

interface SocialMediaPreviewProps {
  content: string;
  historyId?: string;
}

export default function SocialMediaPreview({ content, historyId }: SocialMediaPreviewProps) {
  // Parse the content to get platform counts
  const getPlatformCounts = () => {
    try {
      let data = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Handle error structure with raw JSON content
      if (data && data.error && data.raw) {
        try {
          // Extract JSON from markdown code blocks
          const rawContent = data.raw.replace(/```json\n|\n```/g, '');
          data = JSON.parse(rawContent);
        } catch {
          return {};
        }
      }
      
      const counts: Record<string, number> = {};
      
      if (data.LinkedIn) {
        counts.LinkedIn = Object.keys(data.LinkedIn).length;
      }
      if (data.InstagramFacebook) {
        counts['Instagram/Facebook'] = Object.keys(data.InstagramFacebook).length;
      }
      if (data.TikTokReels) {
        counts['TikTok/Reels'] = Object.keys(data.TikTokReels).length;
      }
      
      return counts;
    } catch {
      return {};
    }
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Social Media Content Generated</h3>
        </div>
        {historyId && (
          <button
            onClick={handleOpenInNewWindow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ExternalLink size={14} />
            Open Preview
          </button>
        )}
      </div>

      {/* Content Summary */}
      <div className="space-y-3">
        {/* Platform Breakdown */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">Generated {totalPosts} posts across platforms:</p>
          <div className="space-y-2">
            {Object.entries(counts).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{platform}</span>
                <span className="text-sm text-gray-600">{count} posts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            <Copy size={12} />
            <span>Copy to clipboard</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            <Image size={12} />
            <span>Image prompts included</span>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500">
          Click "Open Preview" to view, edit, and copy individual posts
        </p>
      </div>
    </div>
  );
}