import { supabase } from '@/lib/supabase';
import { 
  ReferralStats, 
  WaitlistPosition, 
  ShareStats, 
  ReferredUser, 
  Achievement,
  LeaderboardEntry 
} from '@/types/referral.types';

// =====================================================
// REFERRAL SERVICE - DATABASE INTEGRATION
// =====================================================

class ReferralService {
  private static instance: ReferralService;

  private constructor() {}

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  // =====================================================
  // USER REFERRAL CODE & STATS
  // =====================================================

  /**
   * Get or create referral code for user
   */
  async getUserReferralCode(userId: string): Promise<{ code: string; link: string }> {
    try {
      // MOCK DATA (commented out - uncomment if database issues)
      /*
      
      // Generate a consistent mock code based on userId
      const userIdShort = userId.substring(0, 8).toUpperCase();
      const year = new Date().getFullYear();
      const mockCode = `REF${userIdShort}${year}`;
      const mockLink = `https://app.squidgy.ai/register?ref=${mockCode}`;
      
      return {
        code: mockCode,
        link: mockLink
      };
      */

      // Database implementation
      // Get user's FIRST (oldest) active code - their personal referral code
      // Order by created_at to always return the original/first code
      // This handles cases where admins have multiple codes
      const { data: existingCodes, error: fetchError } = await supabase
        .from('referral_codes')
        .select('code, referral_link')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingCodes && existingCodes.length > 0 && !fetchError) {
        return {
          code: existingCodes[0].code,
          link: existingCodes[0].referral_link
        };
      }

      // Generate new code if doesn't exist
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';

      // Generate deterministic code (same email = same code)
      // Format: SQUID + Email prefix + 5-char hash + year
      const emailPrefix = userEmail.split('@')[0].substring(0, 3).toUpperCase();

      // Generate deterministic hash from email
      let hash = 0;
      for (let i = 0; i < userEmail.length; i++) {
        hash = ((hash << 5) - hash) + userEmail.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }

      // Convert hash to base36 and take 5 characters (harder to guess)
      const hashStr = Math.abs(hash).toString(36).toUpperCase().substring(0, 5).padEnd(5, '0');
      const year = new Date().getFullYear();
      const code = `SQUID${emailPrefix}${hashStr}${year}`;
      const link = `https://app.squidgy.ai/register?ref=${code}`;

      // Insert new code
      const { data: newCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          referral_link: link
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        code: newCode.code,
        link: newCode.referral_link
      };
    } catch (error) {
      console.error('Error getting referral code:', error);
      
      // Fallback to mock data (commented out - uncomment if needed)
      /*
      const userIdShort = userId.substring(0, 8).toUpperCase();
      const year = new Date().getFullYear();
      const mockCode = `REF${userIdShort}${year}`;
      const mockLink = `https://app.squidgy.ai/register?ref=${mockCode}`;
      
      return {
        code: mockCode,
        link: mockLink
      };
      */
      
      throw error;
    }
  }

  /**
   * Create a NEW referral code (for admins creating multiple codes)
   * Always creates a fresh code regardless of existing codes
   */
  async createNewReferralCode(userId: string): Promise<{ code: string; link: string }> {
    try {
      // Get user email for code generation
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';

      // Generate UNIQUE code with timestamp to ensure uniqueness
      const emailPrefix = userEmail.split('@')[0].substring(0, 3).toUpperCase();

      // Use timestamp + random for uniqueness (not deterministic like getUserReferralCode)
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      const year = new Date().getFullYear();

      const code = `SQUID${emailPrefix}${timestamp}${random}${year}`;
      const link = `https://app.squidgy.ai/register?ref=${code}`;

      // Insert new code
      const { data: newCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          referral_link: link
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        code: newCode.code,
        link: newCode.referral_link
      };
    } catch (error) {
      console.error('Error creating new referral code:', error);
      throw error;
    }
  }

  /**
   * Get user's referral statistics
   */
  async getUserReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // MOCK DATA (commented out - uncomment if database issues)
      /*
      
      return {
        total_referrals: 7,
        successful_referrals: 5,
        pending_referrals: 2,
        current_tier: 'gold',
        next_tier: 'diamond',
        referrals_to_next_tier: 4,
        credits_balance: 750,
        total_credits_earned: 1250,
        conversion_rate: 71.4,
        rewards_claimed: []
      };
      */

      // Database implementation
      // Get tier status
      const { data: tierStatus } = await supabase
        .from('user_tier_status')
        .select(`
          successful_referrals,
          pending_referrals,
          referrals_to_next_tier,
          current_tier_id,
          next_tier_id
        `)
        .eq('user_id', userId)
        .single();

      // Get tier details separately
      let currentTierData = null;
      let nextTierData = null;
      
      if (tierStatus?.current_tier_id) {
        const { data: currentTier } = await supabase
          .from('referral_tiers')
          .select('tier_name, icon, color')
          .eq('id', tierStatus.current_tier_id)
          .single();
        currentTierData = currentTier;
      }
      
      if (tierStatus?.next_tier_id) {
        const { data: nextTier } = await supabase
          .from('referral_tiers')
          .select('tier_name')
          .eq('id', tierStatus.next_tier_id)
          .single();
        nextTierData = nextTier;
      }

      // Get rewards
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('credits_balance, credits_earned')
        .eq('user_id', userId)
        .eq('status', 'earned');

      const totalCredits = rewards?.reduce((sum, r) => sum + (r.credits_balance || 0), 0) || 0;
      const totalEarned = rewards?.reduce((sum, r) => sum + (r.credits_earned || 0), 0) || 0;

      // Get total referrals count
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId);

      // Calculate conversion rate
      const conversionRate = totalReferrals && tierStatus?.successful_referrals 
        ? (tierStatus.successful_referrals / totalReferrals) * 100 
        : 0;

      return {
        total_referrals: totalReferrals || 0,
        successful_referrals: tierStatus?.successful_referrals || 0,
        pending_referrals: tierStatus?.pending_referrals || 0,
        current_tier: currentTierData?.tier_name || 'bronze',
        next_tier: nextTierData?.tier_name || null,
        referrals_to_next_tier: tierStatus?.referrals_to_next_tier || 0,
        credits_balance: totalCredits,
        total_credits_earned: totalEarned,
        conversion_rate: parseFloat(conversionRate.toFixed(1)),
        rewards_claimed: []
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      // Return mock data on error (commented out - uncomment if needed)
      /*
      return {
        total_referrals: 7,
        successful_referrals: 5,
        pending_referrals: 2,
        current_tier: 'gold',
        next_tier: 'diamond',
        referrals_to_next_tier: 4,
        credits_balance: 750,
        total_credits_earned: 1250,
        conversion_rate: 71.4,
        rewards_claimed: []
      };
      */
      
      throw error;
    }
  }

  // =====================================================
  // SHARING & TRACKING
  // =====================================================

  /**
   * Track a share action
   */
  async trackShare(userId: string, channel: string, message?: string): Promise<void> {
    try {
      // Get user's referral code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!codeData) return;

      // Insert share record
      await supabase
        .from('referral_shares')
        .insert({
          user_id: userId,
          referral_code_id: codeData.id,
          channel,
          message_shared: message,
          share_type: 'link'
        });

      // Update waitlist position if exists (25 spots for social share)
      await supabase.rpc('update_waitlist_position_for_share', {
        p_user_id: userId,
        p_skip_amount: 25
      });

    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }

  /**
   * Get sharing statistics
   */
  async getShareStats(userId: string): Promise<ShareStats> {
    try {
      // MOCK DATA (commented out - uncomment if database issues)
      /*
      
      return {
        total_shares: 15,
        shares_by_channel: {
          email: 5,
          instagram: 4,
          linkedin: 3,
          whatsapp: 2,
          other: 1
        },
        clicks: 45,
        conversions: 5,
        click_through_rate: 33.3,
        conversion_rate: 11.1
      };
      */

      // Database implementation
      const { data: shares } = await supabase
        .from('referral_shares')
        .select('channel, clicks, conversions')
        .eq('user_id', userId);

      if (!shares || shares.length === 0) {
        return {
          total_shares: 0,
          shares_by_channel: {},
          clicks: 0,
          conversions: 0,
          click_through_rate: 0,
          conversion_rate: 0
        };
      }

      // Aggregate by channel
      const sharesByChannel: Record<string, number> = {};
      let totalClicks = 0;
      let totalConversions = 0;

      shares.forEach(share => {
        sharesByChannel[share.channel] = (sharesByChannel[share.channel] || 0) + 1;
        totalClicks += share.clicks || 0;
        totalConversions += share.conversions || 0;
      });

      const totalShares = shares.length;
      const ctr = totalShares > 0 ? (totalClicks / totalShares) * 100 : 0;
      const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        total_shares: totalShares,
        shares_by_channel: sharesByChannel,
        clicks: totalClicks,
        conversions: totalConversions,
        click_through_rate: parseFloat(ctr.toFixed(1)),
        conversion_rate: parseFloat(convRate.toFixed(1))
      };
    } catch (error) {
      console.error('Error getting share stats:', error);
      // Return empty stats on error (commented out - uncomment if needed)
      /*
      return {
        total_shares: 0,
        shares_by_channel: {},
        clicks: 0,
        conversions: 0,
        click_through_rate: 0,
        conversion_rate: 0
      };
      */
      
      throw error;
    }
  }

  // =====================================================
  // WAITLIST MANAGEMENT
  // =====================================================

  /**
   * Get or create waitlist position
   */
  async getWaitlistPosition(userId: string): Promise<WaitlistPosition> {
    try {
      // MOCK DATA (commented out - uncomment if database issues)
      /*
      
      return {
        current_position: 12,
        original_position: 512,
        spots_skipped: 500,
        estimated_wait_time: "3-5 days",
        is_priority: true,
        can_skip_instantly: false
      };
      */

      // Database implementation
      // Check if user is in waitlist
      let { data: waitlistData, error } = await supabase
        .from('referral_waitlist')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create waitlist entry if doesn't exist
      if (!waitlistData || error) {
        // Get current max position
        const { data: maxPosData } = await supabase
          .from('referral_waitlist')
          .select('current_position')
          .order('current_position', { ascending: false })
          .limit(1)
          .single();

        const newPosition = (maxPosData?.current_position || 0) + Math.floor(Math.random() * 50) + 100;

        const { data: newEntry } = await supabase
          .from('referral_waitlist')
          .insert({
            user_id: userId,
            original_position: newPosition,
            current_position: newPosition,
            spots_skipped: 0,
            status: 'waiting'
          })
          .select()
          .single();

        waitlistData = newEntry;
      }

      // Check for priority/instant access based on referrals
      const { data: tierStatus } = await supabase
        .from('user_tier_status')
        .select('successful_referrals')
        .eq('user_id', userId)
        .single();

      const referrals = tierStatus?.successful_referrals || 0;
      const isPriority = referrals >= 3;
      const canSkipInstantly = referrals >= 5;

      // Estimate wait time
      let estimatedWaitTime = '2-3 weeks';
      if (canSkipInstantly) {
        estimatedWaitTime = 'Instant access!';
      } else if (isPriority) {
        estimatedWaitTime = '3-5 days';
      } else if (waitlistData.current_position < 100) {
        estimatedWaitTime = '1 week';
      }

      return {
        current_position: waitlistData.current_position,
        original_position: waitlistData.original_position,
        spots_skipped: waitlistData.spots_skipped || 0,
        estimated_wait_time: estimatedWaitTime,
        is_priority: isPriority,
        can_skip_instantly: canSkipInstantly
      };
    } catch (error) {
      console.error('Error getting waitlist position:', error);
      // Return mock position (commented out - uncomment if needed)
      /*
      return {
        current_position: 12,
        original_position: 512,
        spots_skipped: 500,
        estimated_wait_time: "3-5 days",
        is_priority: true,
        can_skip_instantly: false
      };
      */
      
      throw error;
    }
  }

  // =====================================================
  // LEADERBOARD
  // =====================================================

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // MOCK DATA (commented out - uncomment if database issues)
      /*
      
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          user_id: 'user_001',
          name: 'Alex Chen',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
          referrals: 23,
          tier: 'diamond',
          is_current_user: false
        },
        {
          rank: 2,
          user_id: 'user_002', 
          name: 'Sarah Kim',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
          referrals: 18,
          tier: 'diamond',
          is_current_user: false
        },
        {
          rank: 3,
          user_id: 'user_003',
          name: 'Mike Rodriguez', 
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
          referrals: 15,
          tier: 'diamond',
          is_current_user: false
        },
        {
          rank: 4,
          user_id: 'user_004',
          name: 'Emma Wilson',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
          referrals: 12,
          tier: 'gold',
          is_current_user: false
        },
        {
          rank: 5,
          user_id: 'user_005',
          name: 'David Brown',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
          referrals: 9,
          tier: 'gold',
          is_current_user: false
        },
        {
          rank: 6,
          user_id: 'user_006',
          name: 'Lisa Zhang',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face',
          referrals: 8,
          tier: 'gold',
          is_current_user: false
        },
        {
          rank: 7,
          user_id: 'user_007',
          name: 'You',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face',
          referrals: 7,
          tier: 'gold',
          is_current_user: true
        },
        {
          rank: 8,
          user_id: 'user_008',
          name: 'Tom Johnson',
          avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=32&h=32&fit=crop&crop=face',
          referrals: 6,
          tier: 'silver',
          is_current_user: false
        },
        {
          rank: 9,
          user_id: 'user_009',
          name: 'Anna Lee',
          avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=32&h=32&fit=crop&crop=face',
          referrals: 5,
          tier: 'silver',
          is_current_user: false
        },
        {
          rank: 10,
          user_id: 'user_010',
          name: 'Ryan Garcia',
          avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=32&h=32&fit=crop&crop=face',
          referrals: 4,
          tier: 'silver',
          is_current_user: false
        }
      ];

      return mockLeaderboard.slice(0, limit);
      */

      // Database implementation
      const { data: leaderboardData } = await supabase
        .from('referral_leaderboard')
        .select(`
          user_id,
          user_name,
          user_avatar,
          total_referrals,
          current_tier,
          global_rank
        `)
        .order('total_referrals', { ascending: false })
        .limit(limit);

      if (!leaderboardData || leaderboardData.length === 0) {
        // If no data, fetch from main tables
        const { data: topUsers } = await supabase
          .from('user_tier_status')
          .select(`
            user_id,
            successful_referrals,
            current_tier_id
          `)
          .order('successful_referrals', { ascending: false })
          .limit(limit);

        if (!topUsers) return [];

        // Get tier names
        const tierIds = topUsers.map(u => u.current_tier_id).filter(Boolean);
        const { data: tiers } = await supabase
          .from('referral_tiers')
          .select('id, tier_name')
          .in('id', tierIds);
        
        const tierMap = new Map(tiers?.map(t => [t.id, t.tier_name]) || []);
        
        return topUsers.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          name: `User ${index + 1}`,
          referrals: entry.successful_referrals || 0,
          tier: tierMap.get(entry.current_tier_id) || 'bronze',
          is_current_user: false, // Will be set in component
          avatar: undefined
        }));
      }

      return leaderboardData.map((entry, index) => ({
        rank: entry.global_rank || index + 1,
        user_id: entry.user_id,
        name: entry.user_name,
        referrals: entry.total_referrals,
        tier: entry.current_tier,
        is_current_user: false, // Will be set in component
        avatar: entry.user_avatar
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      // Return empty array on error (commented out - uncomment if needed)
      /*
      return [];
      */
      
      throw error;
    }
  }

  // =====================================================
  // REFERRED USERS
  // =====================================================

  /**
   * Get list of users referred by current user
   */
  async getReferredUsers(userId: string): Promise<ReferredUser[]> {
    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          referee_id,
          status,
          signed_up_at,
          activated_at
        `)
        .eq('referrer_id', userId)
        .order('signed_up_at', { ascending: false });

      if (!referrals) return [];

      // For now, return basic info without user details
      // In production, you'd have a profiles table or use a server-side function
      return referrals.map((ref, index) => ({
        id: ref.referee_id,
        name: `Referral ${index + 1}`,
        email: '',
        status: ref.status === 'completed' ? 'active' : 'pending' as 'pending' | 'active',
        joined_date: ref.signed_up_at,
        avatar: undefined
      }));
    } catch (error) {
      console.error('Error getting referred users:', error);
      return [];
    }
  }

  // =====================================================
  // ACHIEVEMENTS
  // =====================================================

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data: achievements } = await supabase
        .from('referral_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (!achievements) return [];

      return achievements.map(ach => ({
        id: ach.id,
        name: ach.achievement_name,
        description: ach.achievement_description || '',
        icon: ach.badge_earned || '🏆',
        unlocked: true,
        unlocked_at: ach.unlocked_at,
        credits_earned: ach.credits_earned || 0
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  // =====================================================
  // CHECK ACHIEVEMENTS
  // =====================================================

  /**
   * Check and award achievements
   */
  async checkAndAwardAchievements(userId: string): Promise<void> {
    try {
      const stats = await this.getUserReferralStats(userId);

      // First Referral Achievement
      if (stats.successful_referrals === 1) {
        await supabase
          .from('referral_achievements')
          .upsert({
            user_id: userId,
            achievement_type: 'first_referral',
            achievement_name: 'First Steps',
            achievement_description: 'Made your first successful referral!',
            credits_earned: 50,
            badge_earned: '🎯'
          }, {
            onConflict: 'user_id,achievement_type'
          });
      }

      // Speed Demon - 3 referrals in 7 days
      const { data: recentReferrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)
        .eq('status', 'completed')
        .gte('activated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (recentReferrals && recentReferrals.length >= 3) {
        await supabase
          .from('referral_achievements')
          .upsert({
            user_id: userId,
            achievement_type: 'speed_demon',
            achievement_name: 'Speed Demon',
            achievement_description: 'Got 3 referrals in 7 days!',
            credits_earned: 100,
            badge_earned: '⚡'
          }, {
            onConflict: 'user_id,achievement_type'
          });
      }

      // Social Butterfly - Shared on 3+ platforms
      const { data: shareChannels } = await supabase
        .from('referral_shares')
        .select('channel')
        .eq('user_id', userId);

      const uniqueChannels = new Set(shareChannels?.map(s => s.channel));
      if (uniqueChannels.size >= 3) {
        await supabase
          .from('referral_achievements')
          .upsert({
            user_id: userId,
            achievement_type: 'social_butterfly',
            achievement_name: 'Social Butterfly',
            achievement_description: 'Shared on 3+ different platforms!',
            credits_earned: 75,
            badge_earned: '🦋'
          }, {
            onConflict: 'user_id,achievement_type'
          });
      }

      // Tier Climber - Reached Gold
      if (stats.current_tier === 'gold' || stats.current_tier === 'diamond') {
        await supabase
          .from('referral_achievements')
          .upsert({
            user_id: userId,
            achievement_type: 'tier_climber',
            achievement_name: 'Tier Climber',
            achievement_description: 'Reached Gold tier!',
            credits_earned: 200,
            badge_earned: '🏔️'
          }, {
            onConflict: 'user_id,achievement_type'
          });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  /**
   * Subscribe to referral updates
   */
  subscribeToReferralUpdates(
    userId: string, 
    onUpdate: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`referrals:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${userId}`
        },
        onUpdate
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Subscribe to leaderboard updates
   */
  subscribeToLeaderboardUpdates(onUpdate: (payload: any) => void): () => void {
    const subscription = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_leaderboard'
        },
        onUpdate
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  // =====================================================
  // REFERRAL CODE VALIDATION
  // =====================================================

  /**
   * Validate a referral code
   * Returns true if code exists in referral_codes table, is active, and hasn't been used
   * OR if code is the master code "SQUIDWINS"
   */
  async validateReferralCode(code: string): Promise<boolean> {
    try {
      // Trim and uppercase the code for comparison
      const trimmedCode = code.trim().toUpperCase();

      // Check for master code (never expires, always valid)
      if (trimmedCode === 'SQUIDWINS') {
        return true;
      }

      // Check if code exists in database and is active
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code, id, used_at')
        .eq('code', trimmedCode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if code has already been used (one-time use)
      if (data.used_at) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  /**
   * Mark a referral code as used
   * Master code "SQUIDWINS" is never marked as used (reusable)
   */
  async markCodeAsUsed(code: string, usedByUserId: string): Promise<boolean> {
    try {
      const trimmedCode = code.trim().toUpperCase();

      // Master code is reusable - don't mark it as used
      // But track the user in referrals table with placeholder referrer
      if (trimmedCode === 'SQUIDWINS') {
        // Log master code usage for tracking
        console.log(`Master code SQUIDWINS used by user: ${usedByUserId}`);

        // Create referral entry with placeholder referrer_id
        // Using special UUID to indicate master code (00000000-0000-0000-0000-000000000001)
        await supabase
          .from('referrals')
          .insert({
            referrer_id: '00000000-0000-0000-0000-000000000001', // Placeholder for master code
            referee_id: usedByUserId,
            referral_code_id: null,
            status: 'completed',
            referral_source: 'SQUIDWINS',
            signed_up_at: new Date().toISOString(),
            activated_at: new Date().toISOString()
          });

        return true; // Success, code remains valid
      }

      // Regular code - mark as used (one-time use)
      const { error } = await supabase
        .from('referral_codes')
        .update({
          used_at: new Date().toISOString(),
          used_by_user_id: usedByUserId,
          is_active: false
        })
        .eq('code', trimmedCode);

      if (error) {
        console.error('Error marking code as used:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking code as used:', error);
      return false;
    }
  }
}

export default ReferralService;
