/**
 * Scheduled Posts Service
 * Fetches scheduled/pending posts from GHL social media posting API
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface ScheduledPost {
  id: string;
  content?: string;
  caption?: string;
  media?: string[];
  mediaUrls?: string[];
  platform?: string;
  platforms?: string[];
  status: string;
  scheduledAt?: string;
  scheduled_at?: string;
  scheduledDate?: string;
  createdAt?: string;
  created_at?: string;
  accountId?: string;
  accountName?: string;
}

export interface ScheduledPostsResponse {
  success: boolean;
  posts: ScheduledPost[];
  total_count: number;
  scheduled_count?: number;
  published_count?: number;
  error?: string;
}

class ScheduledPostsService {
  private static instance: ScheduledPostsService;

  private constructor() {}

  static getInstance(): ScheduledPostsService {
    if (!ScheduledPostsService.instance) {
      ScheduledPostsService.instance = new ScheduledPostsService();
    }
    return ScheduledPostsService.instance;
  }

  /**
   * Fetch scheduled posts for a user
   */
  async getScheduledPosts(firmUserId: string, agentId: string = 'SOL'): Promise<ScheduledPostsResponse> {
    const url = `${BACKEND_URL}/api/social/scheduled/posts/${firmUserId}?agent_id=${agentId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          posts: [],
          total_count: 0,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: data.success ?? true,
        posts: data.posts || [],
        total_count: data.total_count || 0,
        scheduled_count: data.scheduled_count,
        published_count: data.published_count
      };
    } catch (error: any) {
      return {
        success: false,
        posts: [],
        total_count: 0,
        error: error.message || 'Failed to fetch posts'
      };
    }
  }

  /**
   * Check if a post is drafted by checking post_confirmation_checker table
   */
  async isPostDrafted(postId: string, firmUserId: string): Promise<boolean> {
    const url = `${BACKEND_URL}/api/social/scheduled/posts/check-draft/${postId}?firm_user_id=${firmUserId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.is_drafted || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Format date for display - handles GHL date fields
   */
  formatPostDate(post: ScheduledPost): string {
    // GHL uses publishedAt for published posts, scheduleDate for scheduled
    const dateStr = (post as any).publishedAt || (post as any).scheduleDate || 
                    (post as any).displayDate || (post as any).createdAt ||
                    post.scheduledAt || post.scheduled_at || post.scheduledDate;
    
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  /**
   * Get platform display name
   */
  getPlatformName(post: ScheduledPost): string {
    const platform = post.platform || (post.platforms && post.platforms[0]);
    if (!platform) return 'Unknown';

    const platformMap: Record<string, string> = {
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter',
      'tiktok': 'TikTok',
      'youtube': 'YouTube'
    };

    return platformMap[platform.toLowerCase()] || platform;
  }

  /**
   * Get post content preview (truncated)
   */
  getContentPreview(post: ScheduledPost, maxLength: number = 100): string {
    // GHL uses 'summary' field for post content
    const content = (post as any).summary || post.content || post.caption || '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Get post status display
   */
  getStatusDisplay(post: ScheduledPost): { label: string; color: string } {
    // Only check draft status if the flag exists (post exists in checker table)
    if ((post as any).isDrafted === true) {
      return { label: 'Drafted', color: 'text-gray-500' };
    }
    
    const status = post.status?.toLowerCase() || '';
    switch (status) {
      case 'published':
        return { label: 'Published', color: 'text-green-600' };
      case 'scheduled':
        return { label: 'Scheduled', color: 'text-orange-500' };
      case 'pending':
        return { label: 'Pending', color: 'text-yellow-500' };
      case 'draft':
        return { label: 'Draft', color: 'text-gray-500' };
      case 'failed':
        return { label: 'Failed', color: 'text-red-500' };
      default:
        return { label: status || 'Unknown', color: 'text-gray-400' };
    }
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string, firmUserId: string, agentId: string = 'SOL'): Promise<{ success: boolean; error?: string }> {
    const url = `${BACKEND_URL}/api/social/scheduled/posts/${postId}?firm_user_id=${firmUserId}&agent_id=${agentId}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete post'
      };
    }
  }

  /**
   * Get connected social media accounts
   */
  async getAccounts(firmUserId: string, agentId: string = 'SOL'): Promise<{ success: boolean; accounts: { id: string; platform: string }[]; error?: string }> {
    const url = `${BACKEND_URL}/api/social/scheduled/accounts/${firmUserId}?agent_id=${agentId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return { success: false, accounts: [], error: 'Failed to fetch accounts' };
      }

      const data = await response.json();
      return { success: true, accounts: data.accounts || [] };
    } catch (error: any) {
      return { success: false, accounts: [], error: error.message };
    }
  }

  /**
   * Edit a scheduled post
   */
  async editPost(
    postId: string, 
    firmUserId: string, 
    updates: { summary?: string; schedule_date?: string; media?: any[]; account_ids?: string[] },
    agentId: string = 'SOL'
  ): Promise<{ success: boolean; error?: string }> {
    const url = `${BACKEND_URL}/api/social/scheduled/posts/${postId}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          post_id: postId,
          agent_id: agentId,
          ...updates
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to edit post'
      };
    }
  }

  /**
   * Postpone a scheduled post to a far future date (2099)
   */
  async postponePost(
    postId: string,
    firmUserId: string,
    agentId: string = 'SOL'
  ): Promise<{ success: boolean; error?: string; new_schedule_date?: string }> {
    const url = `${BACKEND_URL}/api/social/scheduled/posts/${postId}/postpone?firm_user_id=${firmUserId}&agent_id=${agentId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { success: true, new_schedule_date: data.new_schedule_date };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to postpone post'
      };
    }
  }
}

export default ScheduledPostsService.getInstance();
