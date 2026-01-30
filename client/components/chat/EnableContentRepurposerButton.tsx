import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';

interface EnableContentRepurposerButtonProps {
  className?: string;
}

export default function EnableContentRepurposerButton({ 
  className = '' 
}: EnableContentRepurposerButtonProps) {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [isEnabled, setIsEnabled] = useState(true); // Default to true to hide button initially
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    checkContentRepurposerEnabled();
  }, [userId]);

  const checkContentRepurposerEnabled = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('is_enabled')
        .eq('user_id', userId)
        .eq('assistant_id', 'content_repurposer')
        .single();

      if (error) {
        console.log('No content_repurposer personalization found, showing enable button');
        setIsEnabled(false);
      } else {
        setIsEnabled(data?.is_enabled || false);
      }
    } catch (error) {
      console.error('Error checking content repurposer status:', error);
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableClick = async () => {
    if (enabling) return; // Prevent double clicks
    
    try {
      setEnabling(true);
      console.log('🔧 EnableContentRepurposer: Starting to enable agent...');
      
      // Insert or update the agent personalization to enable it
      const { data, error } = await supabase
        .from('assistant_personalizations')
        .upsert({
          user_id: userId,
          assistant_id: 'content_repurposer',
          is_enabled: true,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error enabling content repurposer:', error);
        setEnabling(false);
        return;
      }

      console.log('✅ Content repurposer enabled successfully:', data);
      
      // Update local state to hide the button
      setIsEnabled(true);
      
      // Refresh the sidebar to show the newly enabled agent
      if ((window as any).refreshAgentSidebar) {
        console.log('🔄 Refreshing sidebar to show Content Repurposer...');
        (window as any).refreshAgentSidebar();
      }
      
      // Show success message (optional)
      console.log('🎉 Content Repurposer is now enabled! Check your sidebar.');
      
    } catch (error) {
      console.error('❌ Error in handleEnableClick:', error);
      setEnabling(false);
    }
  };

  // Don't render if loading or if already enabled
  if (loading || isEnabled) {
    return null;
  }

  return (
    <div className={`enable-content-repurposer-container ${className}`}>
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Want to repurpose this newsletter?
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Enable Content Repurposer to convert your newsletters into engaging social media posts for LinkedIn, Instagram, and TikTok. It will appear in your sidebar once enabled.
            </p>
            <button
              onClick={handleEnableClick}
              disabled={enabling}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                enabling 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${enabling ? 'animate-spin' : ''}`} />
              {enabling ? 'Enabling...' : 'Enable Content Repurposer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
