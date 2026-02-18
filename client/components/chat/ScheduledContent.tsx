import React, { useState, useEffect } from 'react';
import { Clock, Calendar, RefreshCw, Facebook, Instagram, Linkedin, Twitter, CheckCircle } from 'lucide-react';
import scheduledPostsService, { ScheduledPost } from '../../services/scheduledPostsService';
import { useUser } from '../../hooks/useUser';

interface ScheduledContentProps {
  className?: string;
  agentId?: string;
}

const PlatformIcon: React.FC<{ platform: string; size?: number }> = ({ platform, size = 14 }) => {
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('facebook')) return <Facebook size={size} className="text-blue-600" />;
  if (platformLower.includes('instagram')) return <Instagram size={size} className="text-pink-600" />;
  if (platformLower.includes('linkedin')) return <Linkedin size={size} className="text-blue-700" />;
  if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter size={size} className="text-sky-500" />;
  
  return <Clock size={size} className="text-gray-500" />;
};

export default function ScheduledContent({ className = '', agentId }: ScheduledContentProps) {
  const { userId } = useUser();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Only show for social_media_agent
  const shouldShow = agentId === 'social_media_agent';

  useEffect(() => {
    if (shouldShow && userId) {
      loadScheduledPosts();
    }
  }, [userId, agentId, shouldShow]);

  const loadScheduledPosts = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await scheduledPostsService.getScheduledPosts(userId);
      
      if (response.success) {
        setScheduledPosts(response.posts);
      } else {
        setError(response.error || 'Failed to load posts');
        setScheduledPosts([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
      setScheduledPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScheduledPosts();
    setRefreshing(false);
  };

  if (!shouldShow) {
    return null;
  }

  if (loading) {
    return (
      <div className={`scheduled-content-loading ${className}`}>
        <div className="p-2">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`scheduled-content-error ${className}`}>
        <div className="p-2 text-center">
          <p className="text-[9px] text-gray-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-1 text-[9px] text-purple-600 hover:text-purple-700 flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={10} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (scheduledPosts.length === 0) {
    return (
      <div className={`scheduled-content-empty ${className}`}>
        <div className="p-2 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-gray-300" />
          <p className="text-[9px] text-gray-400">No social media posts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`scheduled-content-container ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-orange-500" />
          <span className="text-[9px] font-medium text-gray-600">
            Social Posts ({scheduledPosts.length})
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw size={10} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Posts list */}
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {scheduledPosts.slice(0, 5).map((post, index) => (
          <div
            key={(post as any)._id || post.id || index}
            className="bg-white border border-gray-100 rounded p-1.5 hover:border-orange-200 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-1.5">
              {/* Platform icon */}
              <div className="flex-shrink-0 mt-0.5">
                <PlatformIcon platform={(post as any).platform || scheduledPostsService.getPlatformName(post)} size={12} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-gray-700 line-clamp-2 leading-tight">
                  {scheduledPostsService.getContentPreview(post, 80)}
                </p>
                
                {/* Status and date info */}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] font-medium ${scheduledPostsService.getStatusDisplay(post).color}`}>
                    {scheduledPostsService.getStatusDisplay(post).label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Calendar size={8} className="text-gray-400" />
                    <span className="text-[8px] text-gray-400">
                      {scheduledPostsService.formatScheduledDate(post)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {scheduledPosts.length > 5 && (
          <p className="text-[8px] text-gray-400 text-center pt-1">
            +{scheduledPosts.length - 5} more posts
          </p>
        )}
      </div>
    </div>
  );
}
