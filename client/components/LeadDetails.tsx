import React from 'react';
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

interface Activity {
  id: string;
  type: 'email' | 'call' | 'created';
  title: string;
  description: string;
  date: string;
  time: string;
}

interface LeadDetailsProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetails({ lead, isOpen, onClose }: LeadDetailsProps) {
  if (!isOpen) return null;

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

  // Sample activity data
  const activities: Activity[] = [
    {
      id: '1',
      type: 'email',
      title: 'Email sent',
      description: 'Proposal documents delivered',
      date: '15 Jun 2023',
      time: '14:30'
    },
    {
      id: '2',
      type: 'call',
      title: 'Call completed',
      description: 'Discussed requirements and budget',
      date: '14 Jun 2023',
      time: '10:15'
    },
    {
      id: '3',
      type: 'created',
      title: 'Lead created',
      description: 'Website inquiry',
      date: '10 Jun 2023',
      time: '09:00'
    }
  ];

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
          <p className="text-gray-600 mb-4">{lead.company}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBgColor(lead.statusColor)}`}>
              {lead.status}
            </span>
            <span className="text-lg font-bold text-gray-900">
              £{lead.value.toLocaleString()}
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
              <span className="text-sm text-gray-700">Phone: {lead.phone}</span>
            </div>
          </div>
        </div>

        {/* Qualification Score */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Qualification Score</h4>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-900">{lead.qualification}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${getQualificationColor(lead.qualification)}`}
              style={{ width: `${lead.qualification}%` }}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Notes:</h4>
          <p className="text-sm text-gray-700">
            Interested in full roof installation, has previous experience with renewables
          </p>
        </div>

        {/* Activity Timeline */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Activity Timeline</h4>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  {activity.type === 'email' && <Mail className="w-5 h-5 text-white" />}
                  {activity.type === 'call' && <PhoneCall className="w-5 h-5 text-white" />}
                  {activity.type === 'created' && <Clock className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-gray-900">{activity.title}</h5>
                    <span className="text-xs text-gray-500">{activity.date}, {activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
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