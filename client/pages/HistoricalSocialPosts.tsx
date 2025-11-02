import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Share2, 
  ExternalLink, 
  Heart,
  MessageCircle,
  Share,
  Send,
  MoreHorizontal
} from 'lucide-react';
import ChatHistoryService, { SocialContentHistory } from '../services/chatHistoryService';

interface ParsedSocialPost {
  id: string;
  platform: string;
  type: string;
  caption: string;
  imagePrompt?: string;
  videoConcept?: string;
  originalData: any;
}

export default function HistoricalSocialPosts() {
  const navigate = useNavigate();
  const [socialContent, setSocialContent] = useState<SocialContentHistory[]>([]);
  const [groupedContent, setGroupedContent] = useState<Record<string, SocialContentHistory[]>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<SocialContentHistory | null>(null);
  const [parsedPosts, setParsedPosts] = useState<ParsedSocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialContent();
  }, []);

  const loadSocialContent = () => {
    try {
      const storedContent = localStorage.getItem('historicalSocialContent');
      if (storedContent) {
        const parsedContent: SocialContentHistory[] = JSON.parse(storedContent);
        setSocialContent(parsedContent);
        
        // Group by date
        const grouped = ChatHistoryService.groupContentByDate(parsedContent);
        setGroupedContent(grouped);
        
        // Set first date as active tab
        const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (dates.length > 0) {
          setActiveTab(dates[0]);
        }
      }
    } catch (error) {
      console.error('Error loading social content:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseSocialMediaContent = (contentStr: string): ParsedSocialPost[] => {
    try {
      const content = JSON.parse(contentStr);
      const posts: ParsedSocialPost[] = [];
      let postId = 1;

      // Handle ContentRepurposerPosts wrapper
      let socialMediaContent = content;
      if (content.ContentRepurposerPosts) {
        socialMediaContent = content.ContentRepurposerPosts;
      }

      // Parse LinkedIn posts
      if (socialMediaContent.LinkedIn) {
        Object.entries(socialMediaContent.LinkedIn).forEach(([key, post]: [string, any]) => {
          posts.push({
            id: `linkedin-${postId++}`,
            platform: 'LinkedIn',
            type: 'post',
            caption: post.Caption || '',
            imagePrompt: post.ImagePrompt || '',
            originalData: post
          });
        });
      }

      // Parse Instagram/Facebook posts
      if (socialMediaContent.InstagramFacebook) {
        Object.entries(socialMediaContent.InstagramFacebook).forEach(([key, post]: [string, any]) => {
          posts.push({
            id: `instagram-${postId++}`,
            platform: 'Instagram',
            type: 'post',
            caption: post.Caption || '',
            imagePrompt: post.ImagePrompt || '',
            originalData: post
          });
        });
      }

      // Parse TikTok/Reels
      if (socialMediaContent.TikTokReels) {
        Object.entries(socialMediaContent.TikTokReels).forEach(([key, video]: [string, any]) => {
          posts.push({
            id: `tiktok-${postId++}`,
            platform: 'TikTok',
            type: 'video',
            caption: video.Script || '',
            videoConcept: video.Idea || '',
            originalData: video
          });
        });
      }

      return posts;
    } catch (error) {
      console.error('Error parsing social media content:', error);
      return [];
    }
  };

  const handleContentClick = (content: SocialContentHistory) => {
    setSelectedContent(content);
    const posts = parseSocialMediaContent(content.message);
    setParsedPosts(posts);
  };

  const handleBackToList = () => {
    setSelectedContent(null);
    setParsedPosts([]);
  };

  const handlePreviewContent = (content: SocialContentHistory) => {
    // Save to localStorage for preview page
    localStorage.setItem('socialMediaContent', content.message);
    window.open('/social-preview', '_blank');
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return 'bg-blue-600';
      case 'Instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'TikTok': return 'bg-black';
      default: return 'bg-gray-600';
    }
  };

  const getPlatformIcon = (platform: string, size: string = 'w-5 h-5') => {
    switch (platform) {
      case 'LinkedIn': 
        return (
          <svg className={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        );
      case 'Instagram': 
        return (
          <svg className={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12c0-3.403 2.759-6.162 6.162-6.162s6.162 2.759 6.162 6.162c0 3.403-2.759 6.162-6.162 6.162s-6.162-2.759-6.162-6.162zm12.162 0c0-2.298-1.864-4.162-4.162-4.162s-4.162 1.864-4.162 4.162c0 2.298 1.864 4.162 4.162 4.162s4.162-1.864 4.162-4.162zm2.588-6.461c0 .796-.646 1.442-1.442 1.442s-1.442-.646-1.442-1.442.646-1.441 1.442-1.441 1.442.645 1.442 1.441z"/>
          </svg>
        );
      case 'TikTok': 
        return (
          <svg className={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      default: 
        return (
          <svg className={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const getPreviewText = (jsonContent: string): string => {
    try {
      const parsed = JSON.parse(jsonContent);
      let platforms = [];
      
      if (parsed.ContentRepurposerPosts) {
        if (parsed.ContentRepurposerPosts.LinkedIn) platforms.push('LinkedIn');
        if (parsed.ContentRepurposerPosts.InstagramFacebook) platforms.push('Instagram/Facebook');
        if (parsed.ContentRepurposerPosts.TikTokReels) platforms.push('TikTok/Reels');
      } else {
        if (parsed.LinkedIn) platforms.push('LinkedIn');
        if (parsed.InstagramFacebook) platforms.push('Instagram/Facebook');
        if (parsed.TikTokReels) platforms.push('TikTok/Reels');
      }
      
      return `Content generated for: ${platforms.join(', ')}`;
    } catch {
      return 'Social media content available';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (socialContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/chat/content_repurposer')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go back to chat"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Social Media Posts</h1>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Social Posts Found</h2>
          <p className="text-gray-500">Generate some social media content in the chat to see it here.</p>
        </div>
      </div>
    );
  }

  if (selectedContent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to social posts"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Social Posts Details</h1>
                  <p className="text-sm text-gray-500">
                    {ChatHistoryService.formatDate(selectedContent.timestamp)} • {parsedPosts.length} posts
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handlePreviewContent(selectedContent)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Full Preview
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {parsedPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Platform Header */}
                <div className={`${getPlatformColor(post.platform)} text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {getPlatformIcon(post.platform, 'w-6 h-6')}
                      </div>
                      <div>
                        <h3 className="font-semibold">{post.platform}</h3>
                        <p className="text-sm opacity-90">{post.type === 'video' ? 'Video Content' : 'Post'}</p>
                      </div>
                    </div>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  {/* User info mockup */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">YC</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Your Company</p>
                      <p className="text-xs text-gray-500">Historical post</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
                  </div>

                  {/* Image prompt */}
                  {post.imagePrompt && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-700 mb-1">Image Prompt:</p>
                      <p className="text-sm text-blue-600">{post.imagePrompt}</p>
                    </div>
                  )}

                  {/* Video concept for TikTok */}
                  {post.videoConcept && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-semibold text-purple-700 mb-1">Video Concept:</p>
                      <p className="text-sm text-purple-600">{post.videoConcept}</p>
                    </div>
                  )}

                  {/* Engagement buttons */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                      <Share className="w-5 h-5" />
                      <span className="text-sm">Share</span>
                    </button>
                    {post.platform === 'LinkedIn' && (
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <Send className="w-5 h-5" />
                        <span className="text-sm">Send</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dates = Object.keys(groupedContent).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const activeContent = groupedContent[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chat/content_repurposer')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back to chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Social Media Posts</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveTab(date)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === date
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{ChatHistoryService.formatDate(date)}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {groupedContent[date].length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social Content List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {activeContent.map((content, index) => (
            <div
              key={content.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Share2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Social Content #{activeContent.length - index}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {ChatHistoryService.formatDate(content.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewContent(content)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {getPreviewText(content.message)}
                  </p>
                  
                  {/* Platform indicators */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      {getPlatformIcon('LinkedIn', 'w-3 h-3')} LinkedIn
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {getPlatformIcon('Instagram', 'w-3 h-3')} Instagram/Facebook
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {getPlatformIcon('TikTok', 'w-3 h-3')} TikTok/Reels
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}