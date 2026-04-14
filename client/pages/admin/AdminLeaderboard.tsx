// Admin Leaderboard - Game scores and player tracking




import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { Trophy, Users, UserCheck, TrendingUp, ArrowLeft, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LeaderboardEntry {
  id: string;
  anonymous_id: string;
  score: number;
  duration_seconds: number | null;
  obstacles_dodged: any;
  clusters_completed: number;
  cluster_bonuses: number;
  played_at: string;
  Email: string | null;
  linked_user_id: string | null;
  player_name: string | null;
  player_email: string | null;
  is_registered: boolean;
}

interface KPIs {
  total_games_this_week: number;
  total_signups_this_week: number;
  total_players: number;
  registered_players: number;
  anonymous_players: number;
  conversion_rate: number;
}

export default function AdminLeaderboard() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [kpis, setKPIs] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'registered' | 'anonymous'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 50;

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadLeaderboardData();
    }
  }, [userId, isAdmin, adminLoading, navigate]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);

      // Calculate date ranges
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all leaderboard records with linked user info (excluding admins)
      const { data: scores, error: scoresError } = await supabase
        .from('anonymous_game_scores')
        .select(`
          *,
          profiles:linked_user_id (
            full_name,
            email,
            is_super_admin
          )
        `)
        .order('played_at', { ascending: false });

      if (scoresError) throw scoresError;

      // Filter out admin scores, records without email, and format the data
      const formattedScores: LeaderboardEntry[] = (scores || [])
        .filter((score: any) => !score.profiles?.is_super_admin) // Exclude admins
        .filter((score: any) => score.Email || score.profiles?.email) // Only include records with email
        .map((score: any) => ({
          id: score.id,
          anonymous_id: score.anonymous_id,
          score: score.score,
          duration_seconds: score.duration_seconds,
          obstacles_dodged: score.obstacles_dodged,
          clusters_completed: score.clusters_completed || 0,
          cluster_bonuses: score.cluster_bonuses || 0,
          played_at: score.played_at,
          Email: score.Email,
          linked_user_id: score.linked_user_id,
          player_name: score.profiles?.full_name || null,
          player_email: score.profiles?.email || score.Email || null,
          is_registered: !!score.linked_user_id,
        }));

      setLeaderboard(formattedScores);

      // Calculate KPIs
      const gamesThisWeek = formattedScores.filter(
        (score) => new Date(score.played_at) >= new Date(weekStart)
      ).length;

      // Get signups this week (excluding admins)
      const { data: signups, error: signupsError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', weekStart)
        .eq('is_super_admin', false);

      if (signupsError) throw signupsError;

      const uniquePlayers = new Set(formattedScores.map((s) => s.player_email || s.anonymous_id));
      const registeredPlayers = formattedScores.filter((s) => s.is_registered);
      const uniqueRegistered = new Set(registeredPlayers.map((s) => s.player_email));
      const anonymousPlayers = uniquePlayers.size - uniqueRegistered.size;

      setKPIs({
        total_games_this_week: gamesThisWeek,
        total_signups_this_week: signups?.length || 0,
        total_players: uniquePlayers.size,
        registered_players: uniqueRegistered.size,
        anonymous_players: anonymousPlayers,
        conversion_rate:
          uniquePlayers.size > 0
            ? Math.round((uniqueRegistered.size / uniquePlayers.size) * 100)
            : 0,
      });
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (filter === 'registered') return entry.is_registered;
    if (filter === 'anonymous') return !entry.is_registered;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeaderboard.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const weeklyKPIs = [
    {
      title: 'Games This Week',
      value: kpis?.total_games_this_week || 0,
      icon: Trophy,
      color: 'bg-purple-500',
    },
    {
      title: 'Signups This Week',
      value: kpis?.total_signups_this_week || 0,
      icon: UserCheck,
      color: 'bg-green-500',
    },
  ];

  const overallKPIs = [
    {
      title: 'Total Players',
      value: kpis?.total_players || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Registered',
      value: kpis?.registered_players || 0,
      icon: UserCheck,
      color: 'bg-indigo-500',
    },
    {
      title: 'Anonymous',
      value: kpis?.anonymous_players || 0,
      icon: Users,
      color: 'bg-gray-500',
    },
    {
      title: 'Conversion Rate',
      value: `${kpis?.conversion_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Game Leaderboard</h1>
                <p className="text-sm text-gray-500">Track game plays and player conversions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Weekly KPIs */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyKPIs.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Overall KPIs */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Overall Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overallKPIs.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Players
            </button>
            <button
              onClick={() => setFilter('registered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'registered'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Registered Only
            </button>
            <button
              onClick={() => setFilter('anonymous')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'anonymous'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Anonymous Only
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clusters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Played At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No game scores found
                    </td>
                  </tr>
                ) : (
                  paginatedLeaderboard.map((entry, index) => {
                    const globalRank = startIndex + index + 1;
                    return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {globalRank <= 3 ? (
                            <div className="flex items-center gap-2">
                              <Trophy
                                className={`w-5 h-5 ${
                                  globalRank === 1
                                    ? 'text-yellow-500'
                                    : globalRank === 2
                                    ? 'text-gray-400'
                                    : 'text-orange-400'
                                }`}
                              />
                              <span className="text-sm font-bold text-gray-900">{globalRank}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">{globalRank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {entry.player_email}
                          </div>
                          <div className="text-xs">
                            {entry.is_registered ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Registered
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Anonymous
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-purple-600">
                          {entry.score.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {entry.clusters_completed}
                          {entry.cluster_bonuses > 0 && (
                            <span className="text-xs text-green-600 ml-1">
                              (+{entry.cluster_bonuses} bonus)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {entry.duration_seconds
                            ? `${Math.floor(entry.duration_seconds / 60)}m ${
                                entry.duration_seconds % 60
                              }s`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.played_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredLeaderboard.length > RECORDS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredLeaderboard.length)}</span> of{' '}
                <span className="font-medium">{filteredLeaderboard.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
