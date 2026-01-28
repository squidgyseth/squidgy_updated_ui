import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link2, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Save,
  Copy,
  Download,
  ArrowLeft,
  Eye,
  Edit3,
  Image,
  Trash2,
  Plus,
  FileText,
  FolderOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { newslettersApi, chatHistoryApi } from '../lib/supabase-api';
import type { Newsletter } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

export default function NewsletterEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newsletterContent, setNewsletterContent] = useState<string>('');
  const [newsletterTitle, setNewsletterTitle] = useState<string>('Untitled Newsletter');
  const [currentNewsletterId, setCurrentNewsletterId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
  const [showNewsletterList, setShowNewsletterList] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [callToActions, setCallToActions] = useState<{id: string, text: string, href: string, type: 'button' | 'link'}[]>([]);
  const { userId, isAuthenticated } = useUser();
  const editorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load newsletter data when user is ready
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Use userId from useUser hook (matches chat_history.user_id)
      loadNewsletters(userId);
      
      // Check if there's a specific newsletter ID in the URL
      const newsletterId = searchParams.get('id');
      const sessionId = searchParams.get('session_id');
      const chatHistoryId = searchParams.get('chat_history_id');
      
      if (newsletterId) {
        loadNewsletter(newsletterId);
      } else if (chatHistoryId) {
        // Load newsletter associated with specific chat message
        loadNewsletterByChatHistory(chatHistoryId);
      } else if (sessionId) {
        // Check if there's already a newsletter for this session
        checkSessionNewsletter(sessionId);
      } else {
        // Check for passed content from other pages (legacy support)
        const passedContent = localStorage.getItem('newsletterEditorContent') || 
                             localStorage.getItem('newsletterContent') || 
                             localStorage.getItem('newsletter_html_for_editor') || 
                             localStorage.getItem('newsletter_html');
        
        if (passedContent && passedContent !== '[object Object]') {
          setNewsletterContent(passedContent);
          setNewsletterTitle('Imported Newsletter');
          // Clean up the temporary editor content after loading
          localStorage.removeItem('newsletterEditorContent');
          localStorage.removeItem('newsletterContent');
          localStorage.removeItem('newsletter_html_for_editor');
          localStorage.removeItem('newsletter_html');
        } else {
          // Default template if no valid content
          setNewsletterContent(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>Newsletter Title</h1>
              <p>Start editing your newsletter content here...</p>
            </div>
          `);
        }
      }
    }
  }, [isAuthenticated, userId, searchParams]);

  // Initialize editor content only once when first loaded
  useEffect(() => {
    if (editorRef.current && newsletterContent && !hasBeenInitialized && !isPreviewMode) {
      editorRef.current.innerHTML = newsletterContent;
      setHasBeenInitialized(true);
      
      // Extract initial call-to-actions
      const ctas = extractCallToActions(newsletterContent);
      setCallToActions(ctas);
    }
  }, [newsletterContent, hasBeenInitialized, isPreviewMode]);

  // Update preview iframe
  useEffect(() => {
    if (iframeRef.current && isPreviewMode) {
      // Get current content from editor or state
      const currentContent = editorRef.current?.innerHTML || newsletterContent;
      
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 20px;
                  background: #fff;
                }
                * {
                  max-width: 100%;
                }
                img {
                  height: auto;
                  max-width: 100%;
                  display: block;
                  margin: 10px 0;
                }
                h1, h2, h3 {
                  margin-top: 20px;
                  margin-bottom: 10px;
                }
                p {
                  margin: 10px 0;
                }
              </style>
            </head>
            <body>
              ${currentContent}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [newsletterContent, isPreviewMode]);

  // Save and restore cursor position
  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        return sel.getRangeAt(0);
      }
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range && window.getSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  // Editor command execution
  const execCommand = (command: string, value?: string) => {
    const range = saveSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection(range);
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Insert image from URL
  const insertImageFromUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const range = saveSelection();
      insertImageAtPosition(url, range);
    }
  };

  // Insert image from file
  const insertImageFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection - Upload to Supabase
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const range = saveSelection();
      
      // Show loading state
      let loadingSpan: HTMLSpanElement | null = null;
      if (range) {
        loadingSpan = document.createElement('span');
        loadingSpan.textContent = '[Uploading image...]';
        loadingSpan.style.color = '#999';
        loadingSpan.className = 'newsletter-upload-loading'; // Add class for easy removal
        range.deleteContents();
        range.insertNode(loadingSpan);
      }
      
      try {
        // Upload to Supabase Storage (try existing bucket first)
        const fileName = `newsletter_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        let uploadResult = await supabase.storage
          .from('newsletter-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        let { data, error } = uploadResult;

        if (error) {
          // If bucket doesn't exist or RLS issue, try creating bucket
          if (error.message.includes('bucket') || error.message.includes('not found') || error.message.includes('row-level security')) {
            console.log('Creating newsletter-images bucket...');
            const { error: bucketError } = await supabase.storage.createBucket('newsletter-images', {
              public: true,
              allowedMimeTypes: ['image/*']
              // No file size limit
            });
            
            if (!bucketError) {
              // Try upload again
              const retryResult = await supabase.storage
                .from('newsletter-images')
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false
                });
              
              if (!retryResult.error) {
                const { data: { publicUrl } } = supabase.storage
                  .from('newsletter-images')
                  .getPublicUrl(fileName);
                
                if (loadingSpan) loadingSpan.remove();
                insertImageAtPosition(publicUrl, range);
                return;
              } else {
                throw retryResult.error;
              }
            } else {
              console.error('Failed to create bucket:', bucketError);
              throw new Error('Unable to create storage bucket. Please contact administrator.');
            }
          } else {
            throw error;
          }
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('newsletter-images')
            .getPublicUrl(fileName);
          
          if (loadingSpan) loadingSpan.remove();
          insertImageAtPosition(publicUrl, range);
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again or use an image URL instead.');
        
        // Remove loading text
        if (loadingSpan) {
          loadingSpan.remove();
        }
      }
    }
    // Reset file input
    event.target.value = '';
  };

  // Helper function to insert image at position
  const insertImageAtPosition = (imageUrl: string, range: Range | null) => {
    if (range) {
      // Remove any remaining loading text
      const loadingElements = document.querySelectorAll('.newsletter-upload-loading');
      loadingElements.forEach(el => el.remove());
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.alt = 'Newsletter image';
      
      range.deleteContents();
      range.insertNode(img);
      
      // Move cursor after the image
      const newRange = document.createRange();
      newRange.setStartAfter(img);
      newRange.collapse(true);
      restoreSelection(newRange);
      
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  // Insert image (shows options)
  const insertImage = () => {
    const choice = window.confirm('Click OK to upload a file, or Cancel to enter a URL');
    if (choice) {
      insertImageFromFile();
    } else {
      insertImageFromUrl();
    }
  };

  // Extract call-to-action elements from content
  const extractCallToActions = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const ctas: {id: string, text: string, href: string, type: 'button' | 'link'}[] = [];
    
    // Find all links with href attributes
    const links = doc.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const href = link.getAttribute('href') || '#';
      const text = link.textContent || '';
      
      // Button detection based on styling and CSS classes
      const style = link.getAttribute('style') || '';
      const isButton = style.includes('background-color') || 
                      style.includes('padding') ||
                      style.includes('border-radius') ||
                      style.includes('display: inline-block') ||
                      style.includes('text-decoration: none') ||
                      link.classList.contains('button') || 
                      link.classList.contains('btn') ||
                      link.classList.contains('cta') ||
                      link.classList.contains('call-to-action');
      
      ctas.push({
        id: `cta-${index}`,
        text: text.trim(),
        href: href,
        type: isButton ? 'button' : 'link'
      });
    });
    
    return ctas;
  };
  
  // Update call-to-action in content
  const updateCallToAction = (ctaId: string, newText: string, newHref: string) => {
    if (!editorRef.current) return;
    
    const index = parseInt(ctaId.split('-')[1]);
    const links = editorRef.current.querySelectorAll('a[href]');
    
    if (links[index]) {
      links[index].textContent = newText;
      links[index].setAttribute('href', newHref);
      
      // Update content state
      setNewsletterContent(editorRef.current.innerHTML);
      
      // Update CTA state
      setCallToActions(prev => prev.map(cta => 
        cta.id === ctaId 
          ? { ...cta, text: newText, href: newHref }
          : cta
      ));
    }
  };

  // Handle editor content changes
  const handleEditorInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setNewsletterContent(content);
      
      // Extract and update call-to-actions
      const ctas = extractCallToActions(content);
      setCallToActions(ctas);
    }
  };

  // Load newsletters for current user
  const loadNewsletters = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await newslettersApi.getByUserId(userId);
      if (error) {
        console.error('Failed to load newsletters:', error);
      } else {
        setNewsletters(data as Newsletter[]);
      }
    } catch (error) {
      console.error('Failed to load newsletters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific newsletter
  const loadNewsletter = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await newslettersApi.getById(id);
      if (error) {
        console.error('Failed to load newsletter:', error);
        alert('Failed to load newsletter');
      } else if (data) {
        const newsletter = data as Newsletter;
        setCurrentNewsletterId(newsletter.id);
        setNewsletterTitle(newsletter.title);
        setNewsletterContent(newsletter.content);
        
        // Load saved call-to-actions or extract from content
        if (newsletter.call_to_actions && Array.isArray(newsletter.call_to_actions)) {
          setCallToActions(newsletter.call_to_actions);
        } else {
          // Extract CTAs from content if not saved separately
          const extractedCtas = extractCallToActions(newsletter.content);
          setCallToActions(extractedCtas);
        }
      }
    } catch (error) {
      console.error('Failed to load newsletter:', error);
      alert('Failed to load newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  // Load newsletter content directly from chat history
  const loadNewsletterByChatHistory = async (chatHistoryId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading content from chat_history_id:', chatHistoryId);
      
      // First try to find existing newsletter in history_newsletters table
      const { data: existingNewsletter, error: newsletterError } = await newslettersApi.getByChatHistoryId(chatHistoryId);
      
      if (existingNewsletter && !newsletterError) {
        // Load existing newsletter
        console.log('Found existing newsletter');
        const newsletter = existingNewsletter as Newsletter;
        setCurrentNewsletterId(newsletter.id);
        setNewsletterTitle(newsletter.title);
        setNewsletterContent(newsletter.content);
        
        // Load saved call-to-actions or extract from content
        if (newsletter.call_to_actions && Array.isArray(newsletter.call_to_actions)) {
          setCallToActions(newsletter.call_to_actions);
        } else {
          // Extract CTAs from content if not saved separately
          const extractedCtas = extractCallToActions(newsletter.content);
          setCallToActions(extractedCtas);
        }
      } else {
        // Load original content from chat_history table
        console.log('Loading original content from chat_history table');
        const { data: chatMessage, error: chatError } = await chatHistoryApi.getById(chatHistoryId);
        
        if (chatMessage && !chatError) {
          console.log('Found chat message, loading content');
          setCurrentNewsletterId(null); // This will be a new newsletter
          
          // Generate newsletter title with number and date
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const newsletterNumber = Math.floor(Math.random() * 9999) + 1; // Random number 1-9999
          const generatedTitle = `Newsletter_${newsletterNumber}_${currentDate}`;
          
          setNewsletterTitle(generatedTitle);
          setNewsletterContent(chatMessage.message || '');
        } else {
          console.error('Failed to load chat message:', chatError);
          alert('Failed to load newsletter content');
        }
      }
    } catch (error) {
      console.error('Failed to load newsletter by chat history:', error);
      alert('Failed to load newsletter content');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if session already has a newsletter
  const checkSessionNewsletter = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await newslettersApi.getBySessionId(sessionId);
      if (error) {
        console.error('Failed to check session newsletter:', error);
      } else if (data && Array.isArray(data) && data.length > 0) {
        // Load the most recent newsletter for this session
        const newsletter = data[0] as Newsletter;
        setCurrentNewsletterId(newsletter.id);
        setNewsletterTitle(newsletter.title);
        setNewsletterContent(newsletter.content);
        
        // Load saved call-to-actions or extract from content
        if (newsletter.call_to_actions && Array.isArray(newsletter.call_to_actions)) {
          setCallToActions(newsletter.call_to_actions);
        } else {
          // Extract CTAs from content if not saved separately
          const extractedCtas = extractCallToActions(newsletter.content);
          setCallToActions(extractedCtas);
        }
      }
    } catch (error) {
      console.error('Failed to check session newsletter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to find matching chat history for newsletter content
  const findMatchingChatHistory = async (content: string) => {
    try {
      // Get recent chat history for this user
      const { data: chatHistory, error } = await chatHistoryApi.getByUserId(userId);
      if (error || !chatHistory) return null;
      
      // Look for newsletter agent messages that match the content
      const newsletterMessages = chatHistory.filter((msg: any) => 
        msg.agent_id === 'newsletter' && 
        msg.sender === 'Agent' &&
        msg.message && 
        msg.message.includes('html') // Newsletter content is HTML
      );
      
      // Find the best match by comparing content similarity
      for (const msg of newsletterMessages) {
        // Simple content matching - you could make this more sophisticated
        const msgContent = msg.message.replace(/\s+/g, ' ').toLowerCase();
        const currentContent = content.replace(/\s+/g, ' ').toLowerCase();
        
        // Check if significant portions match (at least 50% similar length and some key content)
        if (msgContent.length > 1000 && currentContent.length > 1000) {
          // Look for common newsletter indicators
          const commonElements = ['peritus learning', 'newsletter', 'training', 'learning'];
          const hasCommonElements = commonElements.some(element => 
            msgContent.includes(element) && currentContent.includes(element)
          );
          
          if (hasCommonElements) {
            return {
              session_id: msg.session_id,
              chat_history_id: msg.id,
              agent_id: msg.agent_id
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding matching chat history:', error);
      return null;
    }
  };

  // Save newsletter to database
  const handleSave = async () => {
    if (!isAuthenticated || !userId) {
      alert('Please log in to save newsletters');
      return;
    }

    const content = editorRef.current?.innerHTML || newsletterContent;
    
    if (typeof content === 'string' && content !== '[object Object]') {
      setNewsletterContent(content);
      setIsLoading(true);
      
      try {
        // Get URL parameters first
        let sessionId = searchParams.get('session_id');
        let chatHistoryId = searchParams.get('chat_history_id');
        let agentId = searchParams.get('agent_id');
        
        // If no URL parameters but we have content that might be from chat, try to find matching chat history
        if (!sessionId && !chatHistoryId && !agentId && content.length > 1000) {
          console.log('No URL parameters found, searching for matching chat history...');
          const matchingChat = await findMatchingChatHistory(content);
          if (matchingChat) {
            sessionId = matchingChat.session_id;
            chatHistoryId = matchingChat.chat_history_id;
            agentId = matchingChat.agent_id;
            console.log('Found matching chat history:', matchingChat);
            
            // Check if newsletter already exists for this exact combination
            const { data: existingNewsletter } = await newslettersApi.getByChatHistoryId(chatHistoryId);
            if (existingNewsletter) {
              console.log('Found existing newsletter for this chat history, updating instead of creating new');
              setCurrentNewsletterId(existingNewsletter.id);
              setNewsletterTitle(existingNewsletter.title);
            }
          }
        }
        
        const newsletterData = {
          user_id: userId, // Use userId from useUser hook (matches chat_history.user_id)
          title: newsletterTitle,
          content: content,
          call_to_actions: callToActions,
          updated_at: new Date().toISOString(),
          ...(sessionId && { session_id: sessionId }),
          ...(chatHistoryId && { chat_history_id: chatHistoryId }),
          agent_id: agentId || 'newsletter' // Default to 'newsletter' if no agent_id
        };
        
        console.log('Saving newsletter with data:', {
          session_id: sessionId,
          chat_history_id: chatHistoryId,
          agent_id: agentId,
          hasContent: !!content
        });

        let result;
        if (currentNewsletterId) {
          // Update existing newsletter (webhook triggers by default)
          result = await newslettersApi.updateById(currentNewsletterId, newsletterData);
        } else if (sessionId || chatHistoryId) {
          // Use smart upsert based on user_id + session_id + chat_history_id combination (webhook triggers by default)
          result = await newslettersApi.upsertByChat(newsletterData);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            setCurrentNewsletterId(result.data[0].id);
          } else if (result.data && result.data.id) {
            setCurrentNewsletterId(result.data.id);
          }
        } else {
          // Create new newsletter (no chat context) (webhook triggers by default)
          newsletterData.created_at = new Date().toISOString();
          result = await newslettersApi.create(newsletterData);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            setCurrentNewsletterId(result.data[0].id);
          } else if (result.data && result.data.id) {
            setCurrentNewsletterId(result.data.id);
          }
        }
        
        if (result.error) {
          console.error('Save error:', result.error);
          alert('Failed to save newsletter. Please try again.');
        } else {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
          // Reload newsletters list
          loadNewsletters(userId);
          console.log('Newsletter saved successfully');
        }
      } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save newsletter. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error('Invalid content format, cannot save');
    }
  };

  // Create new newsletter
  const createNewNewsletter = () => {
    setCurrentNewsletterId(null);
    setNewsletterTitle('Untitled Newsletter');
    setNewsletterContent(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Newsletter Title</h1>
        <p>Start editing your newsletter content here...</p>
      </div>
    `);
    setHasBeenInitialized(false);
    setShowNewsletterList(false);
  };

  // Delete newsletter
  const deleteNewsletter = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this newsletter?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await newslettersApi.deleteById(id);
      if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete newsletter');
      } else {
        // If we deleted the currently open newsletter, create a new one
        if (currentNewsletterId === id) {
          createNewNewsletter();
        }
        // Reload newsletters list
        if (userId) {
          loadNewsletters(userId);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  // Add keyboard shortcut for save (Ctrl+S or Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [newsletterContent]);

  // Copy HTML
  const handleCopy = () => {
    const content = editorRef.current?.innerHTML || newsletterContent;
    navigator.clipboard.writeText(content);
  };

  // Download HTML
  const handleDownload = () => {
    const content = editorRef.current?.innerHTML || newsletterContent;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">Newsletter Editor</h1>
                {currentNewsletterId && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Saved
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
                  placeholder="Newsletter title..."
                />
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy HTML"
              >
                <Copy className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download HTML"
              >
                <Download className="w-5 h-5" />
              </button>
              
              {currentNewsletterId && (
                <button
                  onClick={() => deleteNewsletter(currentNewsletterId)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
                  title="Delete current newsletter"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Formatting Toolbar */}
      {!isPreviewMode && (
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Text formatting */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => execCommand('bold')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('italic')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('underline')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => execCommand('insertUnorderedList')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Bullet list"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('insertOrderedList')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Numbered list"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => execCommand('justifyLeft')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Align left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('justifyCenter')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Align center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('justifyRight')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Align right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('justifyFull')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>

              {/* Link, Image and formatting */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={insertLink}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Insert link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={insertImage}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Insert image"
                >
                  <Image className="w-4 h-4" />
                </button>
                <select
                  onChange={(e) => execCommand('formatBlock', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm h-8"
                  defaultValue=""
                >
                  <option value="" disabled>Format</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="p">Paragraph</option>
                </select>
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => execCommand('undo')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand('redo')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter List Modal */}
      {showNewsletterList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Newsletters</h2>
              <button
                onClick={() => setShowNewsletterList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading newsletters...</p>
              </div>
            ) : newsletters.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">No newsletters yet. Create your first one!</p>
                <button
                  onClick={() => {
                    createNewNewsletter();
                    setShowNewsletterList(false);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Newsletter
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {newsletters.map((newsletter) => (
                  <div
                    key={newsletter.id}
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      currentNewsletterId === newsletter.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      loadNewsletter(newsletter.id);
                      setShowNewsletterList(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{newsletter.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-600">
                            Created: {new Date(newsletter.created_at).toLocaleDateString()}
                          </p>
                          {newsletter.session_id && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Session: {newsletter.session_id.substring(0, 8)}...
                            </span>
                          )}
                          {newsletter.agent_id && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Agent: {newsletter.agent_id}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Updated: {new Date(newsletter.updated_at).toLocaleDateString()}
                        </p>
                        {newsletter.chat_history_id && (
                          <p className="text-xs text-gray-500 mt-1">
                            From chat message: {newsletter.chat_history_id.substring(0, 8)}...
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {newsletter.content.length > 100
                            ? newsletter.content.substring(0, 100).replace(/<[^>]*>/g, '') + '...'
                            : newsletter.content.replace(/<[^>]*>/g, '')
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {currentNewsletterId === newsletter.id && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNewsletter(newsletter.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete newsletter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Editor Area (reduced width) */}
          <div className="flex-1 max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                  </div>
                </div>
              )}
              {isPreviewMode ? (
                <iframe
                  ref={iframeRef}
                  className="w-full h-[600px] border-0 rounded-lg"
                  title="Newsletter Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <>
                  <div
                    ref={editorRef}
                    contentEditable
                    className="p-8 min-h-[600px] focus:outline-none"
                    onInput={handleEditorInput}
                    suppressContentEditableWarning={true}
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      lineHeight: '1.8'
                    }}
                  />
                  {/* Hidden file input for image uploads */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Call-to-Action Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Call-to-Action Editor
              </h3>
              
              {callToActions.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No links or buttons found</p>
                  <p className="text-gray-400 text-xs mt-1">Add links to your newsletter to edit them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callToActions.map((cta) => (
                    <div key={cta.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          cta.type === 'button' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {cta.type === 'button' ? 'Button' : 'Link'}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Text
                          </label>
                          <input
                            type="text"
                            value={cta.text}
                            onChange={(e) => updateCallToAction(cta.id, e.target.value, cta.href)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Button/Link text"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={cta.href}
                            onChange={(e) => updateCallToAction(cta.id, cta.text, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 Tip: Changes are applied automatically as you type
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved notification */}
      {isSaved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Newsletter saved successfully! (Ctrl+S to save anytime)
        </div>
      )}
    </div>
  );
}
