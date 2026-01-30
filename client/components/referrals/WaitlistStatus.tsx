import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WaitlistPosition } from '@/types/referral.types';
import ReferralFlowLoader from '@/services/referralFlowLoader';

interface WaitlistStatusProps {
  position: WaitlistPosition;
  loading?: boolean;
  onNavigateToShare?: () => void;
}

export function WaitlistStatus({ position, loading = false, onNavigateToShare }: WaitlistStatusProps) {
  const [waitlistConfig, setWaitlistConfig] = useState<any>(null);
  const referralLoader = ReferralFlowLoader.getInstance();

  useEffect(() => {
    loadWaitlistConfig();
  }, []);

  const loadWaitlistConfig = async () => {
    try {
      const config = await referralLoader.getWaitlistConfig();
      setWaitlistConfig(config);
    } catch (error) {
      console.error('Error loading waitlist config:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const improvementPercent = ((position.original_position - position.current_position) / position.original_position) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
              #{position.current_position}
            </div>
          </div>
          <CardTitle className="text-2xl">
            You're #{position.current_position} in line
          </CardTitle>
          {position.is_priority ? (
            <div className="flex justify-center">
              <Badge className="bg-green-100 text-green-800 text-lg">
                🚀 Priority Queue
              </Badge>
            </div>
          ) : (
            <CardDescription className="text-lg">
              Estimated wait time: {position.estimated_wait_time}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Visualization */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Started at #{position.original_position}</span>
              <span>Current: #{position.current_position}</span>
            </div>
            <Progress 
              value={improvementPercent} 
              className="h-3"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600">
                {position.spots_skipped}
              </span>
              <span className="text-gray-600 ml-1">spots skipped!</span>
            </div>
          </div>

          {/* Status Message */}
          {position.can_skip_instantly ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">🎉 Congratulations!</h3>
              <p className="text-green-700">
                {waitlistConfig?.messaging?.vip_message || "You've earned instant access!"}
              </p>
              <Button className="mt-3 bg-green-600 hover:bg-green-700">
                Get Instant Access
              </Button>
            </div>
          ) : position.is_priority ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800">⚡ Priority Access</h3>
              <p className="text-blue-700">
                You're in the priority queue! Expected wait: {waitlistConfig?.messaging?.priority_wait_time || "3-5 days"}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800">⏱️ Regular Queue</h3>
              <p className="text-gray-700">
                Keep referring friends to improve your position!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">👥</span>
            </div>
            <CardTitle className="text-lg">Refer Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {waitlistConfig?.skip_mechanics?.per_referral || 100}
            </div>
            <p className="text-gray-600 text-sm mb-4">
              spots skipped per friend signup
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onNavigateToShare}
            >
              Share Your Link
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">📱</span>
            </div>
            <CardTitle className="text-lg">Social Media Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {waitlistConfig?.skip_mechanics?.per_social_share || 25}
            </div>
            <p className="text-gray-600 text-sm mb-4">
              spots per social media post
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onNavigateToShare}
            >
              Post on Social Media
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fast Track Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Fast Track Milestones</CardTitle>
          <CardDescription>
            Achieve these goals to unlock special benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🥉</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Priority Queue</h4>
                <p className="text-sm text-gray-600">
                  {waitlistConfig?.fast_track_thresholds?.priority_queue || 3} referrals needed
                </p>
                <div className="text-xs text-gray-500">
                  Wait time: {waitlistConfig?.messaging?.priority_wait_time || "3-5 days"}
                </div>
              </div>
              {position.is_priority && (
                <Badge className="bg-green-100 text-green-800">✓</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Instant Access</h4>
                <p className="text-sm text-gray-600">
                  {waitlistConfig?.fast_track_thresholds?.instant_access || 5} referrals needed
                </p>
                <div className="text-xs text-gray-500">
                  Skip the entire waitlist
                </div>
              </div>
              {position.can_skip_instantly && (
                <Badge className="bg-green-100 text-green-800">✓</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
