// Admin Users - User management page

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { 
  Users, Search, ChevronLeft, ChevronRight, Shield, ShieldOff, 
  Trash2, Edit2, X, Check, ArrowLeft, Filter, ArrowUpDown, Building2, Bot
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_super_admin?: boolean;
  is_deleted?: boolean;
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
  const { userId } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Filtering & Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRole, setFilterRole] = useState<FilterRole>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [showFilters, setShowFilters] = useState(false);

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
      if (filterStatus === 'active') {
        query = query.or('is_deleted.is.null,is_deleted.eq.false');
      } else if (filterStatus === 'deleted') {
        query = query.eq('is_deleted', true);
      } else if (filterStatus === 'admin') {
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

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId && isAdmin) {
      loadUsers();
    }
  }, [userId, isAdmin, adminLoading, navigate, loadUsers]);

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
      // Soft delete - set is_deleted flag
      const { error } = await supabase
        .from('profiles')
        .update({ is_deleted: true })
        .eq('user_id', targetUserId);
      
      if (error) throw error;
      
      await logAdminAction('user_deleted', targetUserId);
      
      toast.success('User deleted successfully');
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
                        {user.is_deleted ? (
                          <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Deleted
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.email_confirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        )}
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

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updates) => handleUpdateUser(editingUser, updates)}
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

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'ghl' | 'assistant'>('profile');
  const [saving, setSaving] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingGhl, setLoadingGhl] = useState(false);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  
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
  
  // Business settings
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  
  // GHL Subaccounts
  const [ghlSubaccounts, setGhlSubaccounts] = useState<Record<string, any>[] | null>(null);
  
  // Assistant Personalizations
  const [assistantPersonalizations, setAssistantPersonalizations] = useState<Record<string, any> | null>(null);

  // Fields that should not be editable (shown as disabled inputs)
  const readOnlyFields = ['email', 'company_id', 'ghl_record_id'];
  
  // Fields to hide from the form entirely (managed elsewhere)
  const hiddenFields = ['is_super_admin'];
  
  // Fields that are boolean (shown as checkboxes)
  const booleanFields = [
    'is_deleted', 'email_confirmed', 'terms_accepted', 'terms_read', 'onboarding_completed',
    'ai_processing_consent', 'marketing_consent', 'terms_viewed', 'terms_scrolled_to_bottom',
    'privacy_scrolled_to_bottom', 'privacy_viewed', 'notifications_enabled'
  ];
  
  // Timestamp fields (shown as read-only info, not editable)
  const timestampFields = [
    'terms_accepted_at', 'terms_read_at', 'last_login_at', 'email_confirmed_at', 
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
    email_confirmed: 'email_confirmed_at',
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

  const loadBusinessSettings = async () => {
    try {
      setLoadingBusiness(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.user_id || user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading business settings:', error);
      }
      setBusinessSettings(data || {});
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
    } catch (err) {
      console.error('Error loading GHL subaccounts:', err);
      setGhlSubaccounts([]);
    } finally {
      setLoadingGhl(false);
    }
  };

  const loadAssistantPersonalizations = async () => {
    try {
      setLoadingAssistant(true);
      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', user.user_id || user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading assistant personalizations:', error);
      }
      setAssistantPersonalizations(data || {});
    } catch (err) {
      console.error('Error loading assistant personalizations:', err);
      setAssistantPersonalizations({});
    } finally {
      setLoadingAssistant(false);
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
            onClick={() => setActiveTab('profile')}
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
            onClick={() => setActiveTab('business')}
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
            onClick={() => setActiveTab('ghl')}
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
            onClick={() => setActiveTab('assistant')}
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

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                        .map(([key]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(profileData[key])}
                              onChange={(e) => handleFieldChange(key, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-700">{formatFieldName(key)}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              
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
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(businessSettings)
                      .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-500">{formatFieldName(key)}</span>
                          <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                            {formatFieldValue(value)}
                          </span>
                        </div>
                      ))}
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
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">GHL Subaccounts ({ghlSubaccounts.length})</h3>
                  {ghlSubaccounts.map((account, index) => (
                    <div key={account.id || index} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(account)
                          .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1.5 px-2">
                              <span className="text-xs text-gray-500">{formatFieldName(key)}</span>
                              <span className="text-xs font-medium text-gray-900 text-right max-w-[60%] truncate">
                                {formatFieldValue(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
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
              ) : assistantPersonalizations && Object.keys(assistantPersonalizations).length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Assistant Personalizations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(assistantPersonalizations)
                      .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-500">{formatFieldName(key)}</span>
                          <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                            {formatFieldValue(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No assistant personalizations found for this user</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
