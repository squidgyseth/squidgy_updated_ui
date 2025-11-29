import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/types/referral.types';
import ReferralFlowLoader from '@/services/referralFlowLoader';

interface ReferralLeaderboardProps {
  entries: LeaderboardEntry[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  loading?: boolean;
}

export function ReferralLeaderboard({ 
  entries, 
  timeframe, 
  onTimeframeChange, 
  loading = false 
}: ReferralLeaderboardProps) {
  const [leaderboardConfig, setLeaderboardConfig] = useState<any>(null);
  const [mockEntries, setMockEntries] = useState<LeaderboardEntry[]>([]);
  
  const referralLoader = ReferralFlowLoader.getInstance();

  useEffect(() => {
    loadLeaderboardConfig();
    generateMockData();
  }, []);

  const loadLeaderboardConfig = async () => {
    try {
      const config = await referralLoader.getLeaderboardConfig();
      setLeaderboardConfig(config);
    } catch (error) {
      console.error('Error loading leaderboard config:', error);
    }
  };

  const generateMockData = () => {
    // Mock data for demonstration
    const mockData: LeaderboardEntry[] = [
      { rank: 1, user_id: '1', name: 'Alex Chen', referrals: 47, tier: 'diamond', is_current_user: false },
      { rank: 2, user_id: '2', name: 'Sarah Johnson', referrals: 42, tier: 'diamond', is_current_user: false },
      { rank: 3, user_id: '3', name: 'Mike Rodriguez', referrals: 38, tier: 'gold', is_current_user: false },
      { rank: 4, user_id: '4', name: 'Emily Davis', referrals: 31, tier: 'gold', is_current_user: false },
      { rank: 5, user_id: '5', name: 'You', referrals: 28, tier: 'gold', is_current_user: true },
      { rank: 6, user_id: '6', name: 'David Wilson', referrals: 24, tier: 'gold', is_current_user: false },
      { rank: 7, user_id: '7', name: 'Lisa Park', referrals: 19, tier: 'silver', is_current_user: false },
      { rank: 8, user_id: '8', name: 'John Smith', referrals: 16, tier: 'silver', is_current_user: false },
      { rank: 9, user_id: '9', name: 'Anna Brown', referrals: 12, tier: 'silver', is_current_user: false },
      { rank: 10, user_id: '10', name: 'Tom Lee', referrals: 9, tier: 'bronze', is_current_user: false },
    ];
    setMockEntries(mockData);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🏆';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return '#B9F2FF';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#6B7280';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataToShow = entries.length > 0 ? entries : mockEntries;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Referral Leaderboard
          </CardTitle>
          <CardDescription>
            See how you rank against other Squidgy advocates - All Time Rankings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Top 3 Podium */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-end gap-4 mb-8 max-w-4xl mx-auto">
            {/* 2nd Place */}
            {dataToShow[1] && (
              <div className="text-center flex-1 max-w-[160px]">
                <div className="relative mb-3">
                  <Avatar className="w-16 h-16 mx-auto border-4" style={{ borderColor: '#C0C0C0' }}>
                    <AvatarImage src={dataToShow[1].avatar} />
                    <AvatarFallback className="text-lg font-bold">
                      {dataToShow[1].name ? dataToShow[1].name.split(' ').map(n => n[0]).join('') : '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="rounded-t-lg px-2 py-3 h-20 bg-gray-100 flex flex-col justify-center">
                  <div className="text-xl mb-1">🥈</div>
                  <div className={`font-bold text-xs truncate ${dataToShow[1].is_current_user ? 'text-purple-600' : 'text-gray-900'}`}>
                    {dataToShow[1].name}
                  </div>
                  <div className="text-xs text-gray-600">{dataToShow[1].referrals} referrals</div>
                  <div className="text-xs mt-1 truncate" style={{ color: getTierColor(dataToShow[1].tier) }}>
                    {getTierIcon(dataToShow[1].tier)} {dataToShow[1].tier}
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {dataToShow[0] && (
              <div className="text-center flex-1 max-w-[180px]">
                <div className="relative mb-3">
                  <Avatar className="w-20 h-20 mx-auto border-4" style={{ borderColor: '#FFD700' }}>
                    <AvatarImage src={dataToShow[0].avatar} />
                    <AvatarFallback className="text-lg font-bold">
                      {dataToShow[0].name ? dataToShow[0].name.split(' ').map(n => n[0]).join('') : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-4xl">👑</div>
                </div>
                <div className="rounded-t-lg px-3 py-4 h-24 bg-yellow-100 flex flex-col justify-center">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className={`font-bold truncate ${dataToShow[0].is_current_user ? 'text-purple-600' : 'text-gray-900'}`}>
                    {dataToShow[0].name}
                  </div>
                  <div className="text-sm text-gray-600">{dataToShow[0].referrals} referrals</div>
                  <div className="text-sm mt-1 truncate" style={{ color: getTierColor(dataToShow[0].tier) }}>
                    {getTierIcon(dataToShow[0].tier)} {dataToShow[0].tier}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {dataToShow[2] && (
              <div className="text-center flex-1 max-w-[160px]">
                <div className="relative mb-3">
                  <Avatar className="w-16 h-16 mx-auto border-4" style={{ borderColor: '#CD7F32' }}>
                    <AvatarImage src={dataToShow[2].avatar} />
                    <AvatarFallback className="text-lg font-bold">
                      {dataToShow[2].name ? dataToShow[2].name.split(' ').map(n => n[0]).join('') : '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="rounded-t-lg px-2 py-3 h-20 bg-orange-100 flex flex-col justify-center">
                  <div className="text-xl mb-1">🥉</div>
                  <div className={`font-bold text-xs truncate ${dataToShow[2].is_current_user ? 'text-purple-600' : 'text-gray-900'}`}>
                    {dataToShow[2].name}
                  </div>
                  <div className="text-xs text-gray-600">{dataToShow[2].referrals} referrals</div>
                  <div className="text-xs mt-1 truncate" style={{ color: getTierColor(dataToShow[2].tier) }}>
                    {getTierIcon(dataToShow[2].tier)} {dataToShow[2].tier}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dataToShow.map((entry) => (
              <div 
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  entry.is_current_user 
                    ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Rank */}
                <div className="text-center w-12">
                  <div className="text-lg font-bold text-gray-600">
                    {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                  </div>
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>
                    {entry.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className={`font-semibold ${entry.is_current_user ? 'text-purple-700' : 'text-gray-900'}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="ml-2 text-sm text-purple-600">(You)</span>}
                  </div>
                  <div className="text-sm text-gray-600">{entry.referrals} successful referrals</div>
                </div>

                {/* Tier Badge */}
                <Badge 
                  variant="outline"
                  className="text-sm"
                  style={{ 
                    backgroundColor: getTierColor(entry.tier) + '20',
                    borderColor: getTierColor(entry.tier) + '50',
                    color: getTierColor(entry.tier) === '#B9F2FF' ? '#1E40AF' : '#000'
                  }}
                >
                  {getTierIcon(entry.tier)} {entry.tier}
                </Badge>

                {/* Referrals Count */}
                <div className="text-right min-w-[60px]">
                  <div className="text-xl font-bold text-gray-900">{entry.referrals}</div>
                  <div className="text-xs text-gray-500">referrals</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}