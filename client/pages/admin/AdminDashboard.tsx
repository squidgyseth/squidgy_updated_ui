// Admin Dashboard - Main admin panel with stats and quick actions

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { Users, MessageSquare, Bot, TrendingUp, Settings, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadStats();
    }
  }, [userId, isAdmin, adminLoading, navigate]);

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
              onClick={() => navigate(action.link)}
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
    </div>
  );
}
