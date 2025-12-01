import { useState, useEffect } from 'react';
import { useUser } from './useUser';
import { supabase } from '../lib/supabase';

interface CompanyBranding {
  companyName: string;
  faviconUrl: string;
  websiteUrl: string;
  isLoading: boolean;
}

export function useCompanyBranding(): CompanyBranding {
  const { userId } = useUser();
  const [branding, setBranding] = useState<CompanyBranding>({
    companyName: 'Squidgy',
    faviconUrl: '',
    websiteUrl: '',
    isLoading: true
  });

  useEffect(() => {
    const fetchCompanyBranding = async () => {
      if (!userId) {
        setBranding(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Fetch both website analysis and business details in parallel
        const [websiteResult, businessResult] = await Promise.all([
          supabase
            .from('website_analysis')
            .select('website_url, favicon_url, business_domain, company_description')
            .eq('firm_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('business_details')
            .select('business_name')
            .eq('firm_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
        ]);

        const websiteAnalysis = websiteResult.data && websiteResult.data.length > 0 ? websiteResult.data[0] : null;
        const businessDetails = businessResult.data && businessResult.data.length > 0 ? businessResult.data[0] : null;

        // Clean up favicon URL by removing any trailing "?)"
        let cleanFaviconUrl = '';
        if (websiteAnalysis?.favicon_url) {
          cleanFaviconUrl = websiteAnalysis.favicon_url;
          if (cleanFaviconUrl.endsWith('?)')) {
            cleanFaviconUrl = cleanFaviconUrl.slice(0, -2);
          }
        }

        // Extract company name with priority: business_name > business_domain > company_description > website_url
        let companyName = 'Squidgy';
        
        if (businessDetails?.business_name) {
          // First priority: business_name from business_details table
          companyName = businessDetails.business_name;
        } else if (websiteAnalysis?.business_domain) {
          // Second priority: business_domain from website_analysis
          companyName = websiteAnalysis.business_domain;
        } else if (websiteAnalysis?.company_description) {
          // Third priority: extract from company_description
          const nameMatch = websiteAnalysis.company_description.match(/^([^-|*•]+)/);
          if (nameMatch) {
            companyName = nameMatch[1].trim();
            companyName = companyName.replace(/^(company name:|name:)/i, '').trim();
          }
        } else if (websiteAnalysis?.website_url) {
          // Last resort: extract from website URL
          try {
            const url = new URL(websiteAnalysis.website_url);
            const domain = url.hostname.replace('www.', '');
            companyName = domain.split('.')[0];
            // Capitalize first letter
            companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
          } catch (e) {
            console.log('Error parsing website URL:', e);
          }
        }

        setBranding({
          companyName,
          faviconUrl: cleanFaviconUrl,
          websiteUrl: websiteAnalysis?.website_url || '',
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching company branding:', error);
        setBranding(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchCompanyBranding();
  }, [userId]);

  return branding;
}