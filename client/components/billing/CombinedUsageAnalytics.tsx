import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, LineChartIcon, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { userTokenUsageApi, userToolUsageApi, toolUseCostApi } from '../../lib/supabase-api';

type TimePeriod = 'today' | '7days' | '14days' | 'month' | 'all';

interface CombinedUsageData {
  date: string;
  apiTokens: number;
  toolCostTokens: number;
  totalTokens: number;
}

interface CombinedUsageAnalyticsProps {
  userId: string;
}

export default function CombinedUsageAnalytics({ userId }: CombinedUsageAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [usageData, setUsageData] = useState<CombinedUsageData[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [toolCostTokens, setToolCostTokens] = useState(0);
  const [actualTotal, setActualTotal] = useState(0);
  const [apiRequests, setApiRequests] = useState(0);
  const [toolUses, setToolUses] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      loadCombinedUsage();
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

  const loadCombinedUsage = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch all data in parallel
      const [tokenResult, toolUsageResult, toolCostsResult] = await Promise.all([
        userTokenUsageApi.getByUserIdWithDateRange(userId, startDate, endDate),
        userToolUsageApi.getByUserIdWithDateRange(userId, startDate, endDate),
        toolUseCostApi.getAll()
      ]);

      // Calculate token totals
      let tokenTotal = 0;
      let requestCount = 0;
      if (tokenResult.data && !tokenResult.error) {
        tokenResult.data.forEach((record: any) => {
          const total = Number(record['Total Token']) || 0;
          tokenTotal += total;
        });
        requestCount = tokenResult.data.length;
      }

      // Create tool cost map (costs are in tokens)
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
      let toolUseCount = 0;
      if (toolUsageResult.data && !toolUsageResult.error) {
        toolUsageResult.data.forEach((record: any) => {
          const tool = record['Tool Used'] || 'Unknown';
          const costPerUse = toolCostMap[tool] || 0;
          toolTokenCost += costPerUse;
        });
        toolUseCount = toolUsageResult.data.length;
      }

      const combinedTotal = tokenTotal + toolTokenCost;

      // Combine data by timestamp for graph
      const combinedUsage: { [key: string]: { data: CombinedUsageData; sortKey: number } } = {};

      // Process token usage data
      if (tokenResult.data && !tokenResult.error) {
        tokenResult.data.forEach((record: any) => {
          const recordDate = new Date(record['created_at(Time of response)']);
          let dateKey: string;
          let sortKey: number;

          if (timePeriod === 'today') {
            const hour = recordDate.getHours();
            const minute = recordDate.getMinutes();
            const roundedMinute = Math.floor(minute / 5) * 5;
            const roundedDate = new Date(recordDate);
            roundedDate.setMinutes(roundedMinute);
            roundedDate.setSeconds(0);
            dateKey = roundedDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            sortKey = hour * 60 + roundedMinute;
          } else {
            dateKey = recordDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            sortKey = recordDate.getTime();
          }

          if (!combinedUsage[dateKey]) {
            combinedUsage[dateKey] = {
              data: {
                date: dateKey,
                apiTokens: 0,
                toolCostTokens: 0,
                totalTokens: 0
              },
              sortKey
            };
          }

          const totalToken = Number(record['Total Token']) || 0;
          combinedUsage[dateKey].data.apiTokens += totalToken;
          combinedUsage[dateKey].data.totalTokens += totalToken;
        });
      }

      // Process tool usage data and add costs
      if (toolUsageResult.data && !toolUsageResult.error) {
        toolUsageResult.data.forEach((record: any) => {
          const recordDate = new Date(record['created_at']);
          let dateKey: string;
          let sortKey: number;

          if (timePeriod === 'today') {
            const hour = recordDate.getHours();
            const minute = recordDate.getMinutes();
            const roundedMinute = Math.floor(minute / 5) * 5;
            const roundedDate = new Date(recordDate);
            roundedDate.setMinutes(roundedMinute);
            roundedDate.setSeconds(0);
            dateKey = roundedDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            sortKey = hour * 60 + roundedMinute;
          } else {
            dateKey = recordDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            sortKey = recordDate.getTime();
          }

          if (!combinedUsage[dateKey]) {
            combinedUsage[dateKey] = {
              data: {
                date: dateKey,
                apiTokens: 0,
                toolCostTokens: 0,
                totalTokens: 0
              },
              sortKey
            };
          }

          const tool = record['Tool Used'] || 'Unknown';
          const costPerUse = toolCostMap[tool] || 0;
          combinedUsage[dateKey].data.toolCostTokens += costPerUse;
          combinedUsage[dateKey].data.totalTokens += costPerUse;
        });
      }

      // Convert to array and sort
      let chartData = Object.values(combinedUsage)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(item => item.data);

      // For 'today' view, fill in missing 5-minute intervals with zero values
      if (timePeriod === 'today') {
        const filledData: CombinedUsageData[] = [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const currentTime = new Date();
        
        // Create a map of existing data for quick lookup
        const dataMap = new Map<string, CombinedUsageData>();
        chartData.forEach(item => {
          dataMap.set(item.date, item);
        });
        
        // Generate all 5-minute intervals from start of day (12 AM) to now
        for (let time = new Date(startOfDay); time <= currentTime; time.setMinutes(time.getMinutes() + 5)) {
          const timeKey = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          if (dataMap.has(timeKey)) {
            filledData.push(dataMap.get(timeKey)!);
          } else {
            filledData.push({
              date: timeKey,
              apiTokens: 0,
              toolCostTokens: 0,
              totalTokens: 0
            });
          }
        }
        
        chartData = filledData;
      }

      setUsageData(chartData);
      setTotalTokens(tokenTotal);
      setToolCostTokens(toolTokenCost);
      setActualTotal(combinedTotal);
      setApiRequests(requestCount);
      setToolUses(toolUseCount);
    } catch (error) {
      console.error('Error loading combined usage data:', error);
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

  const handleLegendClick = (dataKey: string) => {
    setSelectedSeries(prev => {
      if (prev.includes(dataKey)) {
        // If already selected, deselect it
        return prev.filter(key => key !== dataKey);
      } else {
        // If not selected, add it to selection
        return [...prev, dataKey];
      }
    });
  };

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
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-medium text-gray-900">Combined Usage Overview</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Actual Total</div>
          <div className="text-3xl font-bold text-purple-900">{actualTotal.toLocaleString()}</div>
          <div className="text-xs text-purple-600 mt-1">tokens (API + Tools)</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">API Tokens</div>
          <div className="text-2xl font-bold text-blue-900">{totalTokens.toLocaleString()}</div>
          <div className="text-xs text-blue-600 mt-1">{apiRequests} requests</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Tool Cost Tokens</div>
          <div className="text-2xl font-bold text-green-900">{toolCostTokens.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">{toolUses} tool uses</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">API Requests</div>
          <div className="text-2xl font-bold text-orange-900">{apiRequests.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
          <div className="text-sm text-pink-600 font-medium mb-1">Tool Uses</div>
          <div className="text-2xl font-bold text-pink-900">{toolUses.toLocaleString()}</div>
        </div>
      </div>

      {/* Usage Chart */}
      {usageData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Combined Usage Trend</h3>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  chartType === 'line'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  chartType === 'bar'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Bar
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {(selectedSeries.length === 0 || selectedSeries.includes('apiTokens')) && (
                  <Line 
                    type="monotone" 
                    dataKey="apiTokens" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="API Tokens"
                    dot={false}
                  />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('toolCostTokens')) && (
                  <Line 
                    type="monotone" 
                    dataKey="toolCostTokens" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Tool Cost Tokens"
                    dot={false}
                  />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('totalTokens')) && (
                  <Line 
                    type="monotone" 
                    dataKey="totalTokens" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Total Tokens"
                    dot={false}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {(selectedSeries.length === 0 || selectedSeries.includes('apiTokens')) && (
                  <Bar 
                    dataKey="apiTokens" 
                    fill="#3b82f6" 
                    name="API Tokens" 
                  />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('toolCostTokens')) && (
                  <Bar 
                    dataKey="toolCostTokens" 
                    fill="#10b981" 
                    name="Tool Cost Tokens" 
                  />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('totalTokens')) && (
                  <Bar 
                    dataKey="totalTokens" 
                    fill="#8b5cf6" 
                    name="Total Tokens" 
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
          
          {/* Custom Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button
              onClick={() => handleLegendClick('apiTokens')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedSeries.includes('apiTokens')
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('apiTokens') ? 'text-blue-900' : 'text-gray-500'
              }`}>
                API Tokens
              </span>
            </button>
            
            <button
              onClick={() => handleLegendClick('toolCostTokens')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedSeries.includes('toolCostTokens')
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('toolCostTokens') ? 'text-green-900' : 'text-gray-500'
              }`}>
                Tool Cost Tokens
              </span>
            </button>
            
            <button
              onClick={() => handleLegendClick('totalTokens')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedSeries.includes('totalTokens')
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('totalTokens') ? 'text-purple-900' : 'text-gray-500'
              }`}>
                Total Tokens
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Token Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">API Tokens:</span>
              <span className="font-semibold text-gray-900">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-semibold text-gray-900">
                {actualTotal > 0 ? ((totalTokens / actualTotal) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Tool Cost Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tool Tokens:</span>
              <span className="font-semibold text-gray-900">{toolCostTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-semibold text-gray-900">
                {actualTotal > 0 ? ((toolCostTokens / actualTotal) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
