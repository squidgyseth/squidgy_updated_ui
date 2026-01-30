import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

interface WebsiteAnalysisData {
  id: string;
  firm_user_id: string;
  website_url: string;
  company_name?: string;
  company_description?: string;
  favicon_url?: string;
  screenshot_url?: string;
  business_domain?: string;
  value_proposition?: string;
  business_niche?: string;
  tags?: string[];
}

/**
 * Hook to fetch website analysis data including favicon_url for the current user
 */
export function useWebsiteAnalysis() {
  const { userId } = useUser();
  const [websiteData, setWebsiteData] = useState<WebsiteAnalysisData | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchWebsiteAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch website analysis data for the user
        const { data, error: queryError } = await supabase
          .from('website_analysis')
          .select('*')
          .eq('firm_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching website analysis:', queryError);
          setError(queryError.message);
        } else if (data) {
          setWebsiteData(data);
          setFaviconUrl(data.favicon_url || null);
          console.log('Website analysis data fetched:', data);
        }
      } catch (err) {
        console.error('Error in fetchWebsiteAnalysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch website analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteAnalysis();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel(`website_analysis_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'website_analysis',
          filter: `firm_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Website analysis updated:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as WebsiteAnalysisData;
            setWebsiteData(newData);
            setFaviconUrl(newData.favicon_url || null);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    websiteData,
    faviconUrl,
    loading,
    error,
    companyName: websiteData?.company_name,
    websiteUrl: websiteData?.website_url,
  };
}
