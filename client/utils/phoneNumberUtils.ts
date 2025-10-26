/**
 * Utility functions for phone number formatting and country detection
 */

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string; // Example format pattern
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    format: '+44 20 1234 5678'
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    format: '+1 (555) 123-4567'
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    format: '+1 (555) 123-4567'
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    format: '+61 2 1234 5678'
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    format: '+49 30 12345678'
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    format: '+33 1 23 45 67 89'
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    dialCode: '+34',
    format: '+34 91 123 45 67'
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    dialCode: '+39',
    format: '+39 06 1234 5678'
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    dialCode: '+31',
    format: '+31 20 123 4567'
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    dialCode: '+32',
    format: '+32 2 123 45 67'
  }
];

/**
 * Get country configuration by country code
 */
export const getCountryByCode = (code: string): CountryConfig | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

/**
 * Format phone number with country dial code
 */
export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  if (!phoneNumber) return '';
  
  const country = getCountryByCode(countryCode);
  if (!country) return phoneNumber;
  
  // Remove any existing country codes or special characters
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  // If number already starts with country code, return as is with + prefix
  if (cleanNumber.startsWith(country.dialCode.replace('+', ''))) {
    return '+' + cleanNumber;
  }
  
  // Add country dial code
  return country.dialCode + ' ' + cleanNumber;
};

/**
 * Detect country from website URL or content
 */
export const detectCountryFromWebsite = (websiteUrl: string, websiteContent?: string): string => {
  if (!websiteUrl) return 'GB'; // Default to UK
  
  // Extract domain from URL
  try {
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    const domain = url.hostname.toLowerCase();
    
    // Check top-level domain patterns
    if (domain.endsWith('.co.uk') || domain.endsWith('.uk')) return 'GB';
    if (domain.endsWith('.com') || domain.endsWith('.us')) return 'US';
    if (domain.endsWith('.ca')) return 'CA';
    if (domain.endsWith('.com.au') || domain.endsWith('.au')) return 'AU';
    if (domain.endsWith('.de')) return 'DE';
    if (domain.endsWith('.fr')) return 'FR';
    if (domain.endsWith('.es')) return 'ES';
    if (domain.endsWith('.it')) return 'IT';
    if (domain.endsWith('.nl')) return 'NL';
    if (domain.endsWith('.be')) return 'BE';
    
    // Check content for country indicators if available
    if (websiteContent) {
      const content = websiteContent.toLowerCase();
      if (content.includes('united kingdom') || content.includes('england') || content.includes('scotland') || content.includes('wales')) return 'GB';
      if (content.includes('united states') || content.includes('usa')) return 'US';
      if (content.includes('canada')) return 'CA';
      if (content.includes('australia')) return 'AU';
      if (content.includes('germany') || content.includes('deutschland')) return 'DE';
      if (content.includes('france')) return 'FR';
      if (content.includes('spain') || content.includes('españa')) return 'ES';
      if (content.includes('italy') || content.includes('italia')) return 'IT';
      if (content.includes('netherlands') || content.includes('nederland')) return 'NL';
      if (content.includes('belgium') || content.includes('belgië')) return 'BE';
    }
  } catch (error) {
    console.error('Error detecting country from website:', error);
  }
  
  // Default to UK
  return 'GB';
};

/**
 * Get phone number placeholder based on country
 */
export const getPhoneNumberPlaceholder = (countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  return country ? country.format : '+44 20 1234 5678';
};