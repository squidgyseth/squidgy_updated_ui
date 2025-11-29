-- Plan Upgrade Requests Table
-- Stores user requests for plan upgrades and downgrades

CREATE TABLE IF NOT EXISTS public.plan_upgrade_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Request details
  current_plan text NOT NULL,
  requested_plan text NOT NULL,
  request_type text NOT NULL DEFAULT 'upgrade', -- upgrade, downgrade, change
  request_reason text NULL,
  
  -- Pricing information
  current_price numeric(10,2) NOT NULL DEFAULT 0.00,
  requested_price numeric(10,2) NOT NULL,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled
  priority text NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Admin notes and processing
  admin_notes text NULL,
  processed_by uuid NULL, -- admin user who processed
  processed_at timestamp with time zone NULL,
  
  -- Effective dates
  requested_effective_date timestamp with time zone NULL,
  actual_effective_date timestamp with time zone NULL,
  
  -- Contact preferences
  contact_email text NULL,
  contact_phone text NULL,
  preferred_contact_method text DEFAULT 'email',
  
  -- Additional metadata
  request_source text DEFAULT 'billing_settings', -- billing_settings, support_ticket, sales_call
  stripe_data jsonb NULL, -- Store Stripe-related data if needed
  notes text NULL,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT plan_upgrade_requests_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_user_id 
  ON public.plan_upgrade_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_status 
  ON public.plan_upgrade_requests(status);

CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_created_at 
  ON public.plan_upgrade_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_company 
  ON public.plan_upgrade_requests(company_id);

-- Add table comment
COMMENT ON TABLE public.plan_upgrade_requests IS 
'Stores user requests for plan upgrades, downgrades, and changes with admin processing workflow';

-- Sample data for testing (Optional - remove in production)
/*
INSERT INTO public.plan_upgrade_requests (
  user_id, 
  company_id, 
  current_plan,
  requested_plan,
  request_type,
  current_price,
  requested_price,
  contact_email,
  notes
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Professional',
  'Enterprise',
  'upgrade',
  49.00,
  99.00,
  'user@example.com',
  'Need more team collaboration features'
);
*/