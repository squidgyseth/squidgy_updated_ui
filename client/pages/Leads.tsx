import React, { useState } from 'react';
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

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  qualification: number;
  status: 'Qualified' | 'New' | 'Survey Booked' | 'Won' | 'Lost';
  statusColor: 'green' | 'blue' | 'yellow' | 'emerald' | 'red';
  value: number;
  source: 'Facebook' | 'Instagram' | 'Website' | 'Referral';
  leadType: string;
  assignedAssistant: string;
  lastActivity: string;
  lastActivityTime: string;
}

export default function Leads() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { companyName, faviconUrl, isLoading } = useCompanyBranding();
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [minQualification, setMinQualification] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [leads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'Green Home Solutions',
      email: 'sarah@example.com',
      phone: '07700 900123',
      qualification: 85,
      status: 'Qualified',
      statusColor: 'green',
      value: 8500,
      source: 'Facebook',
      leadType: 'Residential property',
      assignedAssistant: 'Solar Advisor',
      lastActivity: '15 Jun 2023',
      lastActivityTime: '14:30'
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'Residential',
      email: 'michael@example.com',
      phone: '07700 900456',
      qualification: 65,
      status: 'New',
      statusColor: 'blue',
      value: 6200,
      source: 'Instagram',
      leadType: 'Residential property',
      assignedAssistant: 'Unassigned',
      lastActivity: '14 Jun 2023',
      lastActivityTime: '11:20'
    },
    {
      id: '3',
      name: 'Emma Williams',
      company: 'EcoFriendly Ltd',
      email: 'emma@example.com',
      phone: '07700 900789',
      qualification: 92,
      status: 'Survey Booked',
      statusColor: 'yellow',
      value: 12000,
      source: 'Facebook',
      leadType: 'Commercial',
      assignedAssistant: 'Technical Advisor',
      lastActivity: '16 Jun 2023',
      lastActivityTime: '09:45'
    },
    {
      id: '4',
      name: 'David Thompson',
      company: 'Residential',
      email: 'david@example.com',
      phone: '07700 900234',
      qualification: 78,
      status: 'Qualified',
      statusColor: 'green',
      value: 7800,
      source: 'Instagram',
      leadType: 'Residential property',
      assignedAssistant: 'Solar Advisor',
      lastActivity: '15 Jun 2023',
      lastActivityTime: '13:10'
    },
    {
      id: '5',
      name: 'Olivia Martinez',
      company: 'Residential',
      email: 'olivia@example.com',
      phone: '07700 900567',
      qualification: 45,
      status: 'New',
      statusColor: 'blue',
      value: 5000,
      source: 'Facebook',
      leadType: 'Unknown',
      assignedAssistant: 'Unassigned',
      lastActivity: '14 Jun 2023',
      lastActivityTime: '16:20'
    },
    {
      id: '6',
      name: 'James Wilson',
      company: 'Wilson Properties',
      email: 'james@example.com',
      phone: '07700 900890',
      qualification: 95,
      status: 'Won',
      statusColor: 'emerald',
      value: 15000,
      source: 'Instagram',
      leadType: 'Commercial',
      assignedAssistant: 'Senior Consultant',
      lastActivity: '16 Jun 2023',
      lastActivityTime: '14:00'
    },
    {
      id: '7',
      name: 'Sophia Brown',
      company: 'Residential',
      email: 'sophia@example.com',
      phone: '07700 900123',
      qualification: 25,
      status: 'Lost',
      statusColor: 'red',
      value: 4500,
      source: 'Facebook',
      leadType: 'Residential property',
      assignedAssistant: 'Junior Advisor',
      lastActivity: '15 Jun 2023',
      lastActivityTime: '10:00'
    }
  ]);

  const handleAddLead = () => {
    toast.success('Opening add lead form...');
    // TODO: Navigate to add lead page or open modal
  };

  const handleReset = () => {
    setStatusFilter('All');
    setMinQualification(0);
    setMinValue(0);
    setFromDate('');
    toast.success('Filters reset');
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseDetails = () => {
    setSelectedLead(null);
  };

  const getQualificationColor = (qualification: number) => {
    if (qualification >= 80) return 'bg-green-500';
    if (qualification >= 60) return 'bg-blue-500';
    if (qualification >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBgColor = (statusColor: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-100 text-red-800'
    };
    return colors[statusColor] || 'bg-gray-100 text-gray-800';
  };

  return (
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
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                  {!isLoading && faviconUrl ? (
                    <img 
                      src={faviconUrl} 
                      alt={`${companyName} logo`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to checkmark icon if favicon fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <CheckCircle className="w-6 h-6 text-white" style={{display: faviconUrl ? 'none' : 'block'}} />
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
                <option value="Qualified">Qualified</option>
                <option value="New">New</option>
                <option value="Survey Booked">Survey Booked</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min Qualification:</label>
              <input
                type="number"
                value={minQualification}
                onChange={(e) => setMinQualification(Number(e.target.value))}
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
                onChange={(e) => setMinValue(Number(e.target.value))}
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
                      Lead Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Assistant
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedLead?.id === lead.id 
                          ? 'bg-purple-100 border-purple-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleLeadClick(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-xs text-gray-500">{lead.company}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{lead.email}</div>
                          <div className="text-xs text-gray-500">{lead.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getQualificationColor(lead.qualification)}`}
                              style={{ width: `${lead.qualification}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">{lead.qualification}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBgColor(lead.statusColor)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          £{lead.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{lead.source}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{lead.leadType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${lead.assignedAssistant === 'Unassigned' ? 'text-gray-400' : 'text-gray-700'}`}>
                          {lead.assignedAssistant}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{lead.lastActivity}</div>
                          <div className="text-xs text-gray-500">{lead.lastActivityTime}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
}