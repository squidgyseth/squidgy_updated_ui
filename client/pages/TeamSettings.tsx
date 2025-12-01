import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Rep' | 'Viewer';
  status: 'Active' | 'Invited' | 'Inactive';
  avatarText?: string;
  avatarColor?: string;
}

export default function TeamSettings() {
  const navigate = useNavigate();
  const { user, profile, isReady, isAuthenticated } = useUser();
  const { faviconUrl } = useCompanyBranding();
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Sales Rep' | 'Viewer'>('Admin');
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Load existing team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!profile?.user_id || !profile?.company_id) return;
      
      setLoading(true);
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading team members:', error);
          return;
        }

        if (data) {
          const formattedMembers: TeamMember[] = data.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            status: member.status,
            avatarText: member.avatar_text || member.email.slice(0, 2).toUpperCase(),
            avatarColor: member.avatar_color || 'bg-gray-400'
          }));
          setTeamMembers(formattedMembers);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isReady && isAuthenticated) {
      loadTeamMembers();
    }
  }, [profile?.user_id, profile?.company_id, isReady, isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!profile?.user_id || !profile?.company_id) {
      toast.error('Please log in to invite team members');
      return;
    }

    try {
      setInviting(true);
      
      const { supabase } = await import('../lib/supabase');
      
      // Generate avatar text and color
      const avatarText = inviteEmail.slice(0, 2).toUpperCase();
      const avatarColor = 'bg-purple-200';
      
      // Insert new team member invitation
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          user_id: profile.user_id, // The person who invited
          sent_user_id: null, // Will be filled when they accept invitation
          company_id: profile.company_id,
          name: inviteEmail.split('@')[0], // Default name from email
          email: inviteEmail,
          role: inviteRole,
          status: 'Invited',
          avatar_text: avatarText,
          avatar_color: avatarColor,
          invited_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('This email is already invited to your team');
        } else {
          throw error;
        }
        return;
      }

      if (data) {
        // Add to local state
        const newMember: TeamMember = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          avatarText: data.avatar_text,
          avatarColor: data.avatar_color
        };
        
        setTeamMembers([newMember, ...teamMembers]);
        setInviteEmail('');
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    if (!confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
      toast.success(`${member.name} has been removed from the team`);
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove team member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      setTeamMembers(teamMembers.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
      
      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
        toast.success(`${member.name}'s role updated to ${newRole}`);
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SettingsLayout title="Team Settings">
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Team Settings</h1>

        {/* Invite New Member Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Invite New Member</h2>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            
            <div className="w-64">
              <label className="block text-sm text-gray-600 mb-2">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Sales Rep' | 'Viewer')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="Admin">Admin</option>
                <option value="Sales Rep">Sales Rep</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleInviteMember}
                disabled={inviting || !inviteEmail}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {inviting ? 'Inviting...' : 'Invite Member'}
              </button>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROLE
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                          {faviconUrl ? (
                            <img 
                              src={faviconUrl} 
                              alt="Company favicon" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide company favicon and show Squidgy logo
                                e.currentTarget.style.display = 'none';
                                const container = e.currentTarget.parentElement;
                                const squidgyImg = container?.querySelector('.squidgy-fallback') as HTMLElement;
                                if (squidgyImg) squidgyImg.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <img 
                            src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=64" 
                            alt="Squidgy logo" 
                            className={`w-6 h-6 squidgy-fallback ${faviconUrl ? 'hidden' : ''}`}
                            onError={(e) => {
                              // Hide Squidgy logo and show text initials
                              e.currentTarget.style.display = 'none';
                              const container = e.currentTarget.parentElement;
                              const textDiv = container?.querySelector('.text-fallback') as HTMLElement;
                              if (textDiv) textDiv.classList.remove('hidden');
                            }}
                          />
                          <div className={`${member.avatarColor} w-full h-full flex items-center justify-center text-fallback hidden`}>
                            <span className="text-sm font-medium text-gray-700">
                              {member.avatarText}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Sales Rep">Sales Rep</option>
                        <option value="Viewer">Viewer</option>
                        <option value="Manager">Manager</option>
                        <option value="Developer">Developer</option>
                        <option value="Support">Support</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : member.status === 'Invited'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}