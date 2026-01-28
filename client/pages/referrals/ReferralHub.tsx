import React, { useState, useEffect } from 'react';
import { LeftNavigation } from '@/components/layout/LeftNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/useUser';
import ReferralFlowLoader from '@/services/referralFlowLoader';
import { ReferralStats, WaitlistPosition, ShareStats, ReferredUser, Achievement, LeaderboardEntry } from '@/types/referral.types';
import { toast } from 'sonner';
import ReferralService from '@/services/referralService';
import { ResponsiveLayout } from '../../components/mobile/layout/ResponsiveLayout';
import { MobileReferralHub } from '../../components/mobile/referrals/MobileReferralHub';

// Import components (will create these next)
import { MyReferralStats } from '@/components/referrals/MyReferralStats';
import { WaitlistStatus } from '@/components/referrals/WaitlistStatus';
import { ShareAndEarn } from '@/components/referrals/ShareAndEarn';
import { ReferralLeaderboard } from '@/components/referrals/ReferralLeaderboard';

export default function ReferralHub() {
  const { userId, isReady, profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<WaitlistPosition | null>(null);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  // Configuration states
  const [uiSettings, setUISettings] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<any>(null);
  const [nextTier, setNextTier] = useState<any>(null);

  const referralLoader = ReferralFlowLoader.getInstance();
  const referralService = ReferralService.getInstance();

  useEffect(() => {
    if (isReady && userId) {
      loadReferralData();
    }
  }, [isReady, userId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Load configuration
      const [uiConfig] = await Promise.all([
        referralLoader.getUISettings(),
      ]);
      
      setUISettings(uiConfig);

      // Load real data from database
      const [
        referralCodeData,
        statsData,
        waitlistData,
        shareStatsData,
        referredUsersData,
        achievementsData,
        leaderboardData
      ] = await Promise.all([
        referralService.getUserReferralCode(userId!),
        referralService.getUserReferralStats(userId!),
        referralService.getWaitlistPosition(userId!),
        referralService.getShareStats(userId!),
        referralService.getReferredUsers(userId!),
        referralService.getUserAchievements(userId!),
        referralService.getLeaderboard(10)
      ]);

      // Set referral code and link
      setReferralCode(referralCodeData.code);
      setReferralLink(referralCodeData.link);

      // Set statistics
      setReferralStats(statsData);
      setWaitlistPosition(waitlistData);
      setShareStats(shareStatsData);
      setReferredUsers(referredUsersData);
      setAchievements(achievementsData);
      
      // Set leaderboard with current user flag
      const leaderboardWithUserFlag = leaderboardData.map(entry => ({
        ...entry,
        is_current_user: entry.user_id === userId
      }));
      setLeaderboardEntries(leaderboardWithUserFlag);

      // Load tier information based on real stats
      const tierInfo = await referralLoader.getUserTier(statsData.successful_referrals);
      setCurrentTier(tierInfo);
      
      const nextTierInfo = await referralLoader.getNextTier(statsData.successful_referrals);
      setNextTier(nextTierInfo);

      // Check for new achievements
      await referralService.checkAndAwardAchievements(userId!);

      // Subscribe to real-time updates
      const unsubscribeReferrals = referralService.subscribeToReferralUpdates(
        userId!,
        async () => {
          // Reload stats when new referral comes in
          const newStats = await referralService.getUserReferralStats(userId!);
          setReferralStats(newStats);
          toast.success('New referral detected! 🎉');
        }
      );

      const unsubscribeLeaderboard = referralService.subscribeToLeaderboardUpdates(
        async () => {
          // Reload leaderboard when it updates
          const newLeaderboard = await referralService.getLeaderboard(10);
          const withUserFlag = newLeaderboard.map(entry => ({
            ...entry,
            is_current_user: entry.user_id === userId
          }));
          setLeaderboardEntries(withUserFlag);
        }
      );

      // Cleanup subscriptions on unmount
      return () => {
        unsubscribeReferrals();
        unsubscribeLeaderboard();
      };

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (channel: string) => {
    try {
      // Track the share in database
      await referralService.trackShare(userId!, channel);
      
      // Reload share stats
      const newShareStats = await referralService.getShareStats(userId!);
      setShareStats(newShareStats);
      
      // Reload waitlist position (shares can affect position)
      const newWaitlistPosition = await referralService.getWaitlistPosition(userId!);
      setWaitlistPosition(newWaitlistPosition);
      
      toast.success(`Shared on ${channel}! +25 waitlist spots skipped`);
    } catch (error) {
      console.error('Error tracking share:', error);
      toast.error('Failed to track share');
    }
  };

  if (!isReady || loading) {
    return (
      <div className="flex min-h-screen">
        <LeftNavigation currentPage="referrals" />
        <div className="flex-1 ml-[60px] bg-gray-50">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Convert data for mobile component
  const mobileStats = referralStats ? {
    totalReferrals: referralStats.total_referrals,
    successfulReferrals: referralStats.successful_referrals,
    creditsBalance: referralStats.credits_balance,
    conversionRate: referralStats.conversion_rate,
    currentTier: currentTier?.name || 'Bronze',
    nextTierProgress: currentTier && nextTier ? 
      (referralStats.successful_referrals / nextTier.minReferrals) * 100 : 0
  } : undefined;

  const mobileLeaderboard = leaderboardEntries.map(entry => ({
    id: entry.user_id?.toString() || entry.id?.toString() || 'unknown',
    name: entry.display_name || entry.name || 'User',
    referrals: entry.total_referrals || entry.referrals || 0,
    tier: entry.current_tier || entry.tier || 'Bronze',
    isCurrentUser: entry.is_current_user || false
  }));

  const desktopLayout = (
    <div className="flex min-h-screen bg-gray-50">
      <LeftNavigation currentPage="referrals" />
      
      <div className="flex-1 ml-[60px]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans']">
                  Referral Hub
                </h1>
                <p className="text-gray-600 mt-1">
                  Share Squidgy and earn rewards for every friend who joins
                </p>
              </div>
              
              {currentTier && (
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="secondary" 
                    className="text-lg px-4 py-2"
                    style={{ backgroundColor: currentTier.color + '20', color: currentTier.color }}
                  >
                    {currentTier.icon} {currentTier.name} Tier
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="dashboard" className="text-sm font-medium">
                📊 My Dashboard
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="text-sm font-medium">
                ⏱️ Waitlist Status
              </TabsTrigger>
              <TabsTrigger value="share" className="text-sm font-medium">
                🚀 Share & Earn
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-sm font-medium">
                🏆 Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4" style={{ borderLeftColor: uiSettings?.colors?.primary || '#6017E8' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Referrals</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{referralStats?.total_referrals || 0}</div>
                  </CardHeader>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: uiSettings?.colors?.success || '#10B981' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Successful</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{referralStats?.successful_referrals || 0}</div>
                  </CardHeader>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: uiSettings?.colors?.warning || '#F59E0B' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Credits Balance</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{referralStats?.credits_balance || 0}</div>
                  </CardHeader>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: uiSettings?.colors?.accent || '#51A2FF' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{referralStats?.conversion_rate || 0}%</div>
                  </CardHeader>
                </Card>
              </div>

              {/* Main Dashboard Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MyReferralStats 
                  stats={referralStats} 
                  currentTier={currentTier}
                  nextTier={nextTier}
                  loading={loading} 
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🎯 Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Get started with sharing and earning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full"
                      style={{ backgroundColor: uiSettings?.colors?.primary || '#6017E8' }}
                      onClick={() => setActiveTab('share')}
                    >
                      📤 Share Your Link
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('leaderboard')}
                    >
                      🏆 View Leaderboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(referralCode);
                          toast.success('Referral code copied to clipboard!');
                        } catch (error) {
                          toast.error('Failed to copy referral code');
                        }
                      }}
                    >
                      📋 Copy Referral Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="waitlist" className="space-y-6">
              {waitlistPosition && (
                <WaitlistStatus 
                  position={waitlistPosition} 
                  loading={loading} 
                  onNavigateToShare={() => setActiveTab('share')}
                />
              )}
            </TabsContent>

            <TabsContent value="share" className="space-y-6">
              {shareStats && (
                <ShareAndEarn 
                  referralCode={referralCode}
                  referralLink={referralLink}
                  onShare={handleShare}
                  shareStats={shareStats}
                />
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <ReferralLeaderboard 
                entries={leaderboardEntries}
                timeframe="all_time"
                onTimeframeChange={(timeframe) => console.log('Timeframe changed:', timeframe)}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveLayout
      desktopLayout={desktopLayout}
      showBottomNav={true}
    >
      <MobileReferralHub 
        stats={mobileStats}
        leaderboard={mobileLeaderboard}
        referralCode={referralCode}
      />
    </ResponsiveLayout>
  );
}
