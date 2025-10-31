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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📸';
      case 'TikTok': return '🎵';
      default: return '📱';
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
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Historical Social Posts</h1>
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
                      <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
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
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Historical Social Posts</h1>
                <p className="text-sm text-gray-500">{socialContent.length} content items total</p>
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
                    <button
                      onClick={() => handleContentClick(content)}
                      className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      View Details
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
                      💼 LinkedIn
                    </span>
                    <span className="inline-flex items-center gap-1">
                      📸 Instagram/Facebook
                    </span>
                    <span className="inline-flex items-center gap-1">
                      🎵 TikTok/Reels
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