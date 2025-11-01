import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { useUser } from '../hooks/useUser';
import ImageService, { ImageRecord } from '../services/imageService';
import { AgentConfigService } from '../services/agentConfigService';
import { toast } from 'sonner';
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
  MoreHorizontal,
  Loader2
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
  const [activeTab, setActiveTab] = useState<string>('LinkedIn');
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postImages, setPostImages] = useState<Record<string, ImageRecord[]>>({});
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [agentId, setAgentId] = useState<string>('content_repurposer');
  const { companyName, faviconUrl, isLoading } = useCompanyBranding();
  const { userId } = useUser();
  const imageService = ImageService.getInstance();
  const configService = AgentConfigService.getInstance();

  // Load agent config
  useEffect(() => {
    const loadAgentConfig = async () => {
      try {
        // Try to get agent ID from URL params first
        const paramAgentId = searchParams.get('agentId');
        if (paramAgentId) {
          setAgentId(paramAgentId);
        }
        
        const config = await configService.loadAgentConfig(agentId);
        if (config) {
          setAgentConfig(config);
          console.log(`Loaded ${config.agent.name} config for image generation`);
        } else {
          throw new Error(`Agent config not found for ${agentId}`);
        }
      } catch (error) {
        console.error('Error loading agent config:', error);
        // Fallback to default config structure
        setAgentConfig({
          n8n: {
            image_generator_url: 'https://n8n.theaiteam.uk/webhook/image_generator'
          }
        });
      }
    };

    loadAgentConfig();
  }, [agentId, searchParams, configService]);

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
        
        // Set the first platform with posts as active tab
        const platforms = [...new Set(parsedPosts.map(post => post.platform))];
        if (platforms.length > 0) {
          setActiveTab(platforms[0]);
        }
        
        // Load existing images for all posts
        loadPostImages(parsedPosts);
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

    // Parse General Assets
    if (content.GeneralAssets) {
      Object.entries(content.GeneralAssets).forEach(([key, asset]: [string, any]) => {
        // Handle different types of content in GeneralAssets
        if (typeof asset === 'string') {
          // If it's a simple string, create one post
          posts.push({
            id: `general-${postId++}`,
            platform: 'General',
            type: 'asset',
            caption: asset,
            imagePrompt: ''
          });
        } else if (typeof asset === 'object' && asset !== null) {
          // If it's an object, it might have structured content
          if (asset.Caption || asset.Description || asset.Content) {
            posts.push({
              id: `general-${postId++}`,
              platform: 'General',
              type: 'asset',
              caption: asset.Caption || asset.Description || asset.Content || '',
              imagePrompt: asset.ImagePrompt || asset.Prompt || ''
            });
          } else {
            // Handle other structured content - create separate posts for each type
            Object.entries(asset).forEach(([subKey, subContent]: [string, any]) => {
              if (typeof subContent === 'string' && subContent.trim()) {
                posts.push({
                  id: `general-${postId++}`,
                  platform: 'General',
                  type: 'asset',
                  caption: `${subKey}:\n\n${subContent}`,
                  imagePrompt: ''
                });
              }
            });
          }
        }
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

  const handleCustomPromptClick = (postId: string) => {
    setCurrentPostId(postId);
    setCustomPrompt('');
    setShowCustomPromptModal(true);
  };

  const handleGenerateImageClick = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post?.imagePrompt || !userId) return;
    
    setCurrentPostId(postId);
    setGeneratingImage(true);
    
    try {
      // Generate and save image using existing prompt
      const imageRecord = await imageService.generateAndSaveImage(
        post.imagePrompt,
        userId,
        agentId,
        post.platform,
        post.id,
        post.caption,
        'auto',
        agentConfig?.n8n?.image_generator_url
      );

      // Update local state
      setPostImages(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), imageRecord]
      }));

      toast.success('🎨 Image generated and saved successfully!', {
        description: `Auto-generated image for ${post.platform} post`
      });

      setGeneratingImage(false);
      setCurrentPostId(null);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image', {
        description: 'Please try again or check your connection'
      });
      setGeneratingImage(false);
      setCurrentPostId(null);
    }
  };

  const handleInsertImageClick = (postId: string) => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !userId) return;
      
      setUploadingImage(true);
      setCurrentPostId(postId);
      
      try {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        // Upload and save image
        const imageRecord = await imageService.uploadAndSaveImage(
          file,
          userId,
          agentId,
          post.platform,
          post.id,
          post.caption
        );

        // Update local state
        setPostImages(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), imageRecord]
        }));

        toast.success('📁 Image uploaded and saved successfully!', {
          description: `Image uploaded for ${post.platform} post`
        });

        setUploadingImage(false);
        setCurrentPostId(null);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image', {
          description: 'Please try again or check your file format'
        });
        setUploadingImage(false);
        setCurrentPostId(null);
      }
    };
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  const loadPostImages = async (postsToLoad: SocialPost[]) => {
    if (!userId) return;
    
    try {
      const imagesMap: Record<string, ImageRecord[]> = {};
      
      // Load images for each post
      for (const post of postsToLoad) {
        const images = await imageService.getPostImages(
          userId,
          agentId,
          post.id
        );
        imagesMap[post.id] = images;
      }
      
      setPostImages(imagesMap);
    } catch (error) {
      console.error('Error loading post images:', error);
    }
  };

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim() || !currentPostId || !userId) return;
    
    setGeneratingImage(true);
    
    try {
      const post = posts.find(p => p.id === currentPostId);
      if (!post) return;

      // Generate and save image
      const imageRecord = await imageService.generateAndSaveImage(
        customPrompt,
        userId,
        agentId,
        post.platform,
        post.id,
        post.caption,
        'custom',
        agentConfig?.n8n?.image_generator_url
      );

      // Update local state
      setPostImages(prev => ({
        ...prev,
        [currentPostId]: [...(prev[currentPostId] || []), imageRecord]
      }));

      toast.success('✨ Custom image generated and saved!', {
        description: `Custom image created for ${post.platform} post`
      });

      setGeneratingImage(false);
      setShowCustomPromptModal(false);
      setCustomPrompt('');
      setCurrentPostId(null);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate custom image', {
        description: 'Please try again or modify your prompt'
      });
      setGeneratingImage(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return 'bg-blue-600';
      case 'Instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'TikTok': return 'bg-black';
      case 'General': return 'bg-squidgy-gradient';
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
      case 'General': 
        return (
          <svg className={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

  // Group posts by platform
  const groupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.platform]) {
      acc[post.platform] = [];
    }
    acc[post.platform].push(post);
    return acc;
  }, {} as Record<string, SocialPost[]>);

  const platforms = Object.keys(groupedPosts);
  const activePosts = groupedPosts[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Close current tab and go back to historical social posts
                  window.close();
                  // Fallback if window.close() doesn't work
                  navigate('/historical-social-posts');
                }}
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

      {/* Platform Tabs */}
      {platforms.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {platforms.map((platform) => {
                const isActive = activeTab === platform;
                let borderColor = 'border-transparent';
                let textColor = 'text-gray-500';
                
                if (isActive) {
                  if (platform === 'LinkedIn') {
                    borderColor = 'border-blue-500';
                    textColor = 'text-blue-600';
                  } else if (platform === 'Instagram') {
                    borderColor = 'border-pink-500';
                    textColor = 'text-pink-600';
                  } else if (platform === 'TikTok') {
                    borderColor = 'border-black';
                    textColor = 'text-black';
                  } else if (platform === 'General') {
                    borderColor = 'border-squidgy-purple';
                    textColor = 'text-squidgy-purple';
                  }
                }
                
                return (
                  <button
                    key={platform}
                    onClick={() => setActiveTab(platform)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${borderColor} ${textColor} ${!isActive ? 'hover:text-gray-700 hover:border-gray-300' : ''}`}
                  >
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform, 'w-5 h-5')}
                    <span>{platform}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {groupedPosts[platform].length}
                    </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No social media content found. Generate content first in the chat.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activePosts.map((post) => (
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
                        <p className="text-sm opacity-90">
                          {post.type === 'video' ? 'Video Content' : 
                           post.type === 'asset' ? 'General Asset' : 'Post'}
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                </div>

                {/* Image Section - only for non-General platforms */}
                {post.platform !== 'General' && (
                  <div className="bg-gray-100 border-b border-gray-200">
                    {postImages[post.id] && postImages[post.id].length > 0 ? (
                      /* Image Carousel */
                      <div className="relative">
                        <div className="h-64 flex overflow-x-auto gap-2 p-4">
                          {postImages[post.id].map((image, index) => (
                            <div key={image.id} className="flex-shrink-0 relative">
                              <img
                                src={image.image_url}
                                alt={`Generated image ${index + 1}`}
                                className="h-56 w-auto object-cover rounded-lg"
                                onError={(e) => {
                                  console.error('Error loading image:', image.image_url);
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBmYWlsZWQgdG8gbG9hZDwvdGV4dD48L3N2Zz4=';
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (confirm('Delete this image?')) {
                                    imageService.deleteImage(image.id!, userId!).then(() => {
                                      setPostImages(prev => ({
                                        ...prev,
                                        [post.id]: prev[post.id].filter(img => img.id !== image.id)
                                      }));
                                      toast.success('🗑️ Image deleted successfully!', {
                                        description: `Image removed from ${post.platform} post`
                                      });
                                    }).catch((error) => {
                                      console.error(error);
                                      toast.error('Failed to delete image', {
                                        description: 'Please try again'
                                      });
                                    });
                                  }
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                title="Delete image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Action buttons below images */}
                        <div className="p-4 bg-gray-50">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => handleCustomPromptClick(post.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Custom Prompt
                            </button>
                            <button 
                              onClick={() => handleGenerateImageClick(post.id)}
                              disabled={!post.imagePrompt || generatingImage}
                              className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingImage && currentPostId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              Generate Image
                            </button>
                            <button 
                              onClick={() => handleInsertImageClick(post.id)}
                              disabled={uploadingImage}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingImage && currentPostId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Insert Image
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* No images placeholder */
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 mb-4">Image will appear here</p>
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => handleCustomPromptClick(post.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Custom Prompt
                            </button>
                            <button 
                              onClick={() => handleGenerateImageClick(post.id)}
                              disabled={!post.imagePrompt || generatingImage}
                              className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingImage && currentPostId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              Generate Image
                            </button>
                            <button 
                              onClick={() => handleInsertImageClick(post.id)}
                              disabled={uploadingImage}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingImage && currentPostId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Insert Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  {/* Company info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {!isLoading && faviconUrl ? (
                        <img 
                          src={faviconUrl} 
                          alt={`${companyName} logo`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to company initials if favicon fails to load
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span 
                        className="text-sm font-semibold text-gray-600" 
                        style={{ display: (!isLoading && faviconUrl) ? 'none' : 'flex' }}
                      >
                        {isLoading ? '...' : (companyName ? companyName.substring(0, 2).toUpperCase() : 'YC')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isLoading ? 'Loading...' : (companyName || 'Your Company')}
                      </p>
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

      {/* Custom Prompt Modal */}
      {showCustomPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Custom Image Prompt</h3>
              <button
                onClick={() => setShowCustomPromptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the image you want to generate:
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom image prompt here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomPromptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomPromptSubmit}
                  disabled={!customPrompt.trim() || generatingImage}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}