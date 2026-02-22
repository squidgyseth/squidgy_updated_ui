// Admin Analytics - PostHog Analytics Dashboard

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { ArrowLeft, BarChart3, RefreshCw, Eye, Activity, ExternalLink, LayoutDashboard, List } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const POSTHOG_EMBED_URL = import.meta.env.VITE_POSTHOG_EMBED_URL || '';

interface InsightData {
  id: number;
  short_id: string;
  name: string;
  description: string;
  insight_type: string;
  last_refresh: string;
  created_at: string;
  aggregated_value?: number;
  count?: number;
  latest_value?: number;
  data_points?: number;
  trend_data?: number[];
  trend_labels?: string[];
}

interface TopEvent {
  name: string;
  volume_30_day: number | null;
  query_usage_30_day: number | null;
}

interface AnalyticsData {
  total_insights: number;
  insights: InsightData[];
  event_count: number;
  top_events: TopEvent[];
  last_updated: string;
}

type ViewMode = 'embed' | 'api';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(POSTHOG_EMBED_URL ? 'embed' : 'api');
  const [iframeKey, setIframeKey] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if PostHog is configured
      const configRes = await fetch(`${BACKEND_URL}/api/admin/analytics/config`);
      const configData = await configRes.json();
      setIsConfigured(configData.configured);
      
      if (!configData.configured) {
        setIsLoading(false);
        return;
      }
      
      // Fetch overview analytics
      const overviewRes = await fetch(`${BACKEND_URL}/api/admin/analytics/overview`);
      const overviewData = await overviewRes.json();
      
      if (overviewData.success) {
        setAnalyticsData(overviewData.data);
      } else {
        setError(overviewData.error || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to connect to analytics API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, adminLoading, navigate, fetchAnalytics]);

  const handleRefresh = () => {
    if (viewMode === 'embed') {
      setIframeLoading(true);
      setIframeKey(prev => prev + 1);
      toast.success('Refreshing dashboard...');
    } else {
      fetchAnalytics();
      toast.success('Refreshing analytics...');
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
                  <p className="text-sm text-gray-500">PostHog analytics data</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              {POSTHOG_EMBED_URL && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('embed')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      viewMode === 'embed' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setViewMode('api')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      viewMode === 'api' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Insights
                  </button>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading || (viewMode === 'embed' && iframeLoading)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${(isLoading || (viewMode === 'embed' && iframeLoading)) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {POSTHOG_EMBED_URL && (
                <a
                  href={POSTHOG_EMBED_URL.replace('/embedded/', '/shared/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in PostHog
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'embed' && POSTHOG_EMBED_URL ? (
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-180px)] min-h-[600px] relative">
            {iframeLoading && (
              <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Loading PostHog dashboard...</p>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={POSTHOG_EMBED_URL}
              className="w-full h-full border-0"
              title="PostHog Analytics Dashboard"
              onLoad={() => setIframeLoading(false)}
              allow="fullscreen"
            />
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : isConfigured === false ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">PostHog Not Configured</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              To view analytics, configure your PostHog API credentials in the backend.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Setup Instructions:</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Go to PostHog → Settings → Project API Key</li>
                <li>Copy your Project API Key</li>
                <li>Add to backend .env: <code className="bg-gray-200 px-1 rounded">POSTHOG_API_KEY=phx_xxx</code></li>
                <li>Add Project ID: <code className="bg-gray-200 px-1 rounded">POSTHOG_PROJECT_ID=12345</code></li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        ) : analyticsData ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Insights */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Saved Insights</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {formatNumber(analyticsData.total_insights)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Event Types */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Event Types</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {formatNumber(analyticsData.event_count)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Insights with Data */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Insights with Data</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {formatNumber(analyticsData.insights.filter(i => i.latest_value !== undefined).length)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {analyticsData.last_updated 
                        ? new Date(analyticsData.last_updated).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {analyticsData.last_updated 
                        ? new Date(analyticsData.last_updated).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : ''}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <RefreshCw className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Insights */}
            {analyticsData.insights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.insights.map((insight) => (
                    <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate flex-1">{insight.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                          {insight.insight_type}
                        </span>
                      </div>
                      {insight.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{insight.description}</p>
                      )}
                      {insight.latest_value !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-purple-600">
                            {formatNumber(insight.latest_value)}
                          </span>
                          {insight.data_points && (
                            <span className="text-xs text-gray-400">
                              ({insight.data_points} data points)
                            </span>
                          )}
                        </div>
                      )}
                      {insight.trend_data && insight.trend_data.length > 0 && (
                        <div className="mt-3 h-12 flex items-end gap-0.5">
                          {insight.trend_data.map((value, idx) => {
                            const max = Math.max(...insight.trend_data!);
                            const height = max > 0 ? (value / max) * 100 : 0;
                            return (
                              <div
                                key={idx}
                                className="flex-1 bg-purple-200 hover:bg-purple-400 rounded-t transition-colors"
                                style={{ height: `${Math.max(height, 5)}%` }}
                                title={`${value}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Events */}
            {analyticsData.top_events.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events</h3>
                <div className="space-y-3">
                  {analyticsData.top_events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{event.name}</span>
                      </div>
                      {event.volume_30_day !== null && (
                        <span className="text-sm text-gray-500">
                          {formatNumber(event.volume_30_day)} events (30d)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-700">
                <strong>Tip:</strong> Analytics data is fetched securely from PostHog via your backend API. 
                For more detailed insights, access your full PostHog dashboard directly.
              </p>
            </div>
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
