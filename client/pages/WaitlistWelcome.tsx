import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WaitlistStatus } from '@/components/referrals/WaitlistStatus';
import { ShareAndEarn } from '@/components/referrals/ShareAndEarn';
import { useUser } from '@/hooks/useUser';
import ReferralService from '@/services/referralService';
import { WaitlistPosition, ReferralStats, ShareStats } from '@/types/referral.types';
import { toast } from 'sonner';
import { CheckCircle, ArrowRight, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WaitlistWelcome() {
  const navigate = useNavigate();
  const { userId, isReady, profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [waitlistPosition, setWaitlistPosition] = useState<WaitlistPosition | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'waitlist' | 'share'>('waitlist');

  const referralService = ReferralService.getInstance();

  useEffect(() => {
    // Trigger confetti animation on mount
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady && userId) {
      console.log('WaitlistWelcome: Loading data for user:', { userId, profile });
      loadWaitlistData();
    }
  }, [isReady, userId, profile]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);
      
      // Load user's waitlist and referral data
      const [
        referralCodeData,
        statsData,
        waitlistData,
        shareStatsData,
      ] = await Promise.all([
        referralService.getUserReferralCode(userId!),
        referralService.getUserReferralStats(userId!),
        referralService.getWaitlistPosition(userId!),
        referralService.getShareStats(userId!),
      ]);

      setReferralCode(referralCodeData.code);
      setReferralLink(referralCodeData.link);
      setReferralStats(statsData);
      setWaitlistPosition(waitlistData);
      setShareStats(shareStatsData);

    } catch (error) {
      console.error('Error loading waitlist data:', error);
      toast.error('Failed to load waitlist information');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (channel: string) => {
    try {
      // Track the share
      await referralService.trackShare(userId!, channel);
      
      // Reload waitlist position and share stats
      const [newWaitlistPosition, newShareStats] = await Promise.all([
        referralService.getWaitlistPosition(userId!),
        referralService.getShareStats(userId!)
      ]);
      setWaitlistPosition(newWaitlistPosition);
      setShareStats(newShareStats);
      
      toast.success(`Shared on ${channel}! +25 waitlist spots skipped`);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header with Logo */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
              alt="Squidgy"
              className="h-12"
            />
            <Button
              variant="outline"
              onClick={() => navigate('/referrals')}
              className="gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 font-['Open_Sans']">
            Welcome to the Waitlist! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            Congratulations {profile?.full_name ? profile.full_name.trim().split(/\s+/)[0] : 'there'}! You've successfully joined the Squidgy AI waitlist.
          </p>
          
          <p className="text-lg text-gray-500">
            Get ready to transform your business with AI-powered assistants.
          </p>
        </div>

        {/* Tabs for Waitlist Status and Share & Earn */}
        <div className="mb-8">
          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={() => setActiveTab('waitlist')}
              variant={activeTab === 'waitlist' ? 'default' : 'outline'}
              className="min-w-[150px]"
            >
              ⏱️ Waitlist Status
            </Button>
            <Button
              onClick={() => setActiveTab('share')}
              variant={activeTab === 'share' ? 'default' : 'outline'}
              className="min-w-[150px]"
            >
              🚀 Share & Earn
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'waitlist' && waitlistPosition && (
            <WaitlistStatus 
              position={waitlistPosition} 
              loading={loading}
              onNavigateToShare={() => setActiveTab('share')}
            />
          )}

          {activeTab === 'share' && shareStats && (
            <ShareAndEarn
              referralCode={referralCode}
              referralLink={referralLink}
              onShare={handleShare}
              shareStats={shareStats}
            />
          )}
        </div>

        {/* What Happens Next */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-purple-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">We'll notify you when it's your turn</h4>
                  <p className="text-sm text-gray-600">Check your email for updates on your waitlist status</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-purple-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Share to skip the line faster</h4>
                  <p className="text-sm text-gray-600">Every friend who joins helps you get access sooner</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Track your progress</h4>
                  <p className="text-sm text-gray-600">Visit the Referral Hub anytime to see your current position</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-purple-200">
              <Button
                onClick={() => navigate('/referrals')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Go to Referral Hub
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}