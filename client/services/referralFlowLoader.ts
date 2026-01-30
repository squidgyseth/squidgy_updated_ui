import yaml from 'js-yaml';

// ===========================================
// REFERRAL SYSTEM TYPES
// ===========================================

export interface ReferralTier {
  name: string;
  icon: string;
  min_referrals: number;
  max_referrals: number | null;
  rewards: ReferralReward[];
  color: string;
}

export interface ReferralReward {
  type: string;
  value?: any;
  duration?: string;
  description: string;
}

export interface ReferralBonus {
  type: string;
  value: number | boolean;
  unit?: string;
  duration?: string;
  description: string;
}

export interface WaitlistConfig {
  enabled: boolean;
  initial_position_range: {
    min: number;
    max: number;
  };
  skip_mechanics: {
    per_referral: number;
    per_social_share: number;
    per_profile_completion: number;
  };
  fast_track_thresholds: {
    instant_access: number;
    priority_queue: number;
  };
  messaging: {
    default_wait_time: string;
    priority_wait_time: string;
    vip_message: string;
  };
}

export interface SharingConfig {
  code_format: string;
  channels: {
    [key: string]: {
      enabled: boolean;
      template?: string;
      subject_template?: string;
      preview_text?: string;
      hashtags?: string[];
    };
  };
  qr_code: {
    enabled: boolean;
    size: number;
    logo_enabled: boolean;
  };
}

export interface Achievement {
  name: string;
  description: string;
  icon: string;
  reward_credits: number;
}

export interface GamificationConfig {
  achievements: Record<string, Achievement>;
  leaderboard: {
    enabled: boolean;
    display_top: number;
    refresh_interval: string;
    time_periods: string[];
    prizes: {
      [period: string]: {
        [position: string]: string;
      };
    };
  };
}

export interface UISettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
  };
  animations: {
    confetti_on_tier_upgrade: boolean;
    progress_bar_animated: boolean;
    reward_claim_animation: boolean;
  };
  display: {
    show_leaderboard: boolean;
    show_achievements: boolean;
    show_progress_bars: boolean;
    show_tier_comparison: boolean;
    compact_mobile_view: boolean;
  };
}

export interface Campaign {
  enabled: boolean;
  multiplier?: number;
  bonus_credits?: number;
  days?: string[];
  dates?: {
    start: string;
    end: string;
  };
  industries?: string[];
  bonus_per_industry?: number;
  message: string;
}

export interface ReferralConfig {
  referral_tiers: Record<string, ReferralTier>;
  referral_bonuses: {
    referrer: Record<string, ReferralBonus>;
    referee: {
      welcome_offer: ReferralBonus[];
    };
  };
  waitlist: WaitlistConfig;
  sharing: SharingConfig;
  gamification: GamificationConfig;
  analytics: {
    track_events: string[];
    attribution_window: number;
    metrics: string[];
  };
  campaigns: Record<string, Campaign>;
  ui_settings: UISettings;
  notifications: {
    email: Record<string, boolean>;
    in_app: {
      show_toast: boolean;
      toast_duration: number;
      toast_position: string;
    };
    push: {
      enabled: boolean;
    };
  };
  limits: {
    max_referrals_per_day: number;
    max_codes_per_user: number;
    code_expiry_days: number;
    minimum_account_age_hours: number;
  };
  compliance: {
    terms_acceptance_required: boolean;
    age_verification_required: boolean;
    minimum_age: number;
    restricted_countries: string[];
    tax_reporting_threshold: number;
  };
}

// ===========================================
// REFERRAL FLOW LOADER SERVICE
// ===========================================

class ReferralFlowLoader {
  private static instance: ReferralFlowLoader;
  private referralConfig: ReferralConfig | null = null;

  private constructor() {}

  static getInstance(): ReferralFlowLoader {
    if (!ReferralFlowLoader.instance) {
      ReferralFlowLoader.instance = new ReferralFlowLoader();
    }
    return ReferralFlowLoader.instance;
  }

  /**
   * Load referral configuration from YAML
   */
  async loadReferralConfig(): Promise<ReferralConfig> {
    if (this.referralConfig) {
      return this.referralConfig;
    }

    try {
      const response = await fetch('/config/referral-config.yaml');
      if (!response.ok) {
        throw new Error(`Failed to fetch referral-config.yaml: ${response.status}`);
      }

      const yamlContent = await response.text();
      const config = yaml.load(yamlContent) as ReferralConfig;

      if (config && config.referral_tiers) {
        this.referralConfig = config;
        return config;
      }

      throw new Error('Invalid referral configuration');
    } catch (error) {
      console.error('Failed to load referral config:', error);
      throw error;
    }
  }

  // ===========================================
  // TIER MANAGEMENT
  // ===========================================

  /**
   * Get all referral tiers
   */
  async getReferralTiers(): Promise<Array<{id: string} & ReferralTier>> {
    const config = await this.loadReferralConfig();
    return Object.entries(config.referral_tiers).map(([id, tier]) => ({
      id,
      ...tier
    }));
  }

  /**
   * Get user's current tier based on referral count
   */
  async getUserTier(referralCount: number): Promise<{id: string} & ReferralTier | null> {
    const tiers = await this.getReferralTiers();
    
    // Sort tiers by min_referrals to find the highest applicable tier
    const sortedTiers = tiers.sort((a, b) => b.min_referrals - a.min_referrals);
    
    for (const tier of sortedTiers) {
      if (referralCount >= tier.min_referrals) {
        if (tier.max_referrals === null || referralCount <= tier.max_referrals) {
          return tier;
        }
      }
    }
    
    return null; // No tier qualifies
  }

