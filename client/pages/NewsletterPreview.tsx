import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';

export default function NewsletterPreview() {
  const navigate = useNavigate();
  const [newsletterContent, setNewsletterContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsletterContent();
  }, []);

  const loadNewsletterContent = () => {
    try {
      const storedContent = localStorage.getItem('newsletterPreview');
      if (storedContent) {
        setNewsletterContent(storedContent);
      } else {
        console.warn('No newsletter content found in localStorage');
      }
    } catch (error) {
      console.error('Error loading newsletter content:', error);
    } finally {
      setLoading(false);
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

  if (!newsletterContent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Newsletter Preview</h1>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Newsletter Content</h2>
            <p className="text-gray-500">No newsletter content was found to preview.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Close current tab and go back to historical newsletters
                  window.close();
                  // Fallback if window.close() doesn't work
                  navigate('/historical-newsletters');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Newsletter Preview</h1>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Save content to localStorage for editor
                  localStorage.setItem('newsletterEditorContent', newsletterContent);
                  // Navigate to newsletter editor
                  navigate('/newsletter-editor');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Edit Newsletter"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  // Open in new window for full preview
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(newsletterContent);
                    newWindow.document.close();
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Full Preview
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Newsletter Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Newsletter iframe for safe rendering */}
          <iframe
            srcDoc={newsletterContent}
            className="w-full h-screen border-0"
            title="Newsletter Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
