/**
 * Currency and energy pricing utilities for solar configuration
 */

export interface CurrencyConfig {
  code: string;        // ISO currency code (USD, GBP, CAD, etc.)
  symbol: string;      // Currency symbol ($, £, C$, etc.)
  name: string;        // Full currency name
  position: 'before' | 'after';  // Symbol position
}

export interface CountryEnergyDefaults {
  countryCode: string;
  currency: CurrencyConfig;
  brokerFee: number;           // Default broker fee percentage
  installationPrice: number;    // Default $/kW or £/kW installation cost
  energyPrice: number;          // Default $/kWh or £/kWh energy price
  powerUnit: 'kW' | 'kWh';     // Preferred power unit
  energyUnit: 'kWh' | 'MWh';   // Preferred energy unit
}

// Currency configurations
export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    position: 'before'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    position: 'before'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    position: 'before'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    position: 'before'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    position: 'before'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    position: 'before'
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    position: 'before'
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    position: 'after'
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    position: 'after'
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    position: 'after'
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Złoty',
    position: 'after'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    position: 'before'
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    position: 'before'
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    position: 'before'
  }
};

// Country-specific energy defaults
export const COUNTRY_ENERGY_DEFAULTS: Record<string, CountryEnergyDefaults> = {
  GB: {
    countryCode: 'GB',
    currency: CURRENCIES.GBP,
    brokerFee: 5,                // 5% typical UK broker fee
    installationPrice: 800,       // £800/kW typical UK installation cost
    energyPrice: 0.34,           // £0.34/kWh typical UK electricity price (2024)
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  US: {
    countryCode: 'US',
    currency: CURRENCIES.USD,
    brokerFee: 6,                // 6% typical US broker fee
    installationPrice: 2500,      // $2,500/kW typical US installation cost
    energyPrice: 0.16,           // $0.16/kWh average US electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  CA: {
    countryCode: 'CA',
    currency: CURRENCIES.CAD,
    brokerFee: 5,                // 5% typical Canadian broker fee
    installationPrice: 3000,      // C$3,000/kW typical Canadian installation cost
    energyPrice: 0.13,           // C$0.13/kWh average Canadian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  AU: {
    countryCode: 'AU',
    currency: CURRENCIES.AUD,
    brokerFee: 5,                // 5% typical Australian broker fee
    installationPrice: 1400,      // A$1,400/kW typical Australian installation cost
    energyPrice: 0.34,           // A$0.34/kWh average Australian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  DE: {
    countryCode: 'DE',
    currency: CURRENCIES.EUR,
    brokerFee: 4,                // 4% typical German broker fee
    installationPrice: 1200,      // €1,200/kW typical German installation cost
    energyPrice: 0.40,           // €0.40/kWh typical German electricity price (high)
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  FR: {
    countryCode: 'FR',
    currency: CURRENCIES.EUR,
    brokerFee: 5,                // 5% typical French broker fee
    installationPrice: 1100,      // €1,100/kW typical French installation cost
    energyPrice: 0.23,           // €0.23/kWh typical French electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  ES: {
    countryCode: 'ES',
    currency: CURRENCIES.EUR,
    brokerFee: 5,                // 5% typical Spanish broker fee
    installationPrice: 900,       // €900/kW typical Spanish installation cost
    energyPrice: 0.25,           // €0.25/kWh typical Spanish electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  IT: {
    countryCode: 'IT',
    currency: CURRENCIES.EUR,
    brokerFee: 5,                // 5% typical Italian broker fee
    installationPrice: 1300,      // €1,300/kW typical Italian installation cost
    energyPrice: 0.28,           // €0.28/kWh typical Italian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  NL: {
    countryCode: 'NL',
    currency: CURRENCIES.EUR,
    brokerFee: 4,                // 4% typical Dutch broker fee
    installationPrice: 1350,      // €1,350/kW typical Dutch installation cost
    energyPrice: 0.35,           // €0.35/kWh typical Dutch electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  BE: {
    countryCode: 'BE',
    currency: CURRENCIES.EUR,
    brokerFee: 5,                // 5% typical Belgian broker fee
    installationPrice: 1400,      // €1,400/kW typical Belgian installation cost
    energyPrice: 0.35,           // €0.35/kWh typical Belgian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  JP: {
    countryCode: 'JP',
    currency: CURRENCIES.JPY,
    brokerFee: 3,                // 3% typical Japanese broker fee
    installationPrice: 280000,    // ¥280,000/kW typical Japanese installation cost
    energyPrice: 30,             // ¥30/kWh typical Japanese electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  CH: {
    countryCode: 'CH',
    currency: CURRENCIES.CHF,
    brokerFee: 4,                // 4% typical Swiss broker fee
    installationPrice: 1800,      // CHF 1,800/kW typical Swiss installation cost
    energyPrice: 0.22,           // CHF 0.22/kWh typical Swiss electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  SE: {
    countryCode: 'SE',
    currency: CURRENCIES.SEK,
    brokerFee: 5,                // 5% typical Swedish broker fee
    installationPrice: 12000,     // 12,000 kr/kW typical Swedish installation cost
    energyPrice: 1.5,            // 1.5 kr/kWh typical Swedish electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  NO: {
    countryCode: 'NO',
    currency: CURRENCIES.NOK,
    brokerFee: 5,                // 5% typical Norwegian broker fee
    installationPrice: 15000,     // 15,000 kr/kW typical Norwegian installation cost
    energyPrice: 1.8,            // 1.8 kr/kWh typical Norwegian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  IN: {
    countryCode: 'IN',
    currency: CURRENCIES.INR,
    brokerFee: 6,                // 6% typical Indian broker fee
    installationPrice: 45000,     // ₹45,000/kW typical Indian installation cost
    energyPrice: 6,              // ₹6/kWh typical Indian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  BR: {
    countryCode: 'BR',
    currency: CURRENCIES.BRL,
    brokerFee: 8,                // 8% typical Brazilian broker fee
    installationPrice: 3500,      // R$3,500/kW typical Brazilian installation cost
    energyPrice: 0.65,           // R$0.65/kWh typical Brazilian electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  },
  ZA: {
    countryCode: 'ZA',
    currency: CURRENCIES.ZAR,
    brokerFee: 6,                // 6% typical South African broker fee
    installationPrice: 18000,     // R18,000/kW typical South African installation cost
    energyPrice: 1.8,            // R1.8/kWh typical South African electricity price
    powerUnit: 'kW',
    energyUnit: 'kWh'
  }
};

/**
 * Get energy defaults for a country
 */
export const getCountryEnergyDefaults = (countryCode: string): CountryEnergyDefaults => {
  return COUNTRY_ENERGY_DEFAULTS[countryCode] || COUNTRY_ENERGY_DEFAULTS.GB; // Default to UK
};

/**
 * Format currency value with proper symbol placement
 */
export const formatCurrency = (value: number, currency: CurrencyConfig): string => {
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedValue}`;
  }
  return `${formattedValue}${currency.symbol}`;
};

/**
 * Format price with unit (e.g., "$2,500/kW" or "£0.34/kWh")
 */
export const formatPriceWithUnit = (value: number, currency: CurrencyConfig, unit: string): string => {
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: unit === 'kWh' ? 2 : 0,
    maximumFractionDigits: unit === 'kWh' ? 3 : 0
  });
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedValue}/${unit}`;
  }
  return `${formattedValue}${currency.symbol}/${unit}`;
};

/**
 * Get currency from country code
 */
export const getCurrencyFromCountry = (countryCode: string): CurrencyConfig => {
  const defaults = COUNTRY_ENERGY_DEFAULTS[countryCode];
  return defaults ? defaults.currency : CURRENCIES.GBP; // Default to GBP
};

/**
 * Parse currency value from string (removes symbol and formatting)
 */
export const parseCurrencyValue = (value: string): number => {
  // Remove currency symbols and whitespace
  const cleanValue = value.replace(/[£$€¥₹\s,krCHFR\$AzłAC]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};
