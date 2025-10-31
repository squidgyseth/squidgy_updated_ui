import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Wand2, 
  FileText,
  Heart,
  MessageCircle,
  Share,
  Send,
  MoreHorizontal
} from 'lucide-react';

interface SocialPost {
  id: string;
  platform: string;
  type: string;
  caption: string;
  imagePrompt?: string;
  videoConcept?: string;
  script?: string;
}

interface SocialMediaContent {
  LinkedIn?: Record<string, any>;
  InstagramFacebook?: Record<string, any>;
  TikTokReels?: Record<string, any>;
  GeneralAssets?: Record<string, any>;
}

export default function SocialMediaPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState('');

  useEffect(() => {
    // Load content from localStorage
    const storedContent = localStorage.getItem('socialMediaContent');
    if (storedContent) {
      try {
        const rawContent = JSON.parse(storedContent);
        let socialMediaContent: SocialMediaContent;

        // Handle different content structures
        if (Array.isArray(rawContent)) {
          // Check if first element has ContentRepurposerPosts
          if (rawContent[0] && rawContent[0].ContentRepurposerPosts) {
            socialMediaContent = rawContent[0].ContentRepurposerPosts;
          } else {
            socialMediaContent = rawContent[0] || {};
          }
        } else if (rawContent && typeof rawContent === 'object') {
          // Check for ContentRepurposerPosts wrapper
          if (rawContent.ContentRepurposerPosts) {
            socialMediaContent = rawContent.ContentRepurposerPosts;
          } else if (rawContent.LinkedIn || rawContent.InstagramFacebook || rawContent.TikTokReels) {
            // Direct social media content
            socialMediaContent = rawContent;
          } else {
            // Look for social media content in nested objects
            socialMediaContent = {};
            for (const [key, value] of Object.entries(rawContent)) {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (value.LinkedIn || value.InstagramFacebook || value.TikTokReels) {
                  socialMediaContent = value;
                  break;
                }
              }
              // Also check if the current object has social media keys
              if (['LinkedIn', 'InstagramFacebook', 'TikTokReels', 'GeneralAssets'].includes(key)) {
                socialMediaContent[key] = value;
              }
            }
          }
        } else {
          socialMediaContent = {};
        }

        console.log('Parsed social media content:', socialMediaContent);
        const parsedPosts = parseSocialMediaContent(socialMediaContent);
        console.log('Generated posts:', parsedPosts);
        setPosts(parsedPosts);
      } catch (error) {
        console.error('Error parsing social media content:', error);
      }
    }
  }, []);

  const parseSocialMediaContent = (content: SocialMediaContent): SocialPost[] => {
    const posts: SocialPost[] = [];
    let postId = 1;

    // Parse LinkedIn posts
    if (content.LinkedIn) {
      Object.entries(content.LinkedIn).forEach(([key, post]: [string, any]) => {
        posts.push({
          id: `linkedin-${postId++}`,
          platform: 'LinkedIn',
          type: 'post',
          caption: post.Caption || '',
          imagePrompt: post.ImagePrompt || ''
        });
      });
    }

    // Parse Instagram/Facebook posts
    if (content.InstagramFacebook) {
      Object.entries(content.InstagramFacebook).forEach(([key, post]: [string, any]) => {
        posts.push({
          id: `instagram-${postId++}`,
          platform: 'Instagram',
          type: 'post',
          caption: post.Caption || '',
          imagePrompt: post.ImagePrompt || ''
        });
      });
    }

    // Parse TikTok/Reels
    if (content.TikTokReels) {
      Object.entries(content.TikTokReels).forEach(([key, video]: [string, any]) => {
        posts.push({
          id: `tiktok-${postId++}`,
          platform: 'TikTok',
          type: 'video',
          caption: video.Script || '',
          videoConcept: video.Idea || ''
        });
      });
    }

    return posts;
  };

  const handleEditPost = (postId: string, currentCaption: string) => {
    setEditingPost(postId);
    setEditedCaption(currentCaption);
  };

  const handleSaveEdit = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, caption: editedCaption }
        : post
    ));
    setEditingPost(null);
    setEditedCaption('');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditedCaption('');
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
              <h1 className="text-xl font-semibold text-gray-900">Social Media Preview</h1>
            </div>
            
            <div className="text-sm text-gray-500">
              {posts.length} posts generated
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No social media content found. Generate content first in the chat.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
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

                {/* Image Placeholder */}
                <div className="bg-gray-100 h-64 flex items-center justify-center border-b border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Image will appear here</p>
                    <div className="flex gap-2 justify-center">
                      <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Custom Prompt
                      </button>
                      <button className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1">
                        <Wand2 className="w-3 h-3" />
                        Generate Image
                      </button>
                      <button className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Insert Image
                      </button>
                    </div>
                    {post.imagePrompt && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <strong>Generated prompt:</strong> {post.imagePrompt}
                      </div>
                    )}
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
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="mb-4">
                    {editingPost === post.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editedCaption}
                          onChange={(e) => setEditedCaption(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                          rows={6}
                          placeholder="Edit your caption..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(post.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
                        <button
                          onClick={() => handleEditPost(post.id, post.caption)}
                          className="absolute top-0 right-0 p-1 bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit caption"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

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
        )}
      </div>
    </div>
  );
}