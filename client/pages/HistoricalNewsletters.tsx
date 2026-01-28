import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, ExternalLink, Edit3 } from 'lucide-react';
import ChatHistoryService, { NewsletterHistory } from '../services/chatHistoryService';

export default function HistoricalNewsletters() {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<NewsletterHistory[]>([]);
  const [groupedNewsletters, setGroupedNewsletters] = useState<Record<string, NewsletterHistory[]>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsletters();
  }, []);

  const loadNewsletters = async () => {
    try {
      // Get current user
      const userId = localStorage.getItem('squidgy_user_id');
      if (!userId) {
        console.error('No user ID found in localStorage');
        setLoading(false);
        return;
      }

      console.log('📰 Loading newsletters from history_newsletters table for user:', userId);
      
      // Load newsletters directly from database
      const chatService = new ChatHistoryService();
      console.log('📰 Calling getPreviousNewsletters with userId:', userId);
      
      const newsletterData = await chatService.getPreviousNewsletters(userId);
      
      console.log('📰 Raw newsletter data received:', newsletterData);
      console.log('📰 Newsletter data length:', newsletterData.length);
      
      setNewsletters(newsletterData);
      
      // Group by date
      const grouped = ChatHistoryService.groupContentByDate(newsletterData);
      console.log('📰 Grouped newsletters:', grouped);
      setGroupedNewsletters(grouped);
      
      // Set first date as active tab
      const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      console.log('📰 Available dates:', dates);
      if (dates.length > 0) {
        setActiveTab(dates[0]);
        console.log('📰 Set active tab to:', dates[0]);
      }
      
      console.log(`✅ Loaded ${newsletterData.length} newsletters from database`);
    } catch (error) {
      console.error('Error loading newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterClick = (newsletter: NewsletterHistory) => {
    setSelectedNewsletter(newsletter);
  };

  const handleBackToList = () => {
    setSelectedNewsletter(null);
  };

  const handlePreviewNewsletter = async (newsletter: NewsletterHistory) => {
    try {
      // First check if there's a saved version in history_newsletters database
      const { newslettersApi } = await import('../lib/supabase-api');
      const { data: savedNewsletter, error } = await newslettersApi.getByChatHistoryId(newsletter.id);
      
      let contentToPreview = newsletter.message; // Fallback to original
      
      if (savedNewsletter && !error) {
        // Use the latest saved version
        console.log('Using latest saved version');
        contentToPreview = savedNewsletter.content;
      } else {
        // Use original content from chat history
        console.log('Using original content from chat history');
        contentToPreview = newsletter.message;
      }
      
      // Open in new window for full preview
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(contentToPreview);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error loading newsletter for preview:', error);
      // Fallback to original content
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(newsletter.message);
        newWindow.document.close();
      }
    }
  };

  const handleEditNewsletter = (newsletter: NewsletterHistory) => {
    // Save content to localStorage for editor (fallback)
    localStorage.setItem('newsletterEditorContent', newsletter.message);
    
    // Create URL with chat context parameters for proper linking
    const params = new URLSearchParams();
    params.set('chat_history_id', newsletter.id);
    params.set('session_id', newsletter.session_id);
    
    // Only add agent_id if it exists and is not undefined
    if (newsletter.agent_id && newsletter.agent_id !== 'undefined') {
      params.set('agent_id', newsletter.agent_id);
    }
    
    // Navigate to newsletter editor with chat context
    navigate(`/newsletter-editor?${params.toString()}`);
  };

  const getPreviewText = (htmlContent: string): string => {
    try {
      // First, try to parse if it's JSON (some newsletters might be stored as JSON)
      if (htmlContent.trim().startsWith('{')) {
        const parsed = JSON.parse(htmlContent);
        if (parsed.title || parsed.subject) {
          return `Newsletter: ${parsed.title || parsed.subject}`;
        }
      }
      
      // Remove HTML tags, CSS blocks, and excessive whitespace
      let text = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove CSS blocks
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script blocks
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // If the result is still mostly CSS/HTML code, show generic message
      if (text.length < 50 || text.includes('font-family:') || text.includes('margin:') || text.includes('padding:')) {
        return 'Newsletter content available - click "Full Preview" to view the formatted newsletter.';
      }
      
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    } catch (error) {
      return 'Newsletter content available - click "Full Preview" to view the formatted newsletter.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/chat/newsletter')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go back to chat"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Newsletters</h1>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Newsletters Found</h2>
          <p className="text-gray-500">Generate some newsletters in the chat to see them here.</p>
        </div>
      </div>
    );
  }

  if (selectedNewsletter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to newsletters"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Newsletter Details</h1>
                  <p className="text-sm text-gray-500">
                    {ChatHistoryService.formatDate(selectedNewsletter.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditNewsletter(selectedNewsletter)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Edit Newsletter"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handlePreviewNewsletter(selectedNewsletter)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedNewsletter.message }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dates = Object.keys(groupedNewsletters).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const activeNewsletters = groupedNewsletters[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chat/newsletter')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back to chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Newsletters</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveTab(date)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === date
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{ChatHistoryService.formatDate(date)}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {groupedNewsletters[date].length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {activeNewsletters.map((newsletter, index) => (
            <div
              key={newsletter.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Newsletter #{activeNewsletters.length - index}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {ChatHistoryService.formatDate(newsletter.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNewsletter(newsletter)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                      title="Edit Newsletter"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handlePreviewNewsletter(newsletter)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Full Preview
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {getPreviewText(newsletter.message)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
