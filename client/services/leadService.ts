import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
  qualification_score: number | null;
  estimated_value: number | null;
  currency: string;
  lead_source: string | null;
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  industry: string | null;
  company_size: string | null;
  notes: string | null;
  tags: string[] | null;
  external_lead_id: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  next_followup_at: string | null;
}

export interface LeadInformation {
  id: string;
  lead_id: string;
  user_id: string;
  company_id: string;
  information_type: 'activity' | 'note' | 'document' | 'communication' | 'qualification' | 'survey' | 'proposal';
  title: string;
  description: string | null;
  content: any;
  activity_type: 'email' | 'call' | 'meeting' | 'visit' | 'proposal' | 'survey' | 'chat' | null;
  communication_direction: 'inbound' | 'outbound' | null;
  communication_status: 'sent' | 'delivered' | 'read' | 'replied' | 'bounced' | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  survey_data: any;
  qualification_data: any;
  proposal_value: number | null;
  proposal_status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | null;
  proposal_valid_until: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  created_by: string;
  metadata: any;
  tags: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export class LeadService {
  /**
   * Get all leads for a user/company
   */
  static async getLeads(userId: string, companyId: string): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLeads:', error);
      throw error;
    }
  }

  /**
   * Get lead information/activities for a specific lead
   */
  static async getLeadInformation(leadId: string): Promise<LeadInformation[]> {
    try {
      const { data, error } = await supabase
        .from('lead_information')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lead information:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLeadInformation:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(
    leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>,
    userId: string,
    companyId: string
  ): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          user_id: userId,
          company_id: companyId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in createLead:', error);
      throw error;
    }
  }

  /**
   * Update a lead
   */
  static async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in updateLead:', error);
      throw error;
    }
  }

  /**
   * Add lead information/activity
   */
  static async addLeadInformation(
    infoData: Omit<LeadInformation, 'id' | 'created_at' | 'updated_at'>,
    createdBy: string
  ): Promise<LeadInformation> {
    try {
      const { data, error } = await supabase
        .from('lead_information')
        .insert({
          ...infoData,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding lead information:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in addLeadInformation:', error);
      throw error;
    }
  }

  /**
   * Create dummy leads for testing
   */
  static async createDummyLeads(userId: string, companyId: string): Promise<Lead[]> {
    try {
      const currentDate = new Date();
      
      const dummyLeads = [
        {
          user_id: userId,
          company_id: companyId,
          name: 'Sarah Johnson',
          company: 'Green Home Solutions',
          email: 'sarah@example.com',
          phone: '07700 900123',
          status: 'qualified' as const,
          qualification_score: 85,
          estimated_value: 8500.00,
          currency: 'GBP',
          lead_source: 'facebook',
          priority: 'high' as const,
          address: '123 Renewable Street',
          city: 'London',
          postal_code: 'SW1A 1AA',
          country: 'UK',
          industry: '',
          notes: 'Interested in full roof installation, has previous experience with renewables',
          tags: ['solar', 'roof-installation', 'qualified']
        },
        {
          user_id: userId,
          company_id: companyId,
          name: 'Michael Chen',
          company: 'Residential',
          email: 'michael@example.com',
          phone: '07700 900456',
          status: 'new' as const,
          qualification_score: 65,
          estimated_value: 6200.00,
          currency: 'GBP',
          lead_source: 'instagram',
          priority: 'medium' as const,
          industry: 'Residential',
          notes: 'Initial inquiry about solar panels',
          tags: ['residential', 'new-lead']
        },
        {
          user_id: userId,
          company_id: companyId,
          name: 'Emma Williams',
          company: 'EcoFriendly Ltd',
          email: 'emma@example.com',
          phone: '07700 900789',
          status: 'proposal_sent' as const,
          qualification_score: 92,
          estimated_value: 12000.00,
          currency: 'GBP',
          lead_source: 'facebook',
          priority: 'high' as const,
          industry: 'Commercial',
          notes: 'Large commercial installation project',
          tags: ['commercial', 'high-value', 'proposal-sent']
        },
        {
          user_id: userId,
          company_id: companyId,
          name: 'David Thompson',
          company: 'Residential',
          email: 'david@example.com',
          phone: '07700 900234',
          status: 'qualified' as const,
          qualification_score: 78,
          estimated_value: 7800.00,
          currency: 'GBP',
          lead_source: 'instagram',
          priority: 'medium' as const,
          industry: 'Residential',
          notes: 'Ready to proceed with installation',
          tags: ['residential', 'qualified', 'ready']
        },
        {
          user_id: userId,
          company_id: companyId,
          name: 'James Wilson',
          company: 'Wilson Properties',
          email: 'james@example.com',
          phone: '07700 900890',
          status: 'won' as const,
          qualification_score: 95,
          estimated_value: 15000.00,
          currency: 'GBP',
          lead_source: 'instagram',
          priority: 'high' as const,
          industry: 'Commercial',
          notes: 'Successfully closed deal',
          tags: ['commercial', 'won', 'high-value']
        }
      ];

      const { data, error } = await supabase
        .from('leads')
        .insert(dummyLeads)
        .select();

      if (error) {
        console.error('Error creating dummy leads:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in createDummyLeads:', error);
      throw error;
    }
  }

  /**
   * Create dummy lead activities
   */
  static async createDummyLeadActivities(leadId: string, userId: string, companyId: string, createdBy: string): Promise<void> {
    try {
      const activities = [
        {
          lead_id: leadId,
          user_id: userId,
          company_id: companyId,
          information_type: 'communication' as const,
          activity_type: 'email' as const,
          title: 'Proposal documents delivered',
          description: 'Sent comprehensive solar installation proposal with pricing and timeline',
          communication_direction: 'outbound' as const,
          communication_status: 'delivered' as const,
          status: 'completed' as const,
          priority: 'normal' as const,
          completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          created_by: createdBy,
          is_public: true
        },
        {
          lead_id: leadId,
          user_id: userId,
          company_id: companyId,
          information_type: 'activity' as const,
          activity_type: 'call' as const,
          title: 'Discussed requirements and budget',
          description: 'Detailed conversation about solar installation requirements, budget constraints, and timeline preferences',
          status: 'completed' as const,
          priority: 'normal' as const,
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          created_by: createdBy,
          is_public: true
        },
        {
          lead_id: leadId,
          user_id: userId,
          company_id: companyId,
          information_type: 'note' as const,
          title: 'Lead created',
          description: 'Website inquiry received through contact form',
          status: 'completed' as const,
          priority: 'normal' as const,
          completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          created_by: createdBy,
          is_public: true
        }
      ];

      const { error } = await supabase
        .from('lead_information')
        .insert(activities);

      if (error) {
        console.error('Error creating dummy activities:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in createDummyLeadActivities:', error);
      throw error;
    }
  }

  /**
   * Delete a lead and all associated information
   */
  static async deleteLead(leadId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Error deleting lead:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in deleteLead:', error);
      throw error;
    }
  }
}
