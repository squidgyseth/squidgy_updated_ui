import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, ExternalLink } from 'lucide-react';

interface SocialMediaLinkProps {
  content: string;
  className?: string;
}

/**
 * Displays a clickable link to preview social media posts
 * Used when content_repurposer agent generates social media content
 */
export default function SocialMediaLink({ content, className = '' }: SocialMediaLinkProps) {
  const navigate = useNavigate();

  const handleViewPosts = () => {
    // Save content to localStorage for the preview page
    localStorage.setItem('socialMediaContent', content);
    // Navigate to social media preview page
    navigate('/social-preview');
  };

  return (
    <div className={`social-media-link-container ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Social Media Content Generated
            </h3>
            <p className="text-gray-600 mb-4">
              Your content has been successfully repurposed for multiple social media platforms.
            </p>
            
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <span className="inline-flex items-center gap-1">
                💼 LinkedIn
              </span>
              <span className="inline-flex items-center gap-1">
                📸 Instagram/Facebook
              </span>
              <span className="inline-flex items-center gap-1">
                🎵 TikTok/Reels
              </span>
            </div>

            <p className="text-gray-700 mb-4">
              Please click on the link for viewing the posts:{' '}
              <button
                onClick={handleViewPosts}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium underline"
              >
                social media posts
                <ExternalLink className="w-3 h-3" />
              </button>
            </p>

            <button
              onClick={handleViewPosts}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              View All Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}