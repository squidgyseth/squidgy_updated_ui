import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShareAndEarn } from '@/components/referrals/ShareAndEarn';
import { useUser } from '@/hooks/useUser';
import ReferralService from '@/services/referralService';
import { WaitlistPosition, ReferralStats, ShareStats } from '@/types/referral.types';
import { toast } from 'sonner';
import { CheckCircle, Users, Zap, Trophy, ArrowRight, Copy, Share2 } from 'lucide-react';
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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      loadWaitlistData();
    }
  }, [isReady, userId]);

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

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      toast.error('Failed to copy link');
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 font-['Open_Sans']">
            Welcome to the Waitlist! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            Congratulations {profile?.full_name || 'there'}! You've successfully joined the Squidgy AI waitlist.
          </p>
          
          <p className="text-lg text-gray-500">
            Get ready to transform your business with AI-powered assistants.
          </p>
        </div>

        {/* Waitlist Position Card */}
        {waitlistPosition && (
          <Card className="mb-8 border-2 border-purple-200 shadow-xl">
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="text-3xl">Your Waitlist Position</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white mb-4">
                  <span className="text-5xl font-bold">#{waitlistPosition.current_position}</span>
                </div>
                
                {waitlistPosition.is_priority ? (
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    <Zap className="w-4 h-4 mr-1" />
                    Priority Queue - 3-5 days wait
                  </Badge>
                ) : (
                  <div>
                    <p className="text-lg text-gray-600 mb-2">
                      Estimated wait time: <strong>{waitlistPosition.estimated_wait_time}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      Skip the line by referring friends!
                    </p>
                  </div>
                )}
              </div>

              {/* Progress from original position */}
              {waitlistPosition.original_position > waitlistPosition.current_position && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Started at #{waitlistPosition.original_position}</span>
                    <span className="font-semibold text-green-600">
                      {waitlistPosition.spots_skipped} spots skipped!
                    </span>
                  </div>
                  <Progress 
                    value={(waitlistPosition.spots_skipped / waitlistPosition.original_position) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Share Your Link Card */}
          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Share Your Unique Link</CardTitle>
                  <CardDescription>Each friend who joins = 100 spots skipped</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <Button
                  onClick={copyReferralLink}
                  variant={copiedLink ? "default" : "outline"}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              
              <Button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Share Now & Skip 100 Spots
              </Button>
            </CardContent>
          </Card>

          {/* Milestones Card */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Unlock Fast Track Access</CardTitle>
                  <CardDescription>Achieve milestones for special benefits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3 Referrals</Badge>
                    <span className="text-sm">Priority Queue</span>
                  </div>
                  {referralStats && referralStats.successful_referrals >= 3 && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">5 Referrals</Badge>
                    <span className="text-sm">Instant Access</span>
                  </div>
                  {referralStats && referralStats.successful_referrals >= 5 && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Current referrals: <strong>{referralStats?.successful_referrals || 0}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Options (shown when button clicked) */}
        {showShareOptions && (
          <Card className="mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle>Share on Social Media</CardTitle>
              <CardDescription>Each post gives you +25 bonus spots!</CardDescription>
            </CardHeader>
            <CardContent>
              <ShareAndEarn
                referralCode={referralCode}
                referralLink={referralLink}
                onShare={handleShare}
                shareStats={shareStats || { 
                  total_shares: 0, 
                  shares_by_channel: { 
                    email: 0, 
                    instagram: 0, 
                    linkedin: 0, 
                    whatsapp: 0, 
                    other: 0 
                  }, 
                  clicks: 0, 
                  conversions: 0,
                  click_through_rate: 0,
                  conversion_rate: 0 
                }}
              />
            </CardContent>
          </Card>
        )}

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