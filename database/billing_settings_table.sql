-- Billing Settings Table
-- Stores user subscription and billing information

CREATE TABLE IF NOT EXISTS public.billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Subscription details
  plan_name text NOT NULL DEFAULT 'Free',
  plan_price numeric(10,2) NOT NULL DEFAULT 0.00,
  plan_period text NOT NULL DEFAULT 'month',
  plan_status text NOT NULL DEFAULT 'active',
  next_billing_date timestamp with time zone NULL,
  
  -- Payment method
  payment_method_type text NULL,
  payment_method_last4 text NULL,
  payment_method_expiry text NULL,
  payment_method_brand text NULL,
  
  -- Billing details
  billing_email text NULL,
  billing_name text NULL,
  billing_address text NULL,
  billing_city text NULL,
  billing_state text NULL,
  billing_postal_code text NULL,
  billing_country text NULL DEFAULT 'US',
  
  -- External IDs for payment providers (Stripe, etc.)
  stripe_customer_id text NULL,
  stripe_subscription_id text NULL,
  
  -- Metadata
  subscription_features jsonb NULL,
  usage_limits jsonb NULL,
  
  -- Timestamps
  subscription_start_date timestamp with time zone NULL,
  subscription_end_date timestamp with time zone NULL,
  trial_end_date timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT billing_settings_pkey PRIMARY KEY (id),
  CONSTRAINT billing_settings_user_company_unique UNIQUE (user_id, company_id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_billing_settings_user_id 
  ON public.billing_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_settings_stripe_customer 
  ON public.billing_settings(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_settings_subscription 
  ON public.billing_settings(stripe_subscription_id);

-- Billing Invoices Table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Invoice details
  invoice_number text NOT NULL,
  invoice_date timestamp with time zone NOT NULL,
  due_date timestamp with time zone NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  
  -- Line items
  description text NULL,
  line_items jsonb NULL,
  
  -- External references
  stripe_invoice_id text NULL,
  stripe_payment_intent_id text NULL,
  
  -- PDF and downloads
  invoice_pdf_url text NULL,
  
  -- Timestamps
  paid_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT billing_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT billing_invoices_number_unique UNIQUE (invoice_number)
) TABLESPACE pg_default;

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id 
  ON public.billing_invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status 
  ON public.billing_invoices(status);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_date 
  ON public.billing_invoices(invoice_date);

-- Add table comments
COMMENT ON TABLE public.billing_settings IS 
'Stores user subscription and billing information';

COMMENT ON TABLE public.billing_invoices IS 
'Stores billing invoices and payment history';

-- Sample data for testing (Optional - remove in production)
/*
INSERT INTO public.billing_settings (
  user_id, 
  company_id, 
  plan_name, 
  plan_price, 
  plan_period,
  next_billing_date,
  payment_method_type,
  payment_method_last4,
  payment_method_expiry,
  payment_method_brand,
  subscription_features
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Professional',
  49.00,
  'month',
  '2023-11-01'::timestamp with time zone,
  'card',
  '4242',
  '12/25',
  'Visa',
  '["Unlimited AI conversations", "Advanced analytics", "Priority support", "Custom integrations", "Team collaboration"]'::jsonb
);
*/