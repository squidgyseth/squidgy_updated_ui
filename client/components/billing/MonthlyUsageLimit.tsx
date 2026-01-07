import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { userTokenUsageApi, userToolUsageApi, toolUseCostApi } from '../../lib/supabase-api';

interface MonthlyUsageLimitProps {
  userId: string;
}

export default function MonthlyUsageLimit({ userId }: MonthlyUsageLimitProps) {
  const [loading, setLoading] = useState(true);
  const [totalUsage, setTotalUsage] = useState(0);
  const limit = 1000000;

  useEffect(() => {
    if (userId) {
      loadMonthlyUsage();
    }
  }, [userId]);

  const loadMonthlyUsage = async () => {
    try {
      setLoading(true);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Fetch token usage and tool usage for current month
      const [tokenResult, toolUsageResult, toolCostsResult] = await Promise.all([
        userTokenUsageApi.getByUserIdWithDateRange(userId, startOfMonth.toISOString(), endOfMonth.toISOString()),
        userToolUsageApi.getByUserIdWithDateRange(userId, startOfMonth.toISOString(), endOfMonth.toISOString()),
        toolUseCostApi.getAll()
      ]);

      // Calculate token usage
      let tokenTotal = 0;
      if (tokenResult.data && !tokenResult.error) {
        tokenResult.data.forEach((record: any) => {
          const total = Number(record['Total Token']) || 0;
          tokenTotal += total;
        });
      }

      // Create tool cost map
      const toolCostMap: { [key: string]: number } = {};
      if (toolCostsResult.data && !toolCostsResult.error) {
        toolCostsResult.data.forEach((costRecord: any) => {
          const toolName = costRecord['Tool Name'];
          const cost = Number(costRecord['Cost']) || 0;
          if (toolName) {
            toolCostMap[toolName] = cost;
          }
        });
      }

      // Calculate tool cost tokens
      let toolTokenCost = 0;
      if (toolUsageResult.data && !toolUsageResult.error) {
        toolUsageResult.data.forEach((record: any) => {
          const tool = record['Tool Used'] || 'Unknown';
          const costPerUse = toolCostMap[tool] || 0;
          toolTokenCost += costPerUse;
        });
      }

      const combinedTotal = tokenTotal + toolTokenCost;
      setTotalUsage(combinedTotal);
    } catch (error) {
      console.error('Error loading monthly usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const percentage = (totalUsage / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 mb-6 ${
      isOverLimit 
        ? 'bg-red-50 border-red-300' 
        : isNearLimit 
        ? 'bg-yellow-50 border-yellow-300' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-5 h-5 ${
            isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-purple-600'
          }`} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Token Usage</h3>
            <p className="text-sm text-gray-600">Current billing period</p>
          </div>
        </div>
        
        {isNearLimit && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-yellow-400">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {isOverLimit ? 'Limit Exceeded' : 'Approaching Limit'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-gray-900">
            {totalUsage.toLocaleString()}
          </span>
          <span className="text-lg text-gray-500">
            / {limit.toLocaleString()} tokens
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              isOverLimit
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : isNearLimit
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${
            isOverLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-gray-600'
          }`}>
            {percentage.toFixed(1)}% used
          </span>
          <span className="text-gray-500">
            {(limit - totalUsage).toLocaleString()} tokens remaining
          </span>
        </div>
      </div>
    </div>
  );
}
