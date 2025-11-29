-- Leads Table
-- Stores main lead information

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Lead basic information
  name text NOT NULL,
  company text NULL,
  email text NOT NULL,
  phone text NULL,
  
  -- Lead status and scoring
  status text NOT NULL DEFAULT 'new', -- new, contacted, qualified, proposal_sent, won, lost
  qualification_score integer NULL DEFAULT 0, -- 0-100
  estimated_value numeric(10,2) NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'GBP',
  
  -- Source and assignment
  lead_source text NULL DEFAULT 'website', -- website, referral, social_media, cold_call, etc.
  assigned_to uuid NULL, -- user_id of assigned team member
  priority text NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Location information
  address text NULL,
  city text NULL,
  postal_code text NULL,
  country text NULL DEFAULT 'UK',
  
  -- Additional fields
  industry text NULL,
  company_size text NULL, -- small, medium, large, enterprise
  notes text NULL,
  tags text[] NULL, -- Array of tags
  
  -- External integrations
  external_lead_id text NULL, -- For CRM integrations
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_contacted_at timestamp with time zone NULL,
  next_followup_at timestamp with time zone NULL,
  
  -- Constraints
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_email_check CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost')),
  CONSTRAINT leads_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT leads_qualification_score_check CHECK (qualification_score >= 0 AND qualification_score <= 100)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id 
  ON public.leads(user_id);

CREATE INDEX IF NOT EXISTS idx_leads_company_id 
  ON public.leads(company_id);

CREATE INDEX IF NOT EXISTS idx_leads_status 
  ON public.leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to 
  ON public.leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_created_at 
  ON public.leads(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_email 
  ON public.leads(email);

CREATE INDEX IF NOT EXISTS idx_leads_next_followup 
  ON public.leads(next_followup_at);

-- Add table comment
COMMENT ON TABLE public.leads IS 
'Stores lead information including contact details, status, and qualification data';

-- Sample data for testing (Optional - remove in production)
/*
INSERT INTO public.leads (
  user_id, 
  company_id, 
  name,
  company,
  email,
  phone,
  status,
  qualification_score,
  estimated_value,
  lead_source,
  priority,
  address,
  city,
  postal_code,
  industry,
  notes,
  tags
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Sarah Johnson',
  'Green Home Solutions',
  'sarah@example.com',
  '07700 900123',
  'qualified',
  85,
  8500.00,
  'website',
  'high',
  '123 Renewable Street',
  'London',
  'SW1A 1AA',
  'Renewable Energy',
  'Interested in full roof installation, has previous experience with renewables',
  ARRAY['solar', 'roof-installation', 'qualified']
);
*/