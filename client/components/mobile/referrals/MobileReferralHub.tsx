import { useState } from 'react';
import { Share2, Copy, Trophy, Users, Gift, TrendingUp, Star, ArrowRight, Crown, Zap } from 'lucide-react';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  creditsBalance: number;
  conversionRate: number;
  currentTier: string;
  nextTierProgress: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  referrals: number;
  tier: string;
  isCurrentUser?: boolean;
}

// Sample data
const sampleStats: ReferralStats = {
  totalReferrals: 12,
  successfulReferrals: 8,
  creditsBalance: 480,
  conversionRate: 67,
  currentTier: 'Silver',
  nextTierProgress: 65
};

const sampleLeaderboard: LeaderboardEntry[] = [
  { id: '1', name: 'Sarah Johnson', referrals: 24, tier: 'Gold', avatar: '/users/sarah.jpg' },
  { id: '2', name: 'Mike Chen', referrals: 19, tier: 'Silver', avatar: '/users/mike.jpg' },
  { id: '3', name: 'You', referrals: 12, tier: 'Silver', isCurrentUser: true },
  { id: '4', name: 'Emma Wilson', referrals: 11, tier: 'Bronze' },
  { id: '5', name: 'David Kim', referrals: 9, tier: 'Bronze' }
];

const shareChannels = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
  { id: 'facebook', name: 'Facebook', icon: '👥', color: 'bg-blue-500' },
  { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { id: 'email', name: 'Email', icon: '📧', color: 'bg-gray-500' },
  { id: 'copy', name: 'Copy Link', icon: '📋', color: 'bg-purple-500' }
];

const tiers = [
  { name: 'Bronze', icon: '🥉', color: '#CD7F32', minReferrals: 0 },
  { name: 'Silver', icon: '🥈', color: '#C0C0C0', minReferrals: 5 },
  { name: 'Gold', icon: '🥇', color: '#FFD700', minReferrals: 15 },
  { name: 'Platinum', icon: '💎', color: '#E5E4E2', minReferrals: 30 }
];

interface MobileReferralHubProps {
  stats?: ReferralStats;
  leaderboard?: LeaderboardEntry[];
  referralCode?: string;
}

