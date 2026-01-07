import React, { useState, useEffect } from 'react';
import { Wrench, Calendar } from 'lucide-react';
import { userToolUsageApi, toolUseCostApi } from '../../lib/supabase-api';

type TimePeriod = 'today' | '7days' | '14days' | 'month' | 'all';

interface ToolUsageAnalyticsProps {
  userId: string;
}

export default function ToolUsageAnalytics({ userId }: ToolUsageAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [toolStats, setToolStats] = useState<{ tool: string; count: number; cost: number }[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (userId) {
      loadToolUsage();
    }
  }, [userId, timePeriod]);

  const getDateRange = (): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: Date;

    switch (timePeriod) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14days':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate
    };
  };

  const loadToolUsage = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch both tool usage and tool costs
      const [usageResult, costsResult] = await Promise.all([
        userToolUsageApi.getByUserIdWithDateRange(userId, startDate, endDate),
        toolUseCostApi.getAll()
      ]);

      if (usageResult.error) {
        console.error('Error loading tool usage data:', usageResult.error);
        return;
      }

      if (!usageResult.data || usageResult.data.length === 0) {
        setToolStats([]);
        setTotalUsage(0);
        setTotalCost(0);
        return;
      }

      // Create a map of tool costs
      const toolCostMap: { [key: string]: number } = {};
      if (costsResult.data && !costsResult.error) {
        costsResult.data.forEach((costRecord: any) => {
          const toolName = costRecord['Tool Name'];
          const cost = Number(costRecord['Cost']) || 0;
          if (toolName) {
            toolCostMap[toolName] = cost;
          }
        });
      }

      // Count tool usage and calculate costs
      const toolCounts: { [key: string]: number } = {};
      
      usageResult.data.forEach((record: any) => {
        const tool = record['Tool Used'] || 'Unknown';
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      });

      // Convert to array with costs and sort by count
      let totalCostCalc = 0;
      const toolStatsArray = Object.entries(toolCounts)
        .map(([tool, count]) => {
          const costPerUse = toolCostMap[tool] || 0;
          const totalToolCost = costPerUse * count;
          totalCostCalc += totalToolCost;
          return { tool, count, cost: totalToolCost };
        })
        .sort((a, b) => b.count - a.count);

      setToolStats(toolStatsArray);
      setTotalUsage(usageResult.data.length);
      setTotalCost(totalCostCalc);
    } catch (error) {
      console.error('Error processing tool usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const timePeriodOptions: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '14days', label: 'Last 14 Days' },
    { value: 'month', label: 'Last Month' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-medium text-gray-900">Tool Usage Analytics</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {timePeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Total Tool Uses</div>
          <div className="text-2xl font-bold text-purple-900">{totalUsage.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Unique Tools</div>
          <div className="text-2xl font-bold text-blue-900">{toolStats.length}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Total Cost (Tokens)</div>
          <div className="text-2xl font-bold text-green-900">{totalCost.toLocaleString()}</div>
        </div>
      </div>

      {/* Tool Breakdown */}
      {toolStats.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Tool Breakdown</h3>
          <div className="space-y-3">
            {toolStats.map((stat, index) => (
              <div key={stat.tool} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-purple-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{stat.tool}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm text-gray-500">{stat.count} uses</span>
                      <span className="text-sm font-semibold text-green-600">{stat.cost.toLocaleString()} tokens</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stat.count / totalUsage) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No tool usage data available</p>
        </div>
      )}
    </div>
  );
}