  /**
   * Get next tier user can achieve
   */
  async getNextTier(referralCount: number): Promise<{id: string; tier: ReferralTier; referrals_needed: number} | null> {
    const tiers = await this.getReferralTiers();
    
    // Find the next tier the user hasn't reached yet
    const availableTiers = tiers.filter(tier => referralCount < tier.min_referrals);
    
    if (availableTiers.length === 0) {
      return null; // Already at highest tier
    }
    
    // Sort by min_referrals and take the lowest one
    const nextTier = availableTiers.sort((a, b) => a.min_referrals - b.min_referrals)[0];
    
    return {
      id: nextTier.id,
      tier: nextTier,
      referrals_needed: nextTier.min_referrals - referralCount
    };
  }

  // ===========================================
  // REWARDS & BONUSES
  // ===========================================

  /**
   * Get referrer bonuses configuration
   */
  async getReferrerBonuses(): Promise<Record<string, ReferralBonus>> {
    const config = await this.loadReferralConfig();
    return config.referral_bonuses.referrer;
  }

  /**
   * Get referee welcome offer
   */
  async getRefereeWelcomeOffer(): Promise<ReferralBonus[]> {
    const config = await this.loadReferralConfig();
    return config.referral_bonuses.referee.welcome_offer;
  }

  /**
   * Calculate rewards for a specific tier
   */
  async calculateTierRewards(tierId: string): Promise<ReferralReward[]> {
    const config = await this.loadReferralConfig();
    const tier = config.referral_tiers[tierId];
    return tier ? tier.rewards : [];
  }

  // ===========================================
  // WAITLIST CONFIGURATION
  // ===========================================

  /**
   * Get waitlist configuration
   */
  async getWaitlistConfig(): Promise<WaitlistConfig> {
    const config = await this.loadReferralConfig();
    return config.waitlist;
  }

  /**
   * Calculate waitlist position improvement
   */
  async calculateWaitlistImprovement(referrals: number, socialShares: number): Promise<number> {
    const waitlistConfig = await this.getWaitlistConfig();
    
    let improvement = 0;
    improvement += referrals * waitlistConfig.skip_mechanics.per_referral;
    improvement += socialShares * waitlistConfig.skip_mechanics.per_social_share;
    
    return improvement;
  }

  // ===========================================
  // SHARING CONFIGURATION
  // ===========================================

  /**
   * Get sharing channels configuration
   */
  async getSharingConfig(): Promise<SharingConfig> {
    const config = await this.loadReferralConfig();
    return config.sharing;
  }

  /**
   * Generate referral code based on template
   */
  async generateReferralCode(username: string): Promise<string> {
    const config = await this.loadReferralConfig();
    const template = config.sharing.code_format;
    
    return template
      .replace('{USERNAME}', username.toUpperCase())
      .replace('{YEAR}', new Date().getFullYear().toString());
  }

  /**
   * Get sharing template for specific channel
   */
  async getSharingTemplate(channel: string, referralCode: string, referralLink: string): Promise<string> {
    const config = await this.loadReferralConfig();
    const channelConfig = config.sharing.channels[channel];
    
    if (!channelConfig || !channelConfig.enabled || !channelConfig.template) {
      return '';
    }
    
    return channelConfig.template
      .replace('{CODE}', referralCode)
      .replace('{LINK}', referralLink);
  }

  // ===========================================
  // GAMIFICATION
  // ===========================================

  /**
   * Get achievements configuration
   */
  async getAchievements(): Promise<Record<string, Achievement>> {
    const config = await this.loadReferralConfig();
    return config.gamification.achievements;
  }

  /**
   * Get leaderboard configuration
   */
  async getLeaderboardConfig(): Promise<GamificationConfig['leaderboard']> {
    const config = await this.loadReferralConfig();
    return config.gamification.leaderboard;
  }

  // ===========================================
  // CAMPAIGNS
  // ===========================================

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<Array<{id: string} & Campaign>> {
    const config = await this.loadReferralConfig();
    const now = new Date();
    
    return Object.entries(config.campaigns)
      .filter(([id, campaign]) => {
        if (!campaign.enabled) return false;
        
        // Check if campaign has date restrictions
        if (campaign.dates) {
          const start = new Date(campaign.dates.start);
          const end = new Date(campaign.dates.end);
          return now >= start && now <= end;
        }
        
        // Check if campaign has day restrictions
        if (campaign.days) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDay = dayNames[now.getDay()];
          return campaign.days.includes(currentDay);
        }
        
        return true;
      })
      .map(([id, campaign]) => ({ id, ...campaign }));
  }

  // ===========================================
  // UI SETTINGS
  // ===========================================

  /**
   * Get UI customization settings
   */
  async getUISettings(): Promise<UISettings> {
    const config = await this.loadReferralConfig();
    return config.ui_settings;
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<ReferralConfig['notifications']> {
    const config = await this.loadReferralConfig();
    return config.notifications;
  }

  /**
   * Get system limits
   */
  async getLimits(): Promise<ReferralConfig['limits']> {
    const config = await this.loadReferralConfig();
    return config.limits;
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.referralConfig = null;
  }
}

export default ReferralFlowLoader;
