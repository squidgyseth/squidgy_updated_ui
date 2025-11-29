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
        // Fetch the most recent website analysis for this user
        const { data: websiteAnalysis, error } = await supabase
          .from('website_analysis')
          .select('website_url, favicon_url, business_domain')
          .eq('firm_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.log('No website analysis found, using default Squidgy branding');
          setBranding(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (websiteAnalysis) {
          // Clean up favicon URL by removing any trailing "?)"
          let cleanFaviconUrl = websiteAnalysis.favicon_url || '';
          if (cleanFaviconUrl.endsWith('?)')) {
            cleanFaviconUrl = cleanFaviconUrl.slice(0, -2);
          }

          // Extract company name from business domain or website URL
          let companyName = 'Squidgy';
          if (websiteAnalysis.business_domain) {
            companyName = websiteAnalysis.business_domain;
          } else if (websiteAnalysis.website_url) {
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
            websiteUrl: websiteAnalysis.website_url || '',
            isLoading: false
          });
        } else {
          setBranding(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error fetching company branding:', error);
        setBranding(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchCompanyBranding();
  }, [userId]);

  return branding;
}