-- Lead Information Table
-- Stores detailed lead information, activities, and timeline events

CREATE TABLE IF NOT EXISTS public.lead_information (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Information type and content
  information_type text NOT NULL, -- activity, note, document, communication, qualification, survey, proposal
  title text NOT NULL,
  description text NULL,
  content jsonb NULL, -- Flexible content storage
  
  -- Activity/Communication specific fields
  activity_type text NULL, -- email, call, meeting, visit, proposal, survey
  communication_direction text NULL, -- inbound, outbound
  communication_status text NULL, -- sent, delivered, read, replied, bounced
  
  -- Document/File information
  file_url text NULL,
  file_name text NULL,
  file_type text NULL,
  file_size integer NULL,
  
  -- Qualification/Survey data
  survey_data jsonb NULL,
  qualification_data jsonb NULL,
  
  -- Proposal information
  proposal_value numeric(10,2) NULL,
  proposal_status text NULL, -- draft, sent, viewed, accepted, rejected
  proposal_valid_until timestamp with time zone NULL,
  
  -- Scheduling information
  scheduled_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  
  -- Status and priority
  status text NOT NULL DEFAULT 'active', -- active, completed, cancelled, pending
  priority text NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Assignment and ownership
  assigned_to uuid NULL,
  created_by uuid NOT NULL,
  
  -- Additional metadata
  metadata jsonb NULL,
  tags text[] NULL,
  is_public boolean NOT NULL DEFAULT true, -- Whether visible to all team members
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT lead_information_pkey PRIMARY KEY (id),
  CONSTRAINT lead_information_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  CONSTRAINT lead_information_type_check CHECK (information_type IN ('activity', 'note', 'document', 'communication', 'qualification', 'survey', 'proposal')),
  CONSTRAINT lead_information_activity_type_check CHECK (activity_type IS NULL OR activity_type IN ('email', 'call', 'meeting', 'visit', 'proposal', 'survey', 'chat')),
  CONSTRAINT lead_information_direction_check CHECK (communication_direction IS NULL OR communication_direction IN ('inbound', 'outbound')),
  CONSTRAINT lead_information_status_check CHECK (status IN ('active', 'completed', 'cancelled', 'pending')),
  CONSTRAINT lead_information_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_information_lead_id 
  ON public.lead_information(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_information_user_id 
  ON public.lead_information(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_information_company_id 
  ON public.lead_information(company_id);

CREATE INDEX IF NOT EXISTS idx_lead_information_type 
  ON public.lead_information(information_type);

CREATE INDEX IF NOT EXISTS idx_lead_information_activity_type 
  ON public.lead_information(activity_type);

CREATE INDEX IF NOT EXISTS idx_lead_information_created_at 
  ON public.lead_information(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_information_scheduled_at 
  ON public.lead_information(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_lead_information_assigned_to 
  ON public.lead_information(assigned_to);

-- Lead Communications View
-- Simplified view for communication history
CREATE OR REPLACE VIEW public.lead_communications AS
SELECT 
  li.id,
  li.lead_id,
  l.name as lead_name,
  l.email as lead_email,
  li.information_type,
  li.activity_type,
  li.title,
  li.description,
  li.communication_direction,
  li.communication_status,
  li.scheduled_at,
  li.completed_at,
  li.created_at,
  li.created_by
FROM public.lead_information li
JOIN public.leads l ON li.lead_id = l.id
WHERE li.information_type IN ('activity', 'communication')
ORDER BY li.created_at DESC;

-- Lead Activities View
-- Timeline view of all lead activities
CREATE OR REPLACE VIEW public.lead_activities AS
SELECT 
  li.id,
  li.lead_id,
  l.name as lead_name,
  li.information_type,
  li.activity_type,
  li.title,
  li.description,
  li.status,
  li.priority,
  li.scheduled_at,
  li.completed_at,
  li.created_at,
  li.created_by
FROM public.lead_information li
JOIN public.leads l ON li.lead_id = l.id
ORDER BY li.created_at DESC;

-- Add table comments
COMMENT ON TABLE public.lead_information IS 
'Stores detailed lead information including activities, communications, documents, and timeline events';

COMMENT ON VIEW public.lead_communications IS 
'Simplified view of lead communications and activities';

COMMENT ON VIEW public.lead_activities IS 
'Timeline view of all lead activities and events';

-- Sample data for testing (Optional - remove in production)
/*
-- Assuming we have a lead_id from the leads table
INSERT INTO public.lead_information (
  lead_id,
  user_id,
  company_id,
  information_type,
  activity_type,
  title,
  description,
  communication_direction,
  communication_status,
  completed_at,
  created_by
) VALUES 
-- Email sent activity
(
  (SELECT id FROM public.leads WHERE email = 'sarah@example.com' LIMIT 1),
  gen_random_uuid(),
  gen_random_uuid(),
  'communication',
  'email',
  'Proposal documents delivered',
  'Sent comprehensive solar installation proposal with pricing and timeline',
  'outbound',
  'delivered',
  '2023-06-15 14:30:00+00',
  gen_random_uuid()
),
-- Call completed activity
(
  (SELECT id FROM public.leads WHERE email = 'sarah@example.com' LIMIT 1),
  gen_random_uuid(),
  gen_random_uuid(),
  'activity',
  'call',
  'Discussed requirements and budget',
  'Detailed conversation about solar installation requirements, budget constraints, and timeline preferences',
  'outbound',
  'completed',
  '2023-06-14 10:15:00+00',
  gen_random_uuid()
),
-- Lead creation note
(
  (SELECT id FROM public.leads WHERE email = 'sarah@example.com' LIMIT 1),
  gen_random_uuid(),
  gen_random_uuid(),
  'note',
  NULL,
  'Lead created',
  'Website inquiry received through contact form',
  NULL,
  NULL,
  '2023-06-10 09:00:00+00',
  gen_random_uuid()
);
*/