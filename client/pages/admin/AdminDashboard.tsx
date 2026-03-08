// Admin Dashboard - Main admin panel with stats and quick actions

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { Users, MessageSquare, Bot, TrendingUp, Settings, Activity, Shield, BarChart3, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import ReferralService from '../../services/referralService';

interface PlatformStats {
  total_users: number;
  active_users_24h: number;
  active_users_7d: number;
  new_users_today: number;
  total_agents: number;
  total_chat_messages: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userId, user } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{ code: string; link: string } | null>(null);
  const [creatingCode, setCreatingCode] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadStats();
    }
  }, [userId, isAdmin, adminLoading, navigate]);

  const handleCreateReferralCode = async () => {
    if (!userId) return;

    try {
      setCreatingCode(true);
      const referralService = ReferralService.getInstance();
      const result = await referralService.getUserReferralCode(userId);
      setGeneratedCode(result);
      setShowReferralModal(true);
      toast.success('Referral code generated successfully!');
    } catch (error: any) {
      console.error('Error creating referral code:', error);
      toast.error('Failed to create referral code');
    } finally {
      setCreatingCode(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Fetch stats directly from Supabase
      const [
        totalUsersRes,
        newTodayRes,
        totalAgentsRes,
        totalMessagesRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('agents').select('id', { count: 'exact', head: true }),
        supabase.from('chat_history').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        total_users: totalUsersRes.count || 0,
        active_users_24h: 0, // Would need last_active column
        active_users_7d: 0,  // Would need last_active column
        new_users_today: newTodayRes.count || 0,
        total_agents: totalAgentsRes.count || 0,
        total_chat_messages: totalMessagesRes.count || 0,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Active (24h)',
      value: stats?.active_users_24h || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'New Today',
      value: stats?.new_users_today || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Agents',
      value: stats?.total_agents || 0,
      icon: Bot,
      color: 'bg-orange-500',
    },
    {
      title: 'Chat Messages',
      value: stats?.total_chat_messages || 0,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
    {
      title: 'Active (7d)',
      value: stats?.active_users_7d || 0,
      icon: Activity,
      color: 'bg-indigo-500',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View, edit, and manage user accounts',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Create Referral Code',
      description: 'Generate a referral code to share',
      icon: Ticket,
      action: handleCreateReferralCode,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'User Analytics',
      description: 'View PostHog analytics dashboard',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Platform Settings',
      description: 'Configure platform-wide settings',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Activity Log',
      description: 'View admin activity history',
      icon: Activity,
      link: '/admin/activity',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Platform administration and management</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
                stat.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => action.link ? navigate(action.link) : action.action?.()}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Code Modal */}
      {showReferralModal && generatedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Code Created!</h2>
              <p className="text-gray-500">Share this code with new users</p>
            </div>

            <div className="space-y-4">
              {/* Referral Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedCode.code}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-center text-lg font-mono font-bold text-purple-600"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCode.code, 'Code')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedCode.link}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCode.link, 'Link')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 This code can only be used once. After a user registers with this code, it will be deactivated.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowReferralModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
