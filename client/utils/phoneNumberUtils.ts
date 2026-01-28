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
    const fullUrl = url.href.toLowerCase();
    
    // UK domain patterns (highest priority for UK)
    if (domain.endsWith('.co.uk') || 
        domain.endsWith('.org.uk') || 
        domain.endsWith('.gov.uk') || 
        domain.endsWith('.ac.uk') || 
        domain.endsWith('.uk') ||
        domain.endsWith('.gb') ||
        domain.endsWith('.scot') ||
        domain.endsWith('.wales') ||
        domain.endsWith('.cymru') ||
        domain.endsWith('.london')) {
      return 'GB';
    }
    
    // US domain patterns
    if (domain.endsWith('.us') || 
        domain.endsWith('.gov') || 
        domain.endsWith('.edu') || 
        domain.endsWith('.mil') ||
        fullUrl.includes('/us/') ||
        fullUrl.includes('/usa/') ||
        fullUrl.includes('/united-states/')) {
      return 'US';
    }
    
    // Canada domain patterns
    if (domain.endsWith('.ca') || 
        domain.endsWith('.gc.ca') ||
        fullUrl.includes('/ca/') ||
        fullUrl.includes('/canada/')) {
      return 'CA';
    }
    
    // Australia domain patterns
    if (domain.endsWith('.com.au') || 
        domain.endsWith('.gov.au') || 
        domain.endsWith('.edu.au') ||
        domain.endsWith('.au')) {
      return 'AU';
    }
    
    // Other country-specific TLDs
    if (domain.endsWith('.de')) return 'DE';
    if (domain.endsWith('.fr')) return 'FR';
    if (domain.endsWith('.es')) return 'ES';
    if (domain.endsWith('.it')) return 'IT';
    if (domain.endsWith('.nl')) return 'NL';
    if (domain.endsWith('.be')) return 'BE';
    
    // Check content for stronger country indicators
    if (websiteContent) {
      const content = websiteContent.toLowerCase();
      
      // UK indicators (check first as default)
      if (content.includes('united kingdom') || 
          content.includes('uk limited') ||
          content.includes('uk ltd') ||
          content.includes('england') || 
          content.includes('scotland') || 
          content.includes('wales') ||
          content.includes('northern ireland') ||
          content.includes('british') ||
          content.includes('£') || // British pound symbol
          content.includes('gbp') ||
          content.includes('vat number') || // Common in UK/EU
          content.includes('companies house') ||
          content.includes('postcode') || // UK uses "postcode" vs US "zip code"
          content.match(/\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/)) { // UK postcode pattern
        return 'GB';
      }
      
      // US indicators
      if (content.includes('united states') || 
          content.includes('usa') ||
          content.includes('u.s.a') ||
          content.includes('america') ||
          content.includes('$') || // Dollar sign (though used elsewhere)
          content.includes('usd') ||
          content.includes('inc.') || // US corporation
          content.includes('llc') ||
          content.includes('corp.') ||
          content.includes('zip code') ||
          content.includes('state tax') ||
          content.includes('federal') ||
          content.match(/\b\d{5}(-\d{4})?\b/)) { // US ZIP code pattern
        return 'US';
      }
      
      // Canada indicators
      if (content.includes('canada') || 
          content.includes('canadian') ||
          content.includes('cad') ||
          content.includes('c$') ||
          content.includes('province') ||
          content.includes('postal code') ||
          content.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/)) { // Canadian postal code pattern
        return 'CA';
      }
      
      // Australia indicators
      if (content.includes('australia') || 
          content.includes('australian') ||
          content.includes('aud') ||
          content.includes('a$') ||
          content.includes('pty ltd') ||
          content.includes('abn') || // Australian Business Number
          content.includes('acn')) { // Australian Company Number
        return 'AU';
      }
      
      // Other country indicators
      if (content.includes('germany') || content.includes('deutschland') || content.includes('€') || content.includes('eur')) return 'DE';
      if (content.includes('france') || content.includes('français')) return 'FR';
      if (content.includes('spain') || content.includes('españa')) return 'ES';
      if (content.includes('italy') || content.includes('italia')) return 'IT';
      if (content.includes('netherlands') || content.includes('nederland')) return 'NL';
      if (content.includes('belgium') || content.includes('belgië') || content.includes('belgique')) return 'BE';
    }
    
    // .com domains - try to determine based on content or default to US
    if (domain.endsWith('.com')) {
      // If we have content, already checked above
      // Default .com to US as it's most common
      return 'US';
    }
    
    // .org, .net, .io etc - check content or default to UK
    // (UK default since that's the business requirement)
  } catch (error) {
    console.error('Error detecting country from website:', error);
  }
  
  // Default to UK as requested
  return 'GB';
};

/**
 * Get phone number placeholder based on country
 */
export const getPhoneNumberPlaceholder = (countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  return country ? country.format : '+44 20 1234 5678';
};
