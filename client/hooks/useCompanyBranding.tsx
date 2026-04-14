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

        // Helper function to check if text looks like error/debug output
        const isErrorText = (text: string): boolean => {
          if (!text) return false;
          return text.includes('WEBSITE SCRAPING RESULTS') ||
                 text.includes('================') ||
                 text.includes('Status: error') ||
                 text.includes('Total pages scraped:') ||
                 text.includes('Depth Level:') ||
                 text.includes('URL:') && text.includes('error') ||
                 text.startsWith('ERROR:') ||
                 text.length > 100; // Names shouldn't be this long
        };

        // Extract company name with priority: business_name > business_domain > company_description > website_url
        let companyName = 'Squidgy';

        if (businessDetails?.business_name && !isErrorText(businessDetails.business_name)) {
          // First priority: business_name from business_details table
          companyName = businessDetails.business_name;
        } else if (websiteAnalysis?.business_domain && 
                   !isErrorText(websiteAnalysis.business_domain) &&
                   !websiteAnalysis.business_domain.includes('supabase.co') &&
                   !websiteAnalysis.business_domain.includes('localhost') &&
                   !websiteAnalysis.business_domain.includes('127.0.0.1') &&
                   !websiteAnalysis.business_domain.startsWith('www.') &&
                   !websiteAnalysis.business_domain.includes('.com') &&
                   !websiteAnalysis.business_domain.includes('.ch') &&
                   !websiteAnalysis.business_domain.includes('.co') &&
                   !websiteAnalysis.business_domain.includes('.org') &&
                   !websiteAnalysis.business_domain.includes('.net') &&
                   !websiteAnalysis.business_domain.includes('.io')) {
          // Second priority: business_domain from website_analysis (but skip URLs/domains)
          companyName = websiteAnalysis.business_domain;
        } else if (websiteAnalysis?.company_description && !isErrorText(websiteAnalysis.company_description)) {
          // Third priority: extract from company_description
          const desc = websiteAnalysis.company_description;
          const nameMatch = desc.match(/^([^-|*•]+)/);
          if (nameMatch) {
            let extractedName = nameMatch[1].trim();
            extractedName = extractedName.replace(/^(company name:|name:)/i, '').trim();
            // Only use if it's a reasonable length
            if (extractedName.length <= 50 && !isErrorText(extractedName)) {
              companyName = extractedName;
            }
          }
        } else if (websiteAnalysis?.website_url) {
          // Last resort: extract from website URL
          // But skip if it's a Supabase storage URL or other internal URLs
          try {
            const url = new URL(websiteAnalysis.website_url);
            const domain = url.hostname.replace('www.', '');
            
            // Skip Supabase URLs and other internal/storage URLs
            if (!domain.includes('supabase.co') && 
                !domain.includes('localhost') && 
                !domain.includes('127.0.0.1')) {
              companyName = domain.split('.')[0];
              // Capitalize first letter
              companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
            }
          } catch (e) {
          }
        }

        // Final safety check - if companyName still looks like error text, use default
        if (isErrorText(companyName)) {
          companyName = 'Squidgy';
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

    // Set up polling as backup (every 10 seconds) to catch updates that real-time might miss
    const pollingInterval = setInterval(() => {
      fetchCompanyBranding();
    }, 10000);

    // Set up real-time subscription for website_analysis updates
    const websiteChannel = supabase
      .channel(`website_analysis_branding_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'website_analysis',
          filter: `firm_user_id=eq.${userId}`,
        },
        (payload) => {
          // Refetch branding when website_analysis changes
          fetchCompanyBranding();
        }
      )
      .subscribe();

    // Set up real-time subscription for business_details updates
    const businessChannel = supabase
      .channel(`business_details_branding_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_details',
          filter: `firm_user_id=eq.${userId}`,
        },
        (payload) => {
          // Refetch branding when business_details changes
          fetchCompanyBranding();
        }
      )
      .subscribe();

    // Cleanup subscriptions and polling on unmount
    return () => {
      clearInterval(pollingInterval);
      websiteChannel.unsubscribe();
      businessChannel.unsubscribe();
    };
  }, [userId]);

  return branding;
}