# Database Schema Update: Add Currency Support

## Solar Setup Table Update

To support multiple currencies in the solar setup configuration, run this SQL command in your Supabase database:

```sql
-- Add currency column to solar_setup table
ALTER TABLE public.solar_setup 
ADD COLUMN IF NOT EXISTS currency character varying(3) DEFAULT 'GBP';

-- Add comment for the currency column
COMMENT ON COLUMN public.solar_setup.currency IS 'Currency code (ISO 4217) for pricing fields - e.g., USD, GBP, EUR, etc.';

-- Create index for currency column for better query performance
CREATE INDEX IF NOT EXISTS idx_solar_setup_currency 
ON public.solar_setup USING btree (currency) 
TABLESPACE pg_default;
```

## Supported Currencies

The application now supports the following currencies with their symbols:

| Currency | Symbol | Name |
|----------|--------|------|
| USD | $ | US Dollar |
| GBP | £ | British Pound |
| EUR | € | Euro |
| CAD | C$ | Canadian Dollar |
| AUD | A$ | Australian Dollar |
| JPY | ¥ | Japanese Yen |
| CHF | CHF | Swiss Franc |
| SEK | kr | Swedish Krona |
| NOK | kr | Norwegian Krone |
| DKK | kr | Danish Krone |
| PLN | zł | Polish Złoty |
| INR | ₹ | Indian Rupee |
| BRL | R$ | Brazilian Real |
| ZAR | R | South African Rand |

## Features

- **Dynamic Currency Selection**: Both `/solar-setup` and `/solar-config` pages automatically detect country and set appropriate currency
- **Country-Specific Defaults**: Each country has realistic installation costs and energy prices in local currency
- **Database Storage**: Currency preference is saved with each solar setup configuration
- **Symbol Positioning**: Currencies display symbols before or after the amount based on local conventions (e.g., "$100" vs "100kr")

## Usage

The currency is automatically detected based on:
1. Country detection from website analysis
2. Business details country selection
3. Manual currency selection in the solar setup pages

All pricing fields (installation price, energy price, etc.) will display and save values in the selected currency.