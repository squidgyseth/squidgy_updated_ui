// ===========================================
// REFERRAL SYSTEM TYPES
// ===========================================

export interface ReferralUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  tier: string;
  credits_earned: number;
  joined_at: string;
  last_active: string;
}

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  current_tier: string;
  next_tier?: string;
  referrals_to_next_tier: number;
  credits_balance: number;
  total_credits_earned: number;
  conversion_rate: number;
  rewards_claimed: ReferralReward[];
}

export interface ReferralReward {
  id: string;
  type: string;
  value: any;
  description: string;
  claimed_at: string;
  expires_at?: string;
}

export interface WaitlistPosition {
  current_position: number;
  original_position: number;
  spots_skipped: number;
  estimated_wait_time: string;
  is_priority: boolean;
  can_skip_instantly: boolean;
}

export interface ShareStats {
  total_shares: number;
  shares_by_channel: {
    email: number;
    instagram: number;
    linkedin: number;
    whatsapp: number;
    other: number;
  };
  clicks: number;
  conversions: number;
  click_through_rate: number;
  conversion_rate: number;
}

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'signed_up' | 'activated' | 'subscribed';
  referred_at: string;
  activated_at?: string;
  credits_earned: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar?: string;
  referrals: number;
  tier: string;
  is_current_user: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  reward_credits: number;
  progress?: {
    current: number;
    required: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  multiplier?: number;
  bonus_credits?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  user_eligible: boolean;
}

export interface ReferralLink {
  short_url: string;
  long_url: string;
  qr_code_url: string;
  clicks: number;
  conversions: number;
  created_at: string;
}

// UI Component Props
export interface ReferralHubProps {
  userId: string;
}

export interface ReferralStatsCardProps {
  stats: ReferralStats;
  loading?: boolean;
}

export interface WaitlistStatusProps {
  position: WaitlistPosition;
  loading?: boolean;
}

export interface ShareToolsProps {
  referralCode: string;
  referralLink: string;
  onShare: (channel: string) => void;
  shareStats: ShareStats;
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  loading?: boolean;
}

export interface AchievementsProps {
  achievements: Achievement[];
  loading?: boolean;
}

export interface ReferredUsersProps {
  users: ReferredUser[];
  loading?: boolean;
}

export interface CampaignsProps {
  campaigns: Campaign[];
  loading?: boolean;
}
