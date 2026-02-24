import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, RefreshCw, Facebook, Instagram, Linkedin, Twitter, X, ChevronDown, ChevronUp, Pencil, Trash2, Archive } from 'lucide-react';
import scheduledPostsService, { ScheduledPost } from '../../services/scheduledPostsService';
import { useUser } from '../../hooks/useUser';
import { supabase } from '../../lib/supabase';

interface ScheduledContentProps {
  className?: string;
  agentId?: string;
}

const PlatformIcon: React.FC<{ platform: string; size?: number; className?: string }> = ({ platform, size = 14, className = '' }) => {
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('facebook')) return <Facebook size={size} className={`text-blue-600 ${className}`} />;
  if (platformLower.includes('instagram')) return <Instagram size={size} className={`text-pink-600 ${className}`} />;
  if (platformLower.includes('linkedin')) return <Linkedin size={size} className={`text-blue-700 ${className}`} />;
  if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter size={size} className={`text-sky-500 ${className}`} />;
  
  return <Clock size={size} className={`text-gray-500 ${className}`} />;
};

// Edit post modal
const EditPostModal: React.FC<{ 
  post: any; 
  onClose: () => void; 
  onSave: (postId: string, summary: string, scheduleDate: string, accountIds: string[]) => Promise<void>; 
  onPostpone: (postId: string) => Promise<void>;
  isSaving: boolean;
  isPostponing: boolean;
  userId: string;
}> = ({ post, onClose, onSave, onPostpone, isSaving, isPostponing, userId }) => {
  const [summary, setSummary] = useState(post.summary || '');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const date = post.scheduleDate || post.displayDate || '';
    if (date) {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    }
    return '';
  });
  const [accounts, setAccounts] = useState<{ id: string; platform: string }[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(post.accountIds || []);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      const result = await scheduledPostsService.getAccounts(userId);
      if (result.success) {
        setAccounts(result.accounts);
      }
      setLoadingAccounts(false);
    };
    loadAccounts();
  }, [userId]);

  const handleSave = () => {
    onSave(post._id || post.id, summary, new Date(scheduleDate).toISOString(), selectedAccountIds);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-purple-600 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-white">
            <Pencil size={18} />
            <span className="font-semibold text-sm">Edit Post</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post Content</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="Enter your post content..."
            />
          </div>
          
          {/* Schedule Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post to Accounts</label>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                Loading accounts...
              </div>
            ) : accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map(account => (
                  <label 
                    key={account.id} 
                    className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <PlatformIcon platform={account.platform} size={16} />
                    <span className="text-sm text-gray-700 capitalize">{account.platform}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No connected accounts found</p>
            )}
          </div>
          
          {/* Media preview (read-only) */}
          {post.media && post.media.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media (cannot be changed)</label>
              <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                <img 
                  src={post.media[0]?.url} 
                  alt="Post media" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={() => onPostpone(post._id || post.id)}
            disabled={isPostponing || isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPostponing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Drafting...
              </>
            ) : (
              <>
                <Archive size={14} />
                Draft
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving || isPostponing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isPostponing || !summary.trim() || selectedAccountIds.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Platform-specific post preview modal
const PostPreviewModal: React.FC<{ post: any; onClose: () => void; onDelete: (postId: string) => Promise<void>; onEdit: () => void; isDeleting: boolean }> = ({ post, onClose, onDelete, onEdit, isDeleting }) => {
  const platform = post.platform?.toLowerCase() || 'facebook';
  const content = post.summary || '';
  const media = post.media || [];
  const hasMedia = media.length > 0;
  const dateStr = scheduledPostsService.formatPostDate(post as ScheduledPost);
  
  const getPlatformColors = () => {
    switch (platform) {
      case 'instagram': return { bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', header: 'Instagram' };
      case 'linkedin': return { bg: 'bg-blue-700', header: 'LinkedIn' };
      case 'twitter': return { bg: 'bg-sky-500', header: 'Twitter / X' };
      default: return { bg: 'bg-blue-600', header: 'Facebook' };
    }
  };
  
  const { bg, header } = getPlatformColors();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Platform header */}
        <div className={`${bg} px-4 py-2.5 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-2 text-white">
            <PlatformIcon platform={platform} size={18} className="text-white" />
            <span className="font-semibold text-sm">{header}</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
        
        {/* Media with overlaid user info */}
        {hasMedia ? (
          <div className="relative">
            {/* User info overlay on top of image */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <span className="text-gray-600 text-xs font-bold">U</span>
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Your Business</p>
                  <p className="text-[10px] text-white/80">{dateStr}</p>
                </div>
              </div>
            </div>
            
            {/* Image */}
            <img 
              src={media[0]?.url} 
              alt="Post media" 
              className="w-full object-contain max-h-[350px] bg-black"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            
            {/* Actions overlay on bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-4 text-white text-xs">
                <span className="hover:text-white/80 cursor-pointer">❤️ Like</span>
                <span className="hover:text-white/80 cursor-pointer">💬 Comment</span>
                <span className="hover:text-white/80 cursor-pointer">↗️ Share</span>
              </div>
            </div>
          </div>
        ) : (
          /* No media - show user info normally */
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">U</span>
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-900">Your Business</p>
                <p className="text-[10px] text-gray-500">{dateStr}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Post text */}
        {content && (
          <div className="p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>
        )}
        
        {/* Actions for non-media posts */}
        {!hasMedia && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-4 text-gray-500 text-xs pt-2 border-t border-gray-100">
              <span className="hover:text-gray-700 cursor-pointer">❤️ Like</span>
              <span className="hover:text-gray-700 cursor-pointer">💬 Comment</span>
              <span className="hover:text-gray-700 cursor-pointer">↗️ Share</span>
            </div>
          </div>
        )}
        
        {/* Status footer - always visible */}
        <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-200 sticky bottom-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${scheduledPostsService.getStatusDisplay(post as ScheduledPost).color}`}>
              {scheduledPostsService.getStatusDisplay(post as ScheduledPost).label}
            </span>
            <span className="text-xs text-gray-500">{dateStr}</span>
          </div>
          
          {/* Action buttons - only show for non-published posts */}
          {post.status?.toLowerCase() !== 'published' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                disabled={isDeleting}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(post._id || post.id); }}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isDeleting ? 'Deleting...' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ScheduledContent({ className = '', agentId }: ScheduledContentProps) {
  const { userId } = useUser();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [filter, setFilter] = useState<'scheduled' | 'published'>('scheduled');
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);

  // Only show for social_media
  const shouldShow = agentId === 'social_media';
  
  // Filter posts based on selected filter
  const filteredPosts = scheduledPosts.filter(post => {
    const status = (post as any).status?.toLowerCase() || '';
    if (filter === 'published') {
      return status === 'published';
    }
    return status !== 'published'; // scheduled, pending, draft, queued, etc.
  });

  useEffect(() => {
    if (shouldShow && userId) {
      loadScheduledPosts();
    }
  }, [userId, agentId, shouldShow]);

  // Listen for content refresh broadcasts from backend
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`content-refresh-${userId}`)
      .on(
        'broadcast',
        { event: 'refresh_content' },
        (payload) => {
          console.log('🔄 Content refresh signal received:', payload);
          // Refresh posts when backend sends refresh signal
          if (payload.payload?.content_type === 'social_posts' || payload.payload?.agent_id === agentId) {
            loadScheduledPosts();
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Content refresh subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, agentId]);

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

  const handleDeletePost = async (postId: string) => {
    if (!userId || !postId) return;
    
    setIsDeleting(true);
    try {
      const result = await scheduledPostsService.deletePost(postId, userId, 'SOL');
      
      if (result.success) {
        // Remove the post from local state
        setScheduledPosts(prev => prev.filter(p => (p as any)._id !== postId && p.id !== postId));
        setSelectedPost(null);
      } else {
        alert(result.error || 'Failed to delete post');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = async (postId: string, summary: string, scheduleDate: string, accountIds: string[]) => {
    if (!userId || !postId) return;
    
    setIsSaving(true);
    try {
      const result = await scheduledPostsService.editPost(postId, userId, { summary, schedule_date: scheduleDate, account_ids: accountIds }, 'SOL');
      
      if (result.success) {
        // Update the post in local state
        setScheduledPosts(prev => prev.map(p => {
          if ((p as any)._id === postId || p.id === postId) {
            return { ...p, summary, scheduleDate, displayDate: scheduleDate, accountIds };
          }
          return p;
        }));
        setEditingPost(null);
        setSelectedPost(null);
      } else {
        alert(result.error || 'Failed to edit post');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to edit post');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostponePost = async (postId: string) => {
    if (!userId || !postId) return;
    
    setIsPostponing(true);
    try {
      const result = await scheduledPostsService.postponePost(postId, userId, '2099-12-31T23:59:59.999Z', 'SOL');
      
      if (result.success) {
        // Remove the post from local state (it's now scheduled for 2099)
        setScheduledPosts(prev => prev.filter(p => (p as any)._id !== postId && p.id !== postId));
        setEditingPost(null);
        setSelectedPost(null);
      } else {
        alert(result.error || 'Failed to postpone post');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to postpone post');
    } finally {
      setIsPostponing(false);
    }
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
      {/* Header with toggle and refresh */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Clock size={10} className="text-orange-500" />
          {/* Toggle buttons */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5">
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-2 py-0.5 text-[8px] font-medium rounded-full transition-colors ${
                filter === 'scheduled' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Scheduled ({scheduledPosts.filter(p => (p as any).status?.toLowerCase() !== 'published').length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-2 py-0.5 text-[8px] font-medium rounded-full transition-colors ${
                filter === 'published' 
                  ? 'bg-green-500 text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Published ({scheduledPosts.filter(p => (p as any).status?.toLowerCase() === 'published').length})
            </button>
          </div>
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
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {(showAll ? filteredPosts : filteredPosts.slice(0, 5)).map((post, index) => {
          const postData = post as any;
          const hasMedia = postData.media && postData.media.length > 0;
          const mediaUrl = hasMedia ? postData.media[0]?.url : null;
          const content = postData.summary || scheduledPostsService.getContentPreview(post, 120);
          
          return (
            <div
              key={postData._id || post.id || index}
              onClick={() => setSelectedPost(postData)}
              className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex gap-2">
                {/* Media thumbnail */}
                {hasMedia && mediaUrl && (
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                      <img 
                        src={mediaUrl} 
                        alt="Post media" 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Platform and status row */}
                  <div className="flex items-center gap-2 mb-1">
                    <PlatformIcon platform={postData.platform || 'unknown'} size={14} />
                    <span className={`text-[10px] font-semibold ${scheduledPostsService.getStatusDisplay(post).color}`}>
                      {scheduledPostsService.getStatusDisplay(post).label}
                    </span>
                  </div>
                  
                  {/* Post content preview */}
                  {content && (
                    <p className="text-[11px] text-gray-700 line-clamp-2 leading-snug mb-1.5">
                      {content}
                    </p>
                  )}
                  
                  {/* Date and time */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar size={10} />
                    <span className="text-[10px]">
                      {scheduledPostsService.formatPostDate(post) || 'No date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Show more/less button */}
        {filteredPosts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-[11px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
          >
            {showAll ? (
              <>
                <ChevronUp size={14} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                +{filteredPosts.length - 5} more posts
              </>
            )}
          </button>
        )}
        
        {/* Empty state for filtered results */}
        {filteredPosts.length === 0 && (
          <div className="p-3 text-center">
            <p className="text-[10px] text-gray-400">
              No {filter} posts found
            </p>
          </div>
        )}
      </div>
      
      {/* Post preview modal */}
      {selectedPost && !editingPost && (
        <PostPreviewModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onDelete={handleDeletePost}
          onEdit={() => setEditingPost(selectedPost)}
          isDeleting={isDeleting}
        />
      )}
      
      {/* Edit post modal */}
      {editingPost && userId && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleEditPost}
          onPostpone={handlePostponePost}
          isSaving={isSaving}
          isPostponing={isPostponing}
          userId={userId}
        />
      )}
    </div>
  );
}
