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
  Edit3
} from 'lucide-react';

export default function NewsletterEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newsletterContent, setNewsletterContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load content from localStorage or params on mount
  useEffect(() => {
    const storedContent = localStorage.getItem('newsletterEditorContent') || 
                         localStorage.getItem('newsletterContent') || 
                         localStorage.getItem('newsletter_html_for_editor') || 
                         localStorage.getItem('newsletter_html');
    
    if (storedContent) {
      setNewsletterContent(storedContent);
      // Clean up the specific editor content after loading
      localStorage.removeItem('newsletterEditorContent');
    } else {
      // Default template if no content
      setNewsletterContent(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Newsletter Title</h1>
          <p>Start editing your newsletter content here...</p>
        </div>
      `);
    }
  }, [searchParams]);

  // Update preview iframe
  useEffect(() => {
    if (iframeRef.current && isPreviewMode) {
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
                }
                * {
                  max-width: 100%;
                }
                img {
                  height: auto;
                  max-width: 100%;
                }
              </style>
            </head>
            <body>
              ${newsletterContent}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [newsletterContent, isPreviewMode]);

  // Editor command execution
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Save content
  const handleSave = () => {
    const content = editorRef.current?.innerHTML || '';
    setNewsletterContent(content);
    localStorage.setItem('edited_newsletter_html', content);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Newsletter Editor</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isPreviewMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              
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

              {/* Link and formatting */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={insertLink}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Insert link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <select
                  onChange={(e) => execCommand('formatBlock', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
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

      {/* Editor/Preview Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          {isPreviewMode ? (
            <iframe
              ref={iframeRef}
              className="w-full h-[600px] border-0 rounded-lg"
              title="Newsletter Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              className="p-8 min-h-[600px] focus:outline-none"
              dangerouslySetInnerHTML={{ __html: newsletterContent }}
              onInput={(e) => setNewsletterContent(e.currentTarget.innerHTML)}
              style={{ 
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                lineHeight: '1.8'
              }}
            />
          )}
        </div>
      </div>

      {/* Saved notification */}
      {isSaved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Newsletter saved!
        </div>
      )}
    </div>
  );
}