export function MobileReferralHub({
  stats = sampleStats,
  leaderboard = sampleLeaderboard,
  referralCode = 'SQUIDGY123'
}: MobileReferralHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'share' | 'leaderboard'>('overview');

  const currentTier = tiers.find(tier => tier.name === stats.currentTier) || tiers[0];
  const nextTier = tiers.find(tier => tier.minReferrals > stats.successfulReferrals) || tiers[tiers.length - 1];

  const handleShare = async (channel: string) => {
    const referralLink = `https://squidgy.ai/join?ref=${referralCode}`;
    const shareText = `🚀 Join me on Squidgy AI - the ultimate business automation platform! Use my referral code: ${referralCode}`;

    try {
      if (channel === 'copy') {
        await navigator.clipboard.writeText(referralLink);
        toast.success('Referral link copied to clipboard!');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Join Squidgy AI',
          text: shareText,
          url: referralLink
        });
        toast.success(`Shared via ${channel}!`);
      } else {
        // Fallback for desktop
        await navigator.clipboard.writeText(`${shareText} ${referralLink}`);
        toast.success('Referral content copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share');
    }
  };

  const getTierIcon = (tierName: string) => {
    const tier = tiers.find(t => t.name === tierName);
    return tier?.icon || '🥉';
  };

  const getTierColor = (tierName: string) => {
    const tier = tiers.find(t => t.name === tierName);
    return tier?.color || '#CD7F32';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Referral Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share Squidgy and earn rewards
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 pt-4">
        <div className="flex bg-muted rounded-lg p-1">
          <TouchButton
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex-1 text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Overview
          </TouchButton>
          <TouchButton
            variant={activeTab === 'share' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('share')}
            className="flex-1 text-xs"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </TouchButton>
          <TouchButton
            variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('leaderboard')}
            className="flex-1 text-xs"
          >
            <Trophy className="h-3 w-3 mr-1" />
            Rankings
          </TouchButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'overview' && (
          <div className="space-y-4 pt-4">
            {/* Current Tier */}
            <MobileCard className="p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{currentTier.name} Member</h3>
                    <p className="text-xs text-muted-foreground">Current tier</p>
                  </div>
                </div>
                <Badge style={{ backgroundColor: `${currentTier.color}20`, color: currentTier.color }}>
                  {stats.successfulReferrals} referrals
                </Badge>
              </div>
              
              {nextTier && nextTier !== currentTier && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="text-muted-foreground">
                      {stats.successfulReferrals}/{nextTier.minReferrals}
                    </span>
                  </div>
                  <Progress 
                    value={(stats.successfulReferrals / nextTier.minReferrals) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </MobileCard>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <MobileCard className="p-3 text-center border border-border">
                <div className="text-2xl font-bold text-foreground">{stats.totalReferrals}</div>
                <div className="text-xs text-muted-foreground">Total Referrals</div>
              </MobileCard>
              <MobileCard className="p-3 text-center border border-border">
                <div className="text-2xl font-bold text-green-500">{stats.successfulReferrals}</div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </MobileCard>
              <MobileCard className="p-3 text-center border border-border">
                <div className="text-2xl font-bold text-orange-500">{stats.creditsBalance}</div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </MobileCard>
              <MobileCard className="p-3 text-center border border-border">
                <div className="text-2xl font-bold text-purple-500">{stats.conversionRate}%</div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </MobileCard>
            </div>

            {/* Quick Actions */}
            <MobileCard className="p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <TouchButton
                  variant="gradient"
                  size="sm"
                  onClick={() => setActiveTab('share')}
                  className="w-full justify-between"
                >
                  <span>Share Your Link</span>
                  <Share2 className="h-4 w-4" />
                </TouchButton>
                <TouchButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('copy')}
                  className="w-full justify-between"
                >
                  <span>Copy Referral Code</span>
                  <Copy className="h-4 w-4" />
                </TouchButton>
              </div>
            </MobileCard>

            {/* Rewards Info */}
            <MobileCard className="p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-foreground">Rewards</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per referral:</span>
                  <span className="text-foreground font-medium">60 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus rewards:</span>
                  <span className="text-foreground font-medium">Tier upgrades</span>
                </div>
              </div>
            </MobileCard>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="space-y-4 pt-4">
            {/* Referral Code */}
            <MobileCard className="p-4 border border-border">
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Your Referral Code</h3>
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <div className="text-lg font-mono font-bold text-foreground">{referralCode}</div>
                </div>
                <TouchButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('copy')}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </TouchButton>
              </div>
            </MobileCard>

            {/* Share Channels */}
            <MobileCard className="p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-3">Share via</h3>
              <div className="grid grid-cols-3 gap-3">
                {shareChannels.map((channel) => (
                  <TouchButton
                    key={channel.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(channel.id)}
                    className="flex-col h-16 p-2"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1', channel.color)}>
                      <span className="text-sm">{channel.icon}</span>
                    </div>
                    <span className="text-xs">{channel.name}</span>
                  </TouchButton>
                ))}
              </div>
            </MobileCard>

            {/* Share Tips */}
            <MobileCard className="p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-foreground">Sharing Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Share with friends who run businesses</li>
                <li>• Post in entrepreneur groups</li>
                <li>• Include personal success stories</li>
                <li>• Explain the benefits clearly</li>
              </ul>
            </MobileCard>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">Top Referrers</h2>
              <p className="text-sm text-muted-foreground">This month's leaders</p>
            </div>

            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <MobileCard
                  key={entry.id}
                  className={cn(
                    'p-4 border',
                    entry.isCurrentUser 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 && 'bg-yellow-500 text-white',
                        index === 1 && 'bg-gray-400 text-white',
                        index === 2 && 'bg-orange-500 text-white',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar} alt={entry.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          entry.isCurrentUser ? 'text-primary' : 'text-foreground'
                        )}>
                          {entry.name}
                        </span>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{entry.referrals} referrals</span>
                        <span className="text-xs">•</span>
                        <div className="flex items-center gap-1">
                          <span>{getTierIcon(entry.tier)}</span>
                          <span>{entry.tier}</span>
                        </div>
                      </div>
                    </div>

                    {index < 3 && (
                      <div className="text-right">
                        <Crown className={cn(
                          'h-5 w-5',
                          index === 0 && 'text-yellow-500',
                          index === 1 && 'text-gray-400',
                          index === 2 && 'text-orange-500'
                        )} />
                      </div>
                    )}
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}