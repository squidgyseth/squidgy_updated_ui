-- Add currency column to solar_setup table
ALTER TABLE public.solar_setup 
ADD COLUMN IF NOT EXISTS currency character varying(3) DEFAULT 'GBP';

-- Add comment for the currency column
COMMENT ON COLUMN public.solar_setup.currency IS 'Currency code (ISO 4217) for pricing fields - e.g., USD, GBP, EUR, etc.';

-- Create index for currency column for better query performance
CREATE INDEX IF NOT EXISTS idx_solar_setup_currency 
ON public.solar_setup USING btree (currency) 
TABLESPACE pg_default;