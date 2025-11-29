import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { Input } from '../../ui/input';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { cn } from '../../../lib/utils';

interface Lead {
  id: string;
  name: string;
  company: string;
  status: 'new' | 'qualified' | 'survey_booked' | 'won' | 'lost';
  value: string;
  score: number;
  source: string;
  avatar?: string;
  phone?: string;
  email?: string;
  location?: string;
  lastContact?: string;
  assignedTo?: string;
}

// Sample leads data based on the screenshots
const sampleLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'Green Home Solutions',
    status: 'qualified',
    value: '£8,500',
    score: 85,
    source: 'Facebook',
    phone: '+44 7700 900123',
    email: 'sarah@greenhome.com',
    location: 'London',
    lastContact: '2 hours ago',
    assignedTo: 'Solar Advisor',
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Residential',
    status: 'new',
    value: '£6,200',
    score: 65,
    source: 'Instagram',
    phone: '+44 7700 900124',
    lastContact: '1 day ago',
    assignedTo: 'Unassigned',
  },
  {
    id: '3',
    name: 'Emma Williams',
    company: 'EcoFriendly Ltd',
    status: 'survey_booked',
    value: '£12,000',
    score: 92,
    source: 'Facebook',
    phone: '+44 7700 900125',
    email: 'emma@ecofriendly.com',
    lastContact: '3 hours ago',
    assignedTo: 'Technical Advisor',
  },
  {
    id: '4',
    name: 'David Thompson',
    company: 'Residential',
    status: 'qualified',
    value: '£7,800',
    score: 78,
    source: 'Instagram',
    phone: '+44 7700 900126',
    lastContact: '5 hours ago',
    assignedTo: 'Solar Advisor',
  },
  {
    id: '5',
    name: 'Olivia Martinez',
    company: 'Residential',
    status: 'new',
    value: '£5,000',
    score: 45,
    source: 'Facebook',
    lastContact: '1 day ago',
    assignedTo: 'Unassigned',
  },
  {
    id: '6',
    name: 'James Wilson',
    company: 'Wilson Properties',
    status: 'won',
    value: '£15,000',
    score: 95,
    source: 'Instagram',
    phone: '+44 7700 900127',
    email: 'james@wilson.com',
    lastContact: '2 days ago',
    assignedTo: 'Senior Consultant',
  },
  {
    id: '7',
    name: 'Sophia Brown',
    company: 'Residential',
    status: 'lost',
    value: '£4,500',
    score: 25,
    source: 'Facebook',
    lastContact: '1 week ago',
    assignedTo: 'Junior Advisor',
  },
];

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-500', variant: 'default' as const },
  qualified: { label: 'Qualified', color: 'bg-purple-500', variant: 'secondary' as const },
  survey_booked: { label: 'Survey Booked', color: 'bg-orange-500', variant: 'default' as const },
  won: { label: 'Won', color: 'bg-green-500', variant: 'default' as const },
  lost: { label: 'Lost', color: 'bg-red-500', variant: 'destructive' as const },
};

interface MobileLeadsProps {
  leads?: Lead[];
  onLeadSelect?: (lead: Lead) => void;
  onCreateLead?: () => void;
}

export function MobileLeads({
  leads = sampleLeads,
  onLeadSelect,
  onCreateLead,
}: MobileLeadsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleLeadClick = (lead: Lead) => {
    if (onLeadSelect) {
      onLeadSelect(lead);
    } else {
      navigate(`/leads/${lead.id}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-primary">Squidgy Leads</h1>
          
          <TouchButton
            variant="gradient"
            size="sm"
            onClick={onCreateLead}
            className="h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Lead
          </TouchButton>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search Leads or Ask Squidgy AI"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted/30 border-muted focus:border-primary"
          />
          <TouchButton
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <Filter className="h-4 w-4" />
          </TouchButton>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'new', 'qualified', 'survey_booked', 'won'].map((status) => (
            <TouchButton
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex-shrink-0 text-xs h-8 px-3"
            >
              {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
            </TouchButton>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <MobileCard
              key={lead.id}
              variant="interactive"
              onClick={() => handleLeadClick(lead)}
              className="p-4 border border-border"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {lead.name}
                        </h3>
                        <Badge 
                          variant={statusConfig[lead.status].variant}
                          className="text-xs flex-shrink-0"
                        >
                          {statusConfig[lead.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {lead.company}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right ml-2">
                    <p className="font-bold text-foreground">{lead.value}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                </div>

                {/* Progress and Score */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Qualification Score</span>
                      <span className={cn('text-xs font-medium', getScoreColor(lead.score))}>
                        {lead.score}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full transition-all duration-300', getProgressColor(lead.score))}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="capitalize">{lead.source}</span>
                    <span>•</span>
                    <span>{lead.assignedTo}</span>
                  </div>
                </div>

                {/* Contact Info */}
                {(lead.phone || lead.email || lead.location) && (
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{lead.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </MobileCard>
          ))}
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No leads found
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              {searchQuery 
                ? `No leads match "${searchQuery}" with status "${statusFilter}".`
                : `No leads with status "${statusFilter}".`
              }
            </p>
            {statusFilter !== 'all' && (
              <TouchButton
                variant="outline"
                onClick={() => setStatusFilter('all')}
              >
                Show All Leads
              </TouchButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}