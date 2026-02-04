import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Plus,
  Search,
  Calendar,
  RefreshCw,
  Bell,
  CheckCircle
} from 'lucide-react';
import { LeftNavigation } from '../components/layout/LeftNavigation';
import { LeadDetails } from '../components/LeadDetails';
import { useUser } from '../hooks/useUser';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import NotificationBell from '../components/NotificationBell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LeadService, type Lead } from '../services/leadService';
import { ResponsiveLayout } from '../components/mobile/layout/ResponsiveLayout';
import { MobileLeads } from '../components/mobile/leads/MobileLeads';

// Lead interface is now imported from LeadService

export default function Leads() {
  const navigate = useNavigate();
  const { user, profile, isReady, isAuthenticated } = useUser();
  const { companyName, isLoading } = useCompanyBranding();

  const [statusFilter, setStatusFilter] = useState('All');
  const [minQualification, setMinQualification] = useState('');
  const [minValue, setMinValue] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingDummies, setCreatingDummies] = useState(false);

  // Load leads from database
  useEffect(() => {
    const loadLeads = async () => {
      if (!profile?.user_id || !profile?.company_id) return;

      setLoading(true);
      try {
        const leadsData = await LeadService.getLeads(profile.user_id, profile.company_id);
        setLeads(leadsData);
      } catch (error) {
        console.error('Error loading leads:', error);
        toast.error('Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    if (isReady && isAuthenticated) {
      loadLeads();
    }
  }, [profile?.user_id, profile?.company_id, isReady, isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleAddLead = () => {
    toast.success('Opening add lead form...');
    // TODO: Navigate to add lead page or open modal
  };

  const createDummyLeads = async () => {
    if (!profile?.user_id || !profile?.company_id) {
      toast.error('Please log in to create dummy leads');
      return;
    }

    try {
      setCreatingDummies(true);
      const newLeads = await LeadService.createDummyLeads(profile.user_id, profile.company_id);

      // Create dummy activities for the first lead
      if (newLeads.length > 0 && profile?.user_id) {
        await LeadService.createDummyLeadActivities(
          newLeads[0].id,
          profile.user_id,
          profile.company_id,
          profile.user_id
        );
      }

      setLeads(prevLeads => [...newLeads, ...prevLeads]);
      toast.success(`Created ${newLeads.length} dummy leads with activities!`);
    } catch (error: any) {
      console.error('Error creating dummy leads:', error);
      toast.error(error.message || 'Failed to create dummy leads');
    } finally {
      setCreatingDummies(false);
    }
  };

  // Filter leads based on criteria
  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (statusFilter !== 'All' && lead.status !== statusFilter) {
      return false;
    }

    // Qualification filter
    if (minQualification && lead.qualification_score !== null) {
      if (lead.qualification_score < parseInt(minQualification)) {
        return false;
      }
    }

    // Value filter
    if (minValue && lead.estimated_value !== null) {
      if (lead.estimated_value < parseFloat(minValue)) {
        return false;
      }
    }

    // Date filter
    if (fromDate) {
      const leadDate = new Date(lead.created_at);
      const filterDate = new Date(fromDate);
      if (leadDate < filterDate) {
        return false;
      }
    }

    return true;
  });

  const handleReset = () => {
    setStatusFilter('All');
    setMinQualification('');
    setMinValue('');
    setFromDate('');
    toast.success('Filters reset');
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseDetails = () => {
    setSelectedLead(null);
  };

  const getQualificationColor = (qualification: number | null) => {
    if (!qualification) return 'bg-gray-400';
    if (qualification >= 80) return 'bg-green-500';
    if (qualification >= 60) return 'bg-blue-500';
    if (qualification >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBgColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal_sent: 'bg-purple-100 text-purple-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status: string) => {
    const names: Record<string, string> = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      proposal_sent: 'Proposal Sent',
      won: 'Won',
      lost: 'Lost'
    };
    return names[status] || status;
  };

  const getSourceDisplayName = (source: string | null) => {
    if (!source) return 'Unknown';
    const names: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      website: 'Website',
      referral: 'Referral',
      google: 'Google',
      linkedin: 'LinkedIn'
    };
    return names[source] || source;
  };

  // Convert leads data for mobile component
  const mobileLeads = leads.map(lead => ({
    id: lead.id,
    name: lead.name,
    company: lead.company || 'Residential',
    status: lead.status as 'new' | 'qualified' | 'survey_booked' | 'won' | 'lost',
    value: `${lead.currency === 'GBP' ? '£' : '$'}${(lead.estimated_value || 0).toLocaleString()}`,
    score: lead.qualification_score || 0,
    source: getSourceDisplayName(lead.lead_source),
    phone: lead.phone,
    email: lead.email,
    location: lead.city || 'Unknown',
    lastContact: 'Recently',
    assignedTo: 'Unassigned',
  }));

  const desktopLayout = (
    <div className="min-h-screen bg-white">
      {/* Reusable Left Navigation */}
      <LeftNavigation currentPage="leads" />

      {/* Main Content */}
      <div className="ml-[60px] bg-gray-50 p-8">
        <div className="max-w-full mx-auto space-y-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
                  alt="Squidgy"
                  className="w-[100px] h-[40px]"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-black font-open-sans">Leads</h1>
                  <p className="text-[11px] text-gray-500 font-open-sans">Every lead in one place — faster follow-ups, better results.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Search className="w-6 h-6 text-gray-500" />
              </Button>

              <NotificationBell />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {isLoading ? 'Loading...' : `${companyName} Team`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.profile_avatar_url ? (
                    <img
                      src={profile.profile_avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-white text-sm font-bold" 
                    style={{ display: profile?.profile_avatar_url ? 'none' : 'flex' }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="All">All</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Min Qualification:</label>
                <input
                  type="number"
                  value={minQualification}
                  onChange={(e) => setMinQualification(e.target.value)}
                  className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Min Value (£):</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-24 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleReset}
                className="ml-auto text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Reset
              </button>

              <button
                onClick={createDummyLeads}
                disabled={creatingDummies}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingDummies ? 'Creating...' : 'Add Test Data'}
              </button>

              <button
                onClick={handleAddLead}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading leads...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No leads found. Click "Add Test Data" to create sample leads.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qualification
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value (£)
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`cursor-pointer transition-colors ${selectedLead?.id === lead.id
                          ? 'bg-purple-100 border-purple-200'
                          : 'hover:bg-gray-50'
                          }`}
                        onClick={() => handleLeadClick(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-xs text-gray-500">{lead.company || 'No company'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{lead.email}</div>
                            <div className="text-xs text-gray-500">{lead.phone || 'No phone'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getQualificationColor(lead.qualification_score)}`}
                                style={{ width: `${lead.qualification_score || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">{lead.qualification_score || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBgColor(lead.status)}`}>
                            {getStatusDisplayName(lead.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {lead.currency === 'GBP' ? '£' : '$'}{(lead.estimated_value || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{getSourceDisplayName(lead.lead_source)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{lead.industry || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                            lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              lead.priority === 'urgent' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(lead.created_at).toLocaleDateString('en-GB')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(lead.created_at).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Details Side Panel */}
      {selectedLead && (
        <LeadDetails
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );

  return (
    <ResponsiveLayout
      desktopLayout={desktopLayout}
      showBottomNav={true}
    >
      <MobileLeads
        leads={mobileLeads}
        onLeadSelect={(lead) => {
          // Find the original lead by ID for mobile selection
          const originalLead = leads.find(l => l.id === lead.id);
          if (originalLead) {
            handleLeadClick(originalLead);
          }
        }}
        onCreateLead={handleAddLead}
      />
    </ResponsiveLayout>
  );
}
