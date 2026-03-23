// Admin Users - User management page

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { 
  Users, Search, ChevronLeft, ChevronRight, Shield, ShieldOff, 
  Trash2, Edit2, X, Check, ArrowLeft, Filter, ArrowUpDown, Building2, Bot, Copy,
  MessageSquare, Clock, User as UserIcon, History, Hash, Mail, KeyRound, Send, BarChart3, LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import DatabaseAgentService, { type AgentConfig } from '../../services/databaseAgentService';
import { chatSessionService, ChatSession as ChatSessionType, ChatMessage as ChatMessageType } from '../../services/chatSessionService';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_super_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  phone_number?: string;
  profile_avatar_url?: string;
  [key: string]: any;
}

interface BusinessSettings {
  id?: string;
  user_id?: string;
  company_name?: string;
  industry?: string;
  team_size?: string;
  business_email?: string;
  phone_number?: string;
  emergency_number?: string;
  country?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  company_logo?: string;
  [key: string]: any;
}

type SortField = 'created_at' | 'full_name' | 'email';
type SortOrder = 'asc' | 'desc';
type FilterRole = '' | 'member' | 'Admin' | 'Sales Rep' | 'Viewer' | 'Manager';
type FilterStatus = '' | 'active' | 'deleted' | 'admin';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { userId, impersonateUser } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [chatHistoryUser, setChatHistoryUser] = useState<UserProfile | null>(null);
  const [activityUser, setActivityUser] = useState<UserProfile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Filtering & Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRole, setFilterRole] = useState<FilterRole>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Auth email verification status (from Supabase auth table)
  const [authEmailStatus, setAuthEmailStatus] = useState<Record<string, boolean>>({});

  const loadUsers = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Build query - select all columns
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      // Add search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      
      // Add role filter
      if (filterRole) {
        query = query.eq('role', filterRole);
      }
      
      // Add status filter
      if (filterStatus === 'admin') {
        query = query.eq('is_super_admin', true);
      }
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setUsers(data || []);
      setTotal(count || 0);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [userId, page, pageSize, search, sortField, sortOrder, filterRole, filterStatus]);

  // Load auth email verification status from Supabase auth table
  const loadAuthEmailStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_email_verified');
      if (error) {
        console.error('Error loading auth email status:', error);
        return;
      }
      if (data && data.length > 0) {
        const statusMap: Record<string, boolean> = {};
        data.forEach((row: { user_id: string; auth_email_confirmed: boolean }) => {
          statusMap[row.user_id] = row.auth_email_confirmed;
        });
        setAuthEmailStatus(statusMap);
      }
    } catch (error) {
      console.error('Error loading auth email status:', error);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadUsers();
      loadAuthEmailStatus();
    }
  }, [userId, isAdmin, adminLoading, navigate, loadUsers, loadAuthEmailStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const logAdminAction = async (actionType: string, targetUserId?: string, details?: Record<string, any>) => {
    try {
      await supabase.from('admin_activity_log').insert({
        admin_user_id: userId,
        action_type: actionType,
        target_user_id: targetUserId,
        target_resource_type: 'user',
        target_resource_id: targetUserId,
        action_details: details || {},
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    try {
      const newAdminStatus = !user.is_super_admin;
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: newAdminStatus })
        .eq('user_id', user.user_id || user.id);
      
      if (error) throw error;
      
      await logAdminAction('user_updated', user.user_id || user.id, { 
        field: 'is_super_admin', 
        old_value: user.is_super_admin, 
        new_value: newAdminStatus 
      });
      
      toast.success(`${user.full_name || user.email} ${user.is_super_admin ? 'removed from' : 'added to'} admins`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    try {
      // Hard delete - call backend API to remove user from all tables
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://squidgy-backend.onrender.com';
      const response = await fetch(`${backendUrl}/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: targetUserId,
          admin_user_id: userId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to delete user');
      }
      
      await logAdminAction('user_hard_deleted', targetUserId);
      
      toast.success('User permanently deleted');
      setDeleteConfirm(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleUpdateUser = async (user: UserProfile, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.user_id || user.id);
      
      if (error) throw error;
      
      await logAdminAction('user_updated', user.user_id || user.id, { updates });
      
      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleImpersonateUser = async (user: UserProfile) => {
    try {
      const targetUserId = user.user_id || user.id;
      toast.loading('Logging in as user...');
      await impersonateUser(targetUserId);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to impersonate user');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                  <p className="text-sm text-gray-500">{total} total users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search, Filter & Sort Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[250px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </form>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || filterRole || filterStatus 
                  ? 'bg-purple-50 border-purple-300 text-purple-700' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filterRole || filterStatus) && (
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              )}
            </button>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                  setSortField(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="full_name-asc">Name A-Z</option>
                <option value="full_name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
              </select>
            </div>
          </div>
          
          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Role:</label>
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value as FilterRole);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Roles</option>
                  <option value="member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Sales Rep">Sales Rep</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as FilterStatus);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="deleted">Deleted</option>
                  <option value="admin">Super Admins</option>
                </select>
              </div>
              
              {(filterRole || filterStatus) && (
                <button
                  onClick={() => {
                    setFilterRole('');
                    setFilterStatus('');
                    setPage(1);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Verified
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.is_super_admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          <span className="text-sm text-gray-600">{user.role || 'member'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const authStatus = authEmailStatus[user.id] ?? authEmailStatus[user.user_id];
                          return authStatus === true ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          ) : authStatus === false ? (
                            <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                              -
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonateUser(user)}
                            className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Login as user"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_super_admin
                                ? 'hover:bg-red-100 text-red-600'
                                : 'hover:bg-purple-100 text-purple-600'
                            }`}
                            title={user.is_super_admin ? 'Remove admin' : 'Make admin'}
                          >
                            {user.is_super_admin ? (
                              <ShieldOff className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setChatHistoryUser(user)}
                            className="p-2 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                            title="View chat history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActivityUser(user)}
                            className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                            title="View PostHog activity"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteUser(user.user_id || user.id)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                title="Confirm delete"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat History Modal */}
      {chatHistoryUser && (
        <ChatHistoryModal
          user={chatHistoryUser}
          onClose={() => setChatHistoryUser(null)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updates) => handleUpdateUser(editingUser, updates)}
        />
      )}

      {/* PostHog Activity Modal */}
      {activityUser && (
        <PostHogActivityModal
          user={activityUser}
          onClose={() => setActivityUser(null)}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
interface EditUserModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}

interface AdminChatSession {
  session_id: string;
  message_count: number;
  agents: string[];
  first_message: string;
  last_message: string;
  preview: string;
}

interface AdminChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  sender: string;
  message: string;
  timestamp: string;
  agent_name?: string;
  agent_id?: string;
  execution_id?: string | number;
  workflow_id?: string;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'ghl' | 'assistant'>('profile');
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingGhl, setLoadingGhl] = useState(false);
  const [loadingAssistant, setLoadingAssistant] = useState(false);

  const handleTabChange = (tab: 'profile' | 'business' | 'ghl' | 'assistant') => {
    if (tab === activeTab) return;
    setIsTabTransitioning(true);
    // Small delay before switching tab to ensure spinner is visible
    setTimeout(() => {
      setActiveTab(tab);
      // Keep spinner visible while data loads
      setTimeout(() => setIsTabTransitioning(false), 400);
    }, 100);
  };
  
  // Editable profile fields - initialize with all user fields
  const [profileData, setProfileData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {};
    Object.entries(user).forEach(([key, value]) => {
      if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
        data[key] = value ?? '';
      }
    });
    return data;
  });
  
  // Business settings - editable
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [businessData, setBusinessData] = useState<Record<string, any>>({});
  const [savingBusiness, setSavingBusiness] = useState(false);
  
  // GHL Subaccounts - editable (first subaccount only for simplicity)
  const [ghlSubaccounts, setGhlSubaccounts] = useState<Record<string, any>[] | null>(null);
  const [ghlData, setGhlData] = useState<Record<string, any>>({});
  const [savingGhl, setSavingGhl] = useState(false);
  
  // Assistant Personalizations - now stores array of all user's personalizations
  const [assistantPersonalizations, setAssistantPersonalizations] = useState<Record<string, any>[] | null>(null);
  
  // All available agents in the system
  const [allAgents, setAllAgents] = useState<Record<string, any>[] | null>(null);

  // Fields that should not be editable (shown as disabled inputs)
  const readOnlyFields = ['email', 'company_id', 'ghl_record_id'];
  
  // Fields to hide from the form entirely (managed elsewhere)
  const hiddenFields = ['is_super_admin'];
  
  // Fields that are boolean (shown as checkboxes)
  const booleanFields = [
    'terms_accepted', 'terms_read', 'onboarding_completed',
    'ai_processing_consent', 'marketing_consent', 'terms_viewed', 'terms_scrolled_to_bottom',
    'privacy_scrolled_to_bottom', 'privacy_viewed', 'notifications_enabled'
  ];
  
  // Timestamp fields (shown as read-only info, not editable)
  const timestampFields = [
    'terms_accepted_at', 'terms_read_at', 'last_login_at', 
    'onboarding_completed_at', 'consent_timestamp', 'terms_viewed_timestamp', 
    'privacy_viewed_timestamp'
  ];
  
  // Fields with predefined options (shown as dropdowns)
  const optionFields: Record<string, string[]> = {
    role: ['member', 'Admin', 'Sales Rep', 'Viewer', 'Manager'],
    team_size: ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'],
    industry: ['Renewable Energy', 'Solar Energy', 'Wind Energy', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Other'],
  };
  
  // Boolean fields that have associated timestamp fields (auto-update when toggled)
  const booleanTimestampPairs: Record<string, string> = {
    terms_accepted: 'terms_accepted_at',
    terms_read: 'terms_read_at',
    onboarding_completed: 'onboarding_completed_at',
    ai_processing_consent: 'consent_timestamp',
    marketing_consent: 'consent_timestamp',
    terms_viewed: 'terms_viewed_timestamp',
    privacy_viewed: 'privacy_viewed_timestamp',
  };

  useEffect(() => {
    if (activeTab === 'business' && !businessSettings) {
      loadBusinessSettings();
    }
    if (activeTab === 'ghl' && !ghlSubaccounts) {
      loadGhlSubaccounts();
    }
    if (activeTab === 'assistant' && !assistantPersonalizations) {
      loadAssistantPersonalizations();
    }
  }, [activeTab]);

  // Auto-refresh GHL status when automation is running
  useEffect(() => {
    if (activeTab !== 'ghl' || !ghlSubaccounts || ghlSubaccounts.length === 0) return;
    
    const ghl = ghlSubaccounts[0];
    const automationStatus = ghl?.automation_status;
    
    // Poll every 5 seconds if automation is running
    if (automationStatus === 'running' || automationStatus === 'pit_running' || automationStatus === 'creating') {
      const interval = setInterval(() => {
        loadGhlSubaccounts();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, ghlSubaccounts]);

  const loadBusinessSettings = async () => {
    try {
      setLoadingBusiness(true);
      const userId = user.user_id || user.id;
      
      let { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If no record exists (PGRST116 = no rows), silently create one
      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('business_settings')
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (!insertError && newData) {
          data = newData;
          error = null;
        }
      }
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading business settings:', error);
      }
      setBusinessSettings(data || {});
      // Initialize editable business data
      if (data) {
        const editableData: Record<string, any> = {};
        Object.entries(data).forEach(([key, value]) => {
          if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
            editableData[key] = value ?? '';
          }
        });
        setBusinessData(editableData);
      }
    } catch (err) {
      console.error('Error loading business settings:', err);
      setBusinessSettings({});
    } finally {
      setLoadingBusiness(false);
    }
  };

  const loadGhlSubaccounts = async () => {
    try {
      setLoadingGhl(true);
      const { data, error } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('firm_user_id', user.user_id || user.id);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading GHL subaccounts:', error);
      }
      setGhlSubaccounts(data || []);
      // Initialize editable GHL data (first subaccount)
      if (data && data.length > 0) {
        const editableData: Record<string, any> = {};
        Object.entries(data[0]).forEach(([key, value]) => {
          const hiddenGhlFields = [
              'id', 'firm_user_id', 'created_at', 'updated_at',
              'agent_id', 'business_phone', 'business_city', 'business_country',
              'business_state', 'business_address', 'business_timezone',
              'business_postal_code', 'business_website', 'soma_ghl_email', 'soma_ghl_password',
              'soma_ghl_user_id', 'firm_id'
            ];
            if (!hiddenGhlFields.includes(key)) {
              editableData[key] = value ?? '';
            }
        });
        setGhlData(editableData);
      }
    } catch (err) {
      console.error('Error loading GHL subaccounts:', err);
      setGhlSubaccounts([]);
    } finally {
      setLoadingGhl(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSavingBusiness(true);
      const userId = user.user_id || user.id;
      
      // Convert empty strings to null to satisfy database check constraints
      const cleanedData: Record<string, any> = {};
      Object.entries(businessData).forEach(([key, value]) => {
        cleanedData[key] = value === '' ? null : value;
      });
      
      const { error } = await supabase
        .from('business_settings')
        .update({
          ...cleanedData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast.success('Business settings saved');
      setBusinessSettings(prev => ({ ...prev, ...businessData }));
    } catch (err: any) {
      console.error('Error saving business settings:', err);
      toast.error(err.message || 'Failed to save business settings');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveGhl = async () => {
    try {
      setSavingGhl(true);
      const userId = user.user_id || user.id;
      
      if (!ghlSubaccounts || ghlSubaccounts.length === 0) {
        toast.error('No GHL subaccount to update');
        return;
      }
      
      const { error } = await supabase
        .from('ghl_subaccounts')
        .update({
          ...ghlData,
          updated_at: new Date().toISOString()
        })
        .eq('id', ghlSubaccounts[0].id);
      
      if (error) throw error;
      
      toast.success('GHL settings saved');
      setGhlSubaccounts(prev => prev ? [{ ...prev[0], ...ghlData }, ...prev.slice(1)] : null);
    } catch (err: any) {
      console.error('Error saving GHL settings:', err);
      toast.error(err.message || 'Failed to save GHL settings');
    } finally {
      setSavingGhl(false);
    }
  };

  const loadAssistantPersonalizations = async () => {
    try {
      setLoadingAssistant(true);
      
      // Load agent definitions from database
      const agentService = DatabaseAgentService.getInstance();
      const agentConfigs = await agentService.getAllAgents();
      
      const frontendAgents = agentConfigs.map(config => ({
        id: config.agent.id,
        name: config.agent.name,
        description: config.agent.description,
        emoji: config.agent.emoji,
        category: config.agent.category,
        enabled: config.agent.enabled
      }));
      
      // Load user's personalizations from Supabase
      const { data: personalizationsData, error: personalizationsError } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', user.user_id || user.id);
      
      if (personalizationsError && personalizationsError.code !== 'PGRST116') {
        console.error('Error loading assistant personalizations:', personalizationsError);
      }
      
      setAllAgents(frontendAgents);
      setAssistantPersonalizations(personalizationsData || []);
    } catch (err) {
      console.error('Error loading assistant data:', err);
      setAllAgents([]);
      setAssistantPersonalizations([]);
    } finally {
      setLoadingAssistant(false);
    }
  };

  const handleToggleAgent = async (agentId: string, agentName: string, currentlyEnabled: boolean) => {
    try {
      const userId = user.user_id || user.id;
      
      if (currentlyEnabled) {
        // Disable - set is_enabled to false (don't delete, to preserve personalization data)
        const { error } = await supabase
          .from('assistant_personalizations')
          .update({ 
            is_enabled: false,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('assistant_id', agentId);
        
        if (error) throw error;
        
        // Update local state
        setAssistantPersonalizations(prev => 
          (prev || []).map(p => 
            p.assistant_id === agentId ? { ...p, is_enabled: false } : p
          )
        );
        toast.success(`${agentName} disabled for this user`);
      } else {
        // Check if record exists
        const { data: existing } = await supabase
          .from('assistant_personalizations')
          .select('*')
          .eq('user_id', userId)
          .eq('assistant_id', agentId)
          .single();
        
        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('assistant_personalizations')
            .update({ 
              is_enabled: true,
              last_updated: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('assistant_id', agentId);
          
          if (error) throw error;
          
          setAssistantPersonalizations(prev => 
            (prev || []).map(p => 
              p.assistant_id === agentId ? { ...p, is_enabled: true } : p
            )
          );
        } else {
          // Create new personalization record
          const { data, error } = await supabase
            .from('assistant_personalizations')
            .insert({
              user_id: userId,
              assistant_id: agentId,
              is_enabled: true,
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) throw error;
          
          setAssistantPersonalizations(prev => [...(prev || []), data]);
        }
        toast.success(`${agentName} enabled for this user`);
      }
      
      // Notify backend to refresh user view
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        await fetch(`${backendUrl}/api/agents/notify-enablement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            agent_id: agentId,
            enabled: !currentlyEnabled
          })
        });
      } catch (notifyErr) {
        console.error('Failed to notify backend:', notifyErr);
        // Don't show error to user - the main action succeeded
      }
    } catch (err: any) {
      console.error('Error toggling agent:', err);
      toast.error(err.message || 'Failed to update agent');
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setProfileData(prev => {
      const newData = { ...prev, [key]: value };
      
      // Auto-update timestamp when boolean field is toggled
      if (booleanTimestampPairs[key]) {
        const timestampField = booleanTimestampPairs[key];
        if (value === true) {
          // Set timestamp to now when enabled
          newData[timestampField] = new Date().toISOString();
        }
        // Note: We don't clear timestamp when disabled - that's intentional
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Only send changed fields
    const updates: Record<string, any> = {};
    Object.entries(profileData).forEach(([key, value]) => {
      if (!readOnlyFields.includes(key)) {
        // Convert empty strings to null for optional fields
        updates[key] = value === '' ? null : value;
      }
    });
    
    await onSave(updates);
    setSaving(false);
  };

  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Get all profile fields for display
  const profileFields = Object.entries(profileData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.full_name || 'No name'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-3 h-3 inline mr-1" />
            Profile
          </button>
          <button
            onClick={() => handleTabChange('business')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'business'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-3 h-3 inline mr-1" />
            Business
          </button>
          <button
            onClick={() => handleTabChange('ghl')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'ghl'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-3 h-3 inline mr-1" />
            GHL
          </button>
          <button
            onClick={() => handleTabChange('assistant')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'assistant'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bot className="w-3 h-3 inline mr-1" />
            Assistant
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
          {isTabTransitioning ? (
            <div className="flex justify-center items-center h-full min-h-[350px]">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
                {(user.user_id || user.id) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">User ID: {user.user_id || user.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.user_id || user.id || '');
                        toast.success('User ID copied');
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy User ID"
                    >
                      <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Regular Editable Fields (non-boolean) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileFields
                  .filter(([key]) => !timestampFields.includes(key) && !hiddenFields.includes(key) && !booleanFields.includes(key))
                  .map(([key, value]) => {
                    const isReadOnly = readOnlyFields.includes(key);
                    const hasOptions = optionFields[key];
                    
                    return (
                      <div key={key}>
                        {hasOptions ? (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{formatFieldName(key)}</label>
                            <select
                              value={String(profileData[key] || '')}
                              onChange={(e) => handleFieldChange(key, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="">Select {formatFieldName(key)}</option>
                              {hasOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{formatFieldName(key)}</label>
                            <input
                              type="text"
                              value={String(profileData[key] ?? '')}
                              onChange={(e) => handleFieldChange(key, e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {/* Consent & Compliance Section - Compact Grid */}
              {profileFields.some(([key]) => booleanFields.includes(key)) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Consent & Compliance</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {profileFields
                        .filter(([key]) => booleanFields.includes(key))
                        .map(([key]) => {
                          const isEditable = key === 'notifications_enabled';
                          return (
                            <label key={key} className={`flex items-center gap-2 text-sm ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                              <input
                                type="checkbox"
                                checked={Boolean(profileData[key])}
                                onChange={isEditable ? (e) => handleFieldChange(key, e.target.checked) : undefined}
                                disabled={!isEditable}
                                className={`w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${isEditable ? '' : 'cursor-not-allowed opacity-60'}`}
                              />
                              <span className={isEditable ? 'text-gray-700' : 'text-gray-500'}>{formatFieldName(key)}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Email Actions Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/reset-password`
                        });
                        if (error) throw error;
                        toast.success(`Password reset email sent to ${user.email}`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to send password reset email');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Send Password Reset
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.signInWithOtp({
                          email: user.email,
                          options: {
                            shouldCreateUser: false
                          }
                        });
                        if (error) throw error;
                        toast.success(`Magic link sent to ${user.email}`);
                      } catch (error: any) {
                        console.error('Magic link error:', error);
                        toast.error(error.message || 'Failed to send magic link');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Magic Link
                  </button>
                </div>
              </div>

              {/* Timestamp Info Section (Read-only) - Compact */}
              {profileFields.some(([key]) => timestampFields.includes(key)) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Activity Timestamps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {profileFields
                      .filter(([key]) => timestampFields.includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1.5 px-3 bg-gray-50 rounded">
                          <span className="text-gray-500">{formatFieldName(key)}</span>
                          <span className="font-medium text-gray-600">
                            {value ? new Date(value).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : activeTab === 'business' ? (
            <div>
              {loadingBusiness ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : businessSettings && Object.keys(businessSettings).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Business Information</h3>
                    {businessSettings.id && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Business ID: {businessSettings.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(businessSettings.id || '');
                            toast.success('Business ID copied');
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy Business ID"
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(businessData).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">{formatFieldName(key)}</label>
                        <input
                          type="text"
                          value={typeof value === 'object' ? JSON.stringify(value) : (value ?? '')}
                          onChange={(e) => setBusinessData(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleSaveBusiness}
                      disabled={savingBusiness}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {savingBusiness ? 'Saving...' : 'Save Business Settings'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No business settings found for this user</p>
                </div>
              )}
            </div>
          ) : activeTab === 'ghl' ? (
            <div>
              {loadingGhl ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : ghlSubaccounts && ghlSubaccounts.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const ghl = ghlSubaccounts[0];
                    const creationStatus = ghl.creation_status || 'unknown';
                    const automationStatus = ghl.automation_status || 'unknown';
                    
                    const getStatusColor = (status: string) => {
                      if (status === 'created' || status === 'completed' || status === 'ready') return 'bg-green-100 text-green-800';
                      if (status === 'failed' || status === 'pit_failed' || status === 'token_capture_failed') return 'bg-red-100 text-red-800';
                      if (status === 'pending' || status === 'not_started') return 'bg-gray-100 text-gray-800';
                      if (status === 'creating' || status === 'running' || status === 'pit_running') return 'bg-blue-100 text-blue-800';
                      return 'bg-yellow-100 text-yellow-800';
                    };
                    
                    const getStatusIcon = (status: string) => {
                      if (status === 'created' || status === 'completed' || status === 'ready') return '✅';
                      if (status === 'failed' || status === 'pit_failed' || status === 'token_capture_failed') return '❌';
                      if (status === 'pending' || status === 'not_started') return '⏳';
                      if (status === 'creating' || status === 'running' || status === 'pit_running') return '🔄';
                      return '⚠️';
                    };
                    
                    return (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">GHL Subaccount Status</h3>
                        
                        {/* Status Overview */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Creation Status</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(creationStatus)}`}>
                              {getStatusIcon(creationStatus)} {creationStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Automation Status</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(automationStatus)}`}>
                              {getStatusIcon(automationStatus)} {automationStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Steps */}
                        <div className="border rounded-lg p-4 mb-4">
                          <p className="text-xs font-medium text-gray-700 mb-3">Setup Progress</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={creationStatus !== 'pending' ? 'text-green-500' : 'text-gray-300'}>
                                {creationStatus !== 'pending' ? '✓' : '○'}
                              </span>
                              <span className="text-sm text-gray-600">GHL Subaccount Created</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={ghl.ghl_location_id ? 'text-green-500' : 'text-gray-300'}>
                                {ghl.ghl_location_id ? '✓' : '○'}
                              </span>
                              <span className="text-sm text-gray-600">Location ID Assigned</span>
                              {ghl.ghl_location_id && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-xs text-gray-400">{ghl.ghl_location_id}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(ghl.ghl_location_id);
                                      toast.success('Location ID copied!');
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Copy Location ID"
                                  >
                                    <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={ghl.firebase_token ? 'text-green-500' : 'text-gray-300'}>
                                {ghl.firebase_token ? '✓' : '○'}
                              </span>
                              <span className="text-sm text-gray-600">Firebase Token Captured</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={ghl.pit_token ? 'text-green-500' : 'text-gray-300'}>
                                {ghl.pit_token ? '✓' : '○'}
                              </span>
                              <span className="text-sm text-gray-600">PIT Token Captured</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={automationStatus === 'completed' || automationStatus === 'ready' ? 'text-green-500' : 'text-gray-300'}>
                                {automationStatus === 'completed' || automationStatus === 'ready' ? '✓' : '○'}
                              </span>
                              <span className="text-sm text-gray-600">Automation Complete</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Error Display - only show if status indicates failure */}
                        {(ghl.creation_error || ghl.automation_error) && 
                         (creationStatus === 'failed' || automationStatus === 'failed' || automationStatus === 'pit_failed' || automationStatus === 'token_capture_failed') && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-xs font-medium text-red-800 mb-1">Error Details</p>
                            <p className="text-sm text-red-700">{ghl.creation_error || ghl.automation_error}</p>
                          </div>
                        )}
                        
                        {/* Key Info */}
                        <div className="border rounded-lg p-4">
                          <p className="text-xs font-medium text-gray-700 mb-3">Account Details</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Subaccount Name</div>
                            <div className="text-gray-900 font-medium">{ghl.subaccount_name || '-'}</div>
                            <div className="text-gray-500">Location ID</div>
                            <div className="text-gray-900 font-medium truncate">{ghl.ghl_location_id || '-'}</div>
                            <div className="text-gray-500">Company ID</div>
                            <div className="text-gray-900 font-medium truncate">{ghl.ghl_company_id || '-'}</div>
                            <div className="text-gray-500">Created At</div>
                            <div className="text-gray-900 font-medium">
                              {ghl.subaccount_created_at ? new Date(ghl.subaccount_created_at).toLocaleDateString() : '-'}
                            </div>
                          </div>
                          
                          {/* Open Dashboard Button */}
                          {ghl.ghl_location_id && (
                            <div className="flex justify-center mt-4 pt-4 border-t border-gray-200">
                              <a
                                href={`https://app.gohighlevel.com/v2/location/${ghl.ghl_location_id}/dashboard`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Open Dashboard
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {/* Retry Button for Failed Status or Missing PIT Token */}
                        {(creationStatus === 'failed' || automationStatus === 'failed' || automationStatus === 'pit_failed' || automationStatus === 'token_capture_failed' || !ghl.pit_token) && (
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setSavingGhl(true);
                                  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
                                  const response = await fetch(`${backendUrl}/api/ghl/retry-automation`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ firm_user_id: user.user_id || user.id })
                                  });
                                  if (response.ok) {
                                    toast.success('Automation retry triggered');
                                    loadGhlSubaccounts();
                                  } else {
                                    toast.error('Failed to retry automation');
                                  }
                                } catch (err) {
                                  toast.error('Failed to retry automation');
                                } finally {
                                  setSavingGhl(false);
                                }
                              }}
                              disabled={savingGhl}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                              {savingGhl ? 'Retrying...' : 'Retry Automation'}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No GHL subaccounts found for this user</p>
                </div>
              )}
            </div>
          ) : activeTab === 'assistant' ? (
            <div>
              {loadingAssistant ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : allAgents && allAgents.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Available Agents ({allAgents.length})
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Toggle agents to enable or disable them for this user
                  </p>
                  <div className="space-y-2">
                    {allAgents.map((agent) => {
                      const agentId = agent.id;
                      const agentName = agent.name || '';
                      // Only personal_assistant is always enabled - not other agents with enabled:true
                      const isPersonalAssistant = agentId === 'personal_assistant';
                      // Match by agent ID (source of truth from agents.ts)
                      const userPersonalization = (assistantPersonalizations || []).find(
                        p => p.assistant_id === agentId
                      );
                      // Check is_enabled field - must be explicitly true (matching sidebar logic)
                      const isEnabled = isPersonalAssistant || (userPersonalization?.is_enabled === true);
                      
                      return (
                        <div 
                          key={agentId} 
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            isEnabled 
                              ? 'bg-purple-50 border-purple-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isEnabled ? 'bg-purple-100' : 'bg-gray-200'
                            }`}>
                              <Bot className={`w-5 h-5 ${isEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {agent.emoji && <span className="mr-1">{agent.emoji}</span>}
                                {agentName || formatFieldName(agentId)}
                                {isPersonalAssistant && (
                                  <span className="ml-2 text-xs text-purple-600 font-normal">(Default)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">{agent.category}</p>
                              {agent.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {agent.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {isPersonalAssistant ? (
                            <span className="text-xs text-gray-400 italic">Always enabled</span>
                          ) : (
                            <button
                              onClick={() => handleToggleAgent(
                                agentId, 
                                agentName || agentId,
                                isEnabled
                              )}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isEnabled ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show personalization details for enabled agents */}
                  {(assistantPersonalizations || []).length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Enabled Agent Details</h4>
                      {(assistantPersonalizations || []).map((personalization, index) => (
                        <div key={personalization.id || index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-purple-600 mb-2">
                            {personalization.assistant_id}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(personalization)
                              .filter(([key]) => !['id', 'user_id', 'assistant_id', 'created_at', 'updated_at'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500">{formatFieldName(key)}</span>
                                  <span className="font-medium text-gray-700">{formatFieldValue(value)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No agents available in the system</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Chat History Modal Component
interface ChatHistoryModalProps {
  user: UserProfile;
  onClose: () => void;
}

function ChatHistoryModal({ user, onClose }: ChatHistoryModalProps) {
  const [chatSessions, setChatSessions] = useState<AdminChatSession[] | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<AdminChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadChatSessions = async () => {
    try {
      setLoadingChat(true);
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('session_id, agent_id, agent_name, timestamp, message, sender, execution_id, workflow_id')
        .eq('user_id', user.user_id)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error loading chat sessions:', error);
        setChatSessions([]);
        return;
      }
      
      if (!data || data.length === 0) {
        setChatSessions([]);
        return;
      }
      
      const sessionMap = new Map<string, {
        session_id: string;
        message_count: number;
        agents: Set<string>;
        first_message: string;
        last_message: string;
        preview: string;
        has_user_message: boolean;
      }>();
      
      data.forEach(row => {
        const existing = sessionMap.get(row.session_id);
        
        if (!existing) {
          sessionMap.set(row.session_id, {
            session_id: row.session_id,
            message_count: 1,
            agents: new Set(row.sender !== 'User' ? [row.agent_name || row.sender] : []),
            first_message: row.timestamp,
            last_message: row.timestamp,
            preview: row.sender === 'User' ? row.message?.substring(0, 100) || '' : '',
            has_user_message: row.sender === 'User'
          });
        } else {
          existing.message_count++;
          if (row.sender !== 'User' && (row.agent_name || row.sender)) {
            existing.agents.add(row.agent_name || row.sender);
          }
          if (row.sender === 'User') {
            existing.has_user_message = true;
            if (!existing.preview) {
              existing.preview = row.message?.substring(0, 100) || '';
            }
          }
          if (row.timestamp < existing.first_message) {
            existing.first_message = row.timestamp;
          }
          if (row.timestamp > existing.last_message) {
            existing.last_message = row.timestamp;
          }
        }
      });
      
      const sessions = Array.from(sessionMap.values())
        .filter(s => s.has_user_message)
        .map(s => ({
          session_id: s.session_id,
          message_count: s.message_count,
          agents: Array.from(s.agents),
          first_message: s.first_message,
          last_message: s.last_message,
          preview: s.preview
        }))
        .sort((a, b) => new Date(b.last_message).getTime() - new Date(a.last_message).getTime());
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setChatSessions([]);
    } finally {
      setLoadingChat(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      setSelectedSession(sessionId);
      
      const messages = await chatSessionService.getSessionMessages(sessionId);
      
      const mappedMessages: AdminChatMessage[] = messages.map(msg => ({
        id: msg.id,
        session_id: msg.session_id,
        user_id: user.user_id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        agent_name: msg.agent_name,
        agent_id: msg.agent_id,
        execution_id: (msg as any).execution_id,
        workflow_id: (msg as any).workflow_id
      }));
      
      setSessionMessages(mappedMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      setSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, [user.user_id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
              <p className="text-sm text-gray-500">{user.full_name || user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
          {loadingChat ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setSessionMessages([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Session Messages</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedSession}</p>
                </div>
              </div>
              
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sessionMessages.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sessionMessages.map((msg, index) => (
                    <div key={msg.id || index} className="relative">
                      <ChatMessageBubble
                        message={msg.message}
                        sender={msg.sender === 'User' ? 'user' : 'agent'}
                        timestamp={msg.timestamp}
                        agentName={msg.agent_name || msg.sender}
                        agentId={msg.agent_id}
                        showAvatar={false}
                      />
                      {msg.sender === 'Agent' && msg.execution_id && msg.workflow_id && (
                        <a
                          href={`https://n8n.theaiteam.uk/workflow/${msg.workflow_id}/executions/${msg.execution_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 ml-12 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                          title="View n8n execution"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Execution #{msg.execution_id}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No messages in this session</p>
                </div>
              )}
            </div>
          ) : chatSessions && chatSessions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Chat Sessions ({chatSessions.length})
              </h3>
              <div className="space-y-2">
                {chatSessions.map((session, index) => (
                  <button
                    key={session.session_id || index}
                    onClick={() => loadSessionMessages(session.session_id)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {session.message_count} messages
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {session.last_message && new Date(session.last_message).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {session.agents.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {session.agents.map((agent, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}
                    {session.preview && (
                      <p className="text-xs text-gray-500 truncate">{session.preview}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {session.first_message && new Date(session.first_message).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {session.last_message && new Date(session.last_message).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-300">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono truncate flex-1">{session.session_id}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(session.session_id);
                          toast.success('Session ID copied!');
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy session ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No chat history found for this user</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PostHog Activity Modal Component
interface PostHogActivityModalProps {
  user: UserProfile;
  onClose: () => void;
}

function PostHogActivityModal({ user, onClose }: PostHogActivityModalProps) {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${BACKEND_URL}/api/admin/analytics/user-activity?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user activity');
        }

        const data = await response.json();
        console.log('📊 PostHog activity data received:', data);
        console.log('🆔 Person ID:', data.person_id);
        setActivityData(data);
      } catch (err: any) {
        console.error('Error fetching PostHog activity:', err);
        setError(err.message || 'Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user.email]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Activity</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              {activityData?.person_id && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 font-mono">
                    PostHog ID: {activityData.person_id}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activityData.person_id);
                      toast.success('PostHog ID copied!');
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy PostHog ID"
                  >
                    <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Activity</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : activityData ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Events</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {activityData.total_events || 0}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Sessions</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {activityData.session_count || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Last Seen</p>
                      <p className="text-sm font-semibold text-green-900 mt-1">
                        {activityData.last_seen 
                          ? new Date(activityData.last_seen).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <UserIcon className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Recent Events */}
              {activityData.recent_events && activityData.recent_events.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
                  <div className="space-y-2">
                    {activityData.recent_events.map((event: any, index: number) => {
                      // Extract session recording URL from properties
                      const sessionId = event.properties?.$session_id;
                      const recordingUrl = sessionId 
                        ? `https://us.posthog.com/replay/${sessionId}`
                        : null;
                      
                      return (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{event.event}</span>
                                {recordingUrl && (
                                  <a
                                    href={recordingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Watch Recording
                                  </a>
                                )}
                              </div>
                              {event.properties?.current_url && (
                                <div className="mt-1 text-xs text-gray-500 truncate max-w-md">
                                  {event.properties.current_url}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                              {event.timestamp 
                                ? new Date(event.timestamp).toLocaleString()
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View in PostHog Link */}
              <div className="border-t border-gray-200 pt-4">
                {activityData.person_id ? (
                  <a
                    href={`https://eu.posthog.com/project/95299/persons/${activityData.person_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View full details in PostHog
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </a>
                ) : (
                  <a
                    href={`https://eu.posthog.com/persons?q=${encodeURIComponent(user.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View full details in PostHog
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No activity data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
