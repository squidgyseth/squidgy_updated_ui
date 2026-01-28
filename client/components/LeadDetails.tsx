import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Send, 
  MessageCircle,
  Clock,
  PhoneCall
} from 'lucide-react';
import { type Lead, type LeadInformation, LeadService } from '../services/leadService';

interface LeadDetailsProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetails({ lead, isOpen, onClose }: LeadDetailsProps) {
  const [activities, setActivities] = useState<LeadInformation[]>([]);
  const [loading, setLoading] = useState(false);

  // Load lead activities when component opens
  useEffect(() => {
    const loadActivities = async () => {
      if (!isOpen || !lead.id) return;
      
      setLoading(true);
      try {
        const leadInfo = await LeadService.getLeadInformation(lead.id);
        setActivities(leadInfo);
      } catch (error) {
        console.error('Error loading lead activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [lead.id, isOpen]);

  if (!isOpen) return null;

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

  const getActivityIcon = (activityType: string | null) => {
    switch (activityType) {
      case 'email':
        return <Mail className="w-5 h-5 text-white" />;
      case 'call':
        return <PhoneCall className="w-5 h-5 text-white" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-white" />;
      case 'chat':
        return <MessageCircle className="w-5 h-5 text-white" />;
      default:
        return <Clock className="w-5 h-5 text-white" />;
    }
  };

  const handleAssignAssistant = () => {
    console.log('Assign assistant clicked for lead:', lead.id);
  };

  const handleScheduleSurvey = () => {
    console.log('Schedule survey clicked for lead:', lead.id);
  };

  const handleSendProposal = () => {
    console.log('Send proposal clicked for lead:', lead.id);
  };

  const handleCheckChat = () => {
    console.log('Check chat clicked for lead:', lead.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Faded Background Overlay */}
      <div 
        className="flex-1 bg-black bg-opacity-30"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="w-96 bg-white shadow-xl h-full overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Lead Info */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{lead.name}</h3>
          <p className="text-gray-600 mb-4">{lead.company || 'No company'}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBgColor(lead.status)}`}>
              {getStatusDisplayName(lead.status)}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {lead.currency === 'GBP' ? '£' : '$'}{(lead.estimated_value || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Email: {lead.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Phone: {lead.phone || 'No phone'}</span>
            </div>
            {lead.address && (
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 text-gray-500 mt-0.5">📍</div>
                <span className="text-sm text-gray-700">
                  {lead.address}
                  {lead.city && `, ${lead.city}`}
                  {lead.postal_code && `, ${lead.postal_code}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Qualification Score */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Qualification Score</h4>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-900">{lead.qualification_score || 0}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${getQualificationColor(lead.qualification_score)}`}
              style={{ width: `${lead.qualification_score || 0}%` }}
            />
          </div>
        </div>

        {/* Lead Details */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Lead Details</h4>
          <div className="space-y-2 text-sm">
            {lead.lead_source && (
              <div className="flex justify-between">
                <span className="text-gray-600">Source:</span>
                <span className="text-gray-900 capitalize">{lead.lead_source}</span>
              </div>
            )}
            {lead.industry && (
              <div className="flex justify-between">
                <span className="text-gray-600">Industry:</span>
                <span className="text-gray-900">{lead.industry}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Priority:</span>
              <span className={`text-gray-900 capitalize ${
                lead.priority === 'high' ? 'text-red-600 font-medium' :
                lead.priority === 'urgent' ? 'text-purple-600 font-medium' :
                ''
              }`}>
                {lead.priority}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">
                {new Date(lead.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Notes:</h4>
            <p className="text-sm text-gray-700">{lead.notes}</p>
          </div>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Activity Timeline</h4>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading activities...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              No activities found for this lead.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-900">{activity.title}</h5>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString('en-GB')}, {' '}
                        {new Date(activity.created_at).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        activity.information_type === 'communication' ? 'bg-blue-100 text-blue-800' :
                        activity.information_type === 'activity' ? 'bg-green-100 text-green-800' :
                        activity.information_type === 'note' ? 'bg-gray-100 text-gray-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {activity.information_type}
                      </span>
                      {activity.activity_type && (
                        <span className="text-xs text-gray-500 capitalize">
                          {activity.activity_type}
                        </span>
                      )}
                      {activity.communication_direction && (
                        <span className="text-xs text-gray-500 capitalize">
                          {activity.communication_direction}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAssignAssistant}
              className="flex flex-col items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <User className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Assign Assistant</span>
            </button>
            
            <button
              onClick={handleScheduleSurvey}
              className="flex flex-col items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <Calendar className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Schedule Survey</span>
            </button>
            
            <button
              onClick={handleSendProposal}
              className="flex flex-col items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <Send className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Send Proposal</span>
            </button>
            
            <button
              onClick={handleCheckChat}
              className="flex flex-col items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Check Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
