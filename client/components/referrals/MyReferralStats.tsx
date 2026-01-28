import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ReferralStats } from '@/types/referral.types';

interface MyReferralStatsProps {
  stats: ReferralStats;
  currentTier?: any;
  nextTier?: any;
  loading?: boolean;
}

export function MyReferralStats({ stats, currentTier, nextTier, loading = false }: MyReferralStatsProps) {
  // Add null safety check
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }
  if (loading) {
    return (
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
    );
  }

  const progressPercent = nextTier 
    ? ((stats.total_referrals / nextTier.tier.min_referrals) * 100)
    : 100;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 My Referral Stats
        </CardTitle>
        <CardDescription>
          Your referral performance overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier Status */}
        {currentTier && (
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: currentTier.color + '10',
            borderColor: currentTier.color + '30'
          }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Current Tier</h3>
                <p className="text-sm text-gray-600">
                  {currentTier.name} Member
                </p>
              </div>
              <div className="text-3xl">{currentTier.icon}</div>
            </div>
            
            <div className="space-y-2">
              {currentTier.rewards?.map((reward: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">{reward.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Progress to {nextTier.tier.name}</h4>
                <p className="text-sm text-gray-600">
                  {stats.referrals_to_next_tier} more referrals needed
                </p>
              </div>
              <span className="text-2xl">{nextTier.tier.icon}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {stats.total_referrals} / {nextTier.tier.min_referrals} referrals
                </span>
                <span className="font-medium text-gray-900">
                  {Math.min(progressPercent, 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(progressPercent, 100)} className="h-2" />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.successful_referrals}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.pending_referrals}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total_credits_earned}</div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.conversion_rate}%</div>
            <div className="text-sm text-gray-600">Conversion</div>
          </div>
        </div>

        {/* Next Tier Benefits Preview */}
        {nextTier && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">
              {nextTier.tier.name} Tier Benefits
            </h5>
            <div className="space-y-1">
              {nextTier.tier.rewards?.slice(0, 2).map((reward: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-purple-600">→</span>
                  <span>{reward.description}</span>
                </div>
              ))}
              {nextTier.tier.rewards?.length > 2 && (
                <div className="text-sm text-gray-500 italic">
                  +{nextTier.tier.rewards.length - 2} more benefits
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
