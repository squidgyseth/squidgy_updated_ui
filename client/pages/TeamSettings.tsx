import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal,
  UserPlus
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
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
  const { user, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Sales Rep' | 'Viewer'>('Admin');
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex@wasteless.com',
      role: 'Admin',
      status: 'Active',
      avatarText: 'AJ',
      avatarColor: 'bg-gray-400'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah@wasteless.com',
      role: 'Sales Rep',
      status: 'Active',
      avatarText: 'SW',
      avatarColor: 'bg-gray-400'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael@wasteless.com',
      role: 'Viewer',
      status: 'Invited',
      avatarText: 'MC',
      avatarColor: 'bg-purple-200'
    }
  ]);

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      
      // TODO: Implement API call to invite team member
      
      // For now, add to local state
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'Invited',
        avatarText: inviteEmail.slice(0, 2).toUpperCase(),
        avatarColor: 'bg-purple-200'
      };
      
      setTeamMembers([...teamMembers, newMember]);
      setInviteEmail('');
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
        setTeamMembers(teamMembers.filter(m => m.id !== memberId));
        toast.success(`${member.name} has been removed from the team`);
      }
    }
  };

  const handleRoleChange = (memberId: string, newRole: 'Admin' | 'Sales Rep' | 'Viewer') => {
    setTeamMembers(teamMembers.map(member => 
      member.id === memberId ? { ...member, role: newRole } : member
    ));
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      toast.success(`${member.name}'s role updated to ${newRole}`);
    }
  };

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
                        <div className={`w-10 h-10 ${member.avatarColor} rounded-full flex items-center justify-center`}>
                          <span className="text-sm font-medium text-gray-700">
                            {member.avatarText}
                          </span>
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
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'Admin' | 'Sales Rep' | 'Viewer')}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Sales Rep">Sales Rep</option>
                        <option value="Viewer">Viewer</option>
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