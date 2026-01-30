import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';

interface Newsletter {
  id: string;
  title: string;
  created_at: string;
  session_id: string;
}

interface NewsletterSelectorProps {
  onNewsletterSelect: (newsletterId: string | null) => void;
  selectedNewsletterId: string | null;
}

const NewsletterSelector: React.FC<NewsletterSelectorProps> = ({ 
  onNewsletterSelect, 
  selectedNewsletterId 
}) => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();

  useEffect(() => {
    if (userId) {
      fetchNewsletters();
    }
  }, [userId]);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('history_newsletters')
        .select('id, title, created_at, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10); // Get last 10 newsletters

      if (error) {
        console.error('Error fetching newsletters:', error);
        return;
      }

      setNewsletters(data || []);
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-lg">
        <p className="text-blue-700">Loading newsletters...</p>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-lg">
        <p className="text-yellow-700">No newsletters found. Create a newsletter first using the Newsletter agent.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        📰 Select a Newsletter to Repurpose
      </h3>
      
      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
        {newsletters.map((newsletter) => (
          <button
            key={newsletter.id}
            onClick={() => onNewsletterSelect(newsletter.id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedNewsletterId === newsletter.id
                ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]'
                : 'bg-white hover:bg-blue-50 hover:shadow-sm border border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={`font-medium ${
                  selectedNewsletterId === newsletter.id ? 'text-white' : 'text-gray-800'
                }`}>
                  {newsletter.title || 'Untitled Newsletter'}
                </p>
                <p className={`text-sm mt-1 ${
                  selectedNewsletterId === newsletter.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatDate(newsletter.created_at)}
                </p>
              </div>
              {selectedNewsletterId === newsletter.id && (
                <svg className="w-5 h-5 text-white flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedNewsletterId && (
        <button
          onClick={() => onNewsletterSelect(null)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};

export default NewsletterSelector;
