import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, BarChart3, LineChartIcon } from 'lucide-react';
import { userTokenUsageApi } from '../../lib/supabase-api';

type TimePeriod = 'today' | '7days' | '14days' | 'month' | 'all';

interface UsageData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface UsageAnalyticsProps {
  userId: string;
}

export default function UsageAnalytics({ userId }: UsageAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      const scrollY = window.scrollY;
      loadUsageData().then(() => {
        window.scrollTo(0, scrollY);
      });
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
        startDate = new Date('2020-01-01'); // Far back enough to get all data
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate
    };
  };

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const { data, error } = await userTokenUsageApi.getByUserIdWithDateRange(
        userId,
        startDate,
        endDate
      );

      if (error) {
        console.error('Error loading usage data:', error);
        return;
      }

      if (!data || data.length === 0) {
        setUsageData([]);
        setTotalInputTokens(0);
        setTotalOutputTokens(0);
        setTotalTokens(0);
        setRequestCount(0);
        return;
      }

      // Process data for chart
      const dailyUsage: { [key: string]: { data: UsageData; sortKey: number } } = {};
      let totalInput = 0;
      let totalOutput = 0;
      let totalAll = 0;

      data.forEach((record: any) => {
        // Use response time for all grouping
        const recordDate = new Date(record['created_at(Time of response)']);
        let dateKey: string;
        let sortKey: number;
        
        if (timePeriod === 'today') {
          // For 5-minute interval breakdown
          const hour = recordDate.getHours();
          const minute = recordDate.getMinutes();
          // Round down to nearest 5-minute interval
          const roundedMinute = Math.floor(minute / 5) * 5;
          
          // Create a date with rounded minute for consistent formatting
          const roundedDate = new Date(recordDate);
          roundedDate.setMinutes(roundedMinute);
          roundedDate.setSeconds(0);
          
          dateKey = roundedDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          // Sort by total minutes since midnight
          sortKey = hour * 60 + roundedMinute;
        } else {
          // For daily breakdown, use date
          dateKey = recordDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          sortKey = recordDate.getTime();
        }

        const inputToken = Number(record['Input Token']) || 0;
        const outputToken = Number(record['Output Token']) || 0;
        const totalToken = Number(record['Total Token']) || 0;

        if (!dailyUsage[dateKey]) {
          dailyUsage[dateKey] = {
            data: {
              date: dateKey,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            },
            sortKey
          };
        }

        dailyUsage[dateKey].data.inputTokens += inputToken;
        dailyUsage[dateKey].data.outputTokens += outputToken;
        dailyUsage[dateKey].data.totalTokens += totalToken;
        
        totalInput += inputToken;
        totalOutput += outputToken;
        totalAll += totalToken;
      });

      // Convert to array and sort by sortKey
      let chartData = Object.values(dailyUsage)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(item => item.data);

      // For 'today' view, fill in missing 5-minute intervals with zero values
      if (timePeriod === 'today') {
        const filledData: UsageData[] = [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const currentTime = new Date();
        
        // Create a map of existing data for quick lookup
        const dataMap = new Map<string, UsageData>();
        chartData.forEach(item => {
          dataMap.set(item.date, item);
        });
        
        // Generate all 5-minute intervals from start of day to now
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
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            });
          }
        }
        
        chartData = filledData;
      }

      setUsageData(chartData);
      setTotalInputTokens(totalInput);
      setTotalOutputTokens(totalOutput);
      setTotalTokens(totalAll);
      setRequestCount(data.length);
    } catch (error) {
      console.error('Error processing usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLegendClick = (dataKey: string) => {
    setSelectedSeries(prev => {
      if (prev.includes(dataKey)) {
        return prev.filter(key => key !== dataKey);
      } else {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-medium text-gray-900">Token Usage Analytics</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Total Tokens</div>
          <div className="text-2xl font-bold text-purple-900">{totalTokens.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Input Tokens</div>
          <div className="text-2xl font-bold text-blue-900">{totalInputTokens.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Output Tokens</div>
          <div className="text-2xl font-bold text-green-900">{totalOutputTokens.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">API Requests</div>
          <div className="text-2xl font-bold text-orange-900">{requestCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Usage Chart */}
      {usageData.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Daily Token Usage Trend</h3>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                {(selectedSeries.length === 0 || selectedSeries.includes('inputTokens')) && (
                  <Line type="monotone" dataKey="inputTokens" stroke="#3b82f6" strokeWidth={2} name="Input Tokens" dot={false} />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('outputTokens')) && (
                  <Line type="monotone" dataKey="outputTokens" stroke="#10b981" strokeWidth={2} name="Output Tokens" dot={false} />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('totalTokens')) && (
                  <Line type="monotone" dataKey="totalTokens" stroke="#9333ea" strokeWidth={2} name="Total Tokens" dot={false} />
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                {(selectedSeries.length === 0 || selectedSeries.includes('inputTokens')) && (
                  <Bar dataKey="inputTokens" fill="#3b82f6" name="Input Tokens" radius={[8, 8, 0, 0]} />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('outputTokens')) && (
                  <Bar dataKey="outputTokens" fill="#10b981" name="Output Tokens" radius={[8, 8, 0, 0]} />
                )}
                {(selectedSeries.length === 0 || selectedSeries.includes('totalTokens')) && (
                  <Bar dataKey="totalTokens" fill="#9333ea" name="Total Tokens" radius={[8, 8, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
          
          {/* Custom Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button
              onClick={() => handleLegendClick('inputTokens')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedSeries.includes('inputTokens')
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('inputTokens') ? 'text-blue-900' : 'text-gray-500'
              }`}>
                Input Tokens
              </span>
            </button>
            
            <button
              onClick={() => handleLegendClick('outputTokens')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedSeries.includes('outputTokens')
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('outputTokens') ? 'text-green-900' : 'text-gray-500'
              }`}>
                Output Tokens
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
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9333ea' }}></div>
              <span className={`text-sm font-medium ${
                selectedSeries.includes('totalTokens') ? 'text-purple-900' : 'text-gray-500'
              }`}>
                Total Tokens
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No usage data available for this period</p>
        </div>
      )}

      {/* Token Breakdown */}
      {totalTokens > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Token Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">IN</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Input Tokens</span>
                  <span className="text-sm text-gray-500 ml-2">{totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(totalInputTokens / totalTokens) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-green-600">OUT</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Output Tokens</span>
                  <span className="text-sm text-gray-500 ml-2">{totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(totalOutputTokens / totalTokens) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
