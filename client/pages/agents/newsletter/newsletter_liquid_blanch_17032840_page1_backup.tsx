import React, { useState, useRef } from 'react';
import { useUser } from '../../../hooks/useUser';
import { sendToN8nWorkflow } from '../../../lib/n8nService';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

// Initialize Supabase client using Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are not set. Please check your .env file.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default function NewsletterNewsletterLiquidBlanch17032840Page1() {
  const { userId, sessionId } = useUser();
  
  // Get agent configuration
  const agentService = AgentConfigService.getInstance();
  const [agentConfig, setAgentConfig] = useState(null);
  
  React.useEffect(() => {
    // For now, use mock config directly until API is fully set up
    // This ensures we show the correct Newsletter Agent details
    const agentId = 'newsletter';
    const config = agentService.getMockAgentConfig(agentId);
    
    if (config) {
      setAgentConfig(config);
      console.log('Newsletter agent config loaded:', config.agent.name);
    } else {
      console.error('Failed to load newsletter agent config');
    }
  }, []);
  
  // Chat handlers
  const handleSendMessage = async (message: string) => {
    setIsGenerating(true);
    
    try {
      console.log('Sending newsletter request:', message);
      
      // Send to N8n workflow
      await sendToN8nWorkflow(userId, JSON.stringify({
        content: message,
        type: 'newsletter_generation'
      }), 'newsletter', sessionId, {});
      
      console.log('Newsletter generation request sent');
      
    } catch (error) {
      console.error('Failed to send newsletter request:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Suggestion clicked:', suggestion);
    // Handle suggestion click - could auto-send or populate input
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please type your content manually.');
      return;
    }

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Store the starting message content
    startingMessageRef.current = message;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
      console.log('Speech recognition started - continuous mode');
      setIsRecording(true);
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      
      // Build transcripts from scratch each time to avoid duplication
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the accumulated final transcript
      finalTranscript = newFinalTranscript;
      
      // Combine starting message + all final transcript + current interim
      const baseMessage = startingMessageRef.current;
      const separator = (baseMessage && !baseMessage.endsWith(' ') && finalTranscript) ? ' ' : '';
      const interimIndicator = interimTranscript ? ' [speaking...]' : '';
      
      const newMessage = baseMessage + separator + finalTranscript + interimTranscript + interimIndicator;
      
      setMessage(newMessage);
      
      console.log('Speech recognition result:', { 
        final: finalTranscript, 
        interim: interimTranscript,
        base: baseMessage
      });
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      // Clean up interim markers and finalize the transcript
      setMessage(prev => {
        const cleaned = prev.replace(/\s*\[.*?\]\s*$/, '');
        return cleaned.trim();
      });
    };
    
    recognition.start();
  };

  const handleFileUpload = async (event) => {
    console.log('=== PDF UPLOAD PROCESS STARTED ===');
    console.log('File upload triggered');
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    if (file.type !== 'application/pdf') {
      const errorMsg = `Invalid file type: ${file.type}. Please upload a PDF file only.`;
      alert(errorMsg);
      console.log(errorMsg);
      return;
    }

    console.log('File validation passed. Starting upload process...');
    setIsUploading(true);
    
    try {
      // Check Supabase connection
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      // Generate unique file name
      const fileName = `${userId || 'anonymous'}_${Date.now()}_${file.name}`;
      console.log('Generated filename:', fileName);
      
      // Upload to Supabase Storage bucket 'newsletter'
      console.log('Uploading to Supabase...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('newsletter')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          alert('Upload failed due to security settings. Please check that the Supabase storage bucket is properly configured for public access.');
          console.error('RLS Error - Storage bucket may need configuration. Check database schema.');
        } else {
          alert(`Failed to upload file: ${uploadError.message}`);
        }
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('newsletter')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      setUploadedFile(file);
      setUploadedFileUrl(publicUrl);
      console.log('PDF uploaded successfully:', fileName);
      alert('PDF uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = async () => {
    if (uploadedFileUrl) {
      // Extract file name from URL for deletion
      const fileName = uploadedFileUrl.split('/').pop();
      
      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('newsletter')
        .remove([fileName]);
      
      if (error) console.error('Delete error:', error);
    }
    
    setUploadedFile(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    
    try {
      // Create project in Supabase database
      const { data: project, error: dbError } = await supabase
        .from('newsletter_projects')
        .insert({
          firm_user_id: userId || 'anonymous',
          session_id: sessionId,
          content: message,
          uploaded_file_name: uploadedFile?.name || null,
          uploaded_file_url: uploadedFileUrl,
          uploaded_file_size: uploadedFile?.size || null,
          generation_instructions: instructions,
          status: 'generating',
          generation_model: 'gpt-4'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        alert('Failed to save project. Please try again.');
        return;
      }

      setProjectId(project.id);
      
      // Send to N8n workflow with project ID
      const payload = {
        projectId: project.id,
        content: message,
        instructions: instructions,
        uploadedFileUrl: uploadedFileUrl,
        fileName: uploadedFile?.name || null
      };
      
      await sendToN8nWorkflow(userId, JSON.stringify(payload), 'newsletter', sessionId, {});
      
      // Update status to completed (in real app, this would be done by webhook)
      setTimeout(async () => {
        await supabase
          .from('newsletter_projects')
          .update({ 
            status: 'completed',
            generated_at: new Date().toISOString()
          })
          .eq('id', project.id);
      }, 3000);
      
      alert('Newsletter generation started! Check back in a few moments.');
      
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to generate newsletter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // If agent config is not loaded yet, show loading
  if (!agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  const handlePinToggle = (agentId: string, pinned: boolean) => {
    console.log(`Agent ${agentId} pin toggled to: ${pinned}`);
  };

  const handleSettingsClick = (agentId: string) => {
    console.log(`Settings clicked for agent: ${agentId}`);
  };

  return (
    <UniversalChatLayout 
      agent={agentConfig.agent}
      onPinToggle={handlePinToggle}
      onSettingsClick={handleSettingsClick}
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">{/* Center content with max width */}
          <h1 className="text-center text-2xl font-bold mb-4">Newsletter Content Creator</h1>
          <p className="text-center mb-8">Input your content and generate professional newsletters</p>
      
      {/* Full Width Content Input Section */}
      <div className="w-full p-6 border border-gray-200 rounded-lg bg-white shadow-sm mb-8">
        <h2 className="font-semibold text-lg mb-2">Content Input</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your newsletter content or upload a PDF document</p>
        
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg mb-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Start typing your newsletter content here, or use the microphone to speak..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleMicClick}
            className={`p-3 rounded-full transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg' 
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
            }`}
            title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
          >
            <Mic size={20} />
          </button>
          
          {isRecording && (
            <span className="text-red-500 text-sm font-medium animate-pulse">
              🔴 Recording... Click mic to stop
            </span>
          )}
          
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="pdf-upload"
              className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
              }`}
            >
              <Upload size={18} />
              <span className="font-medium">{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
            </label>
          </div>
        </div>
        
        {uploadedFile && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="text-green-600 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                <p className="text-xs text-green-600">
                  {(uploadedFile.size / 1024).toFixed(2)} KB • Successfully uploaded to Supabase
                </p>
              </div>
            </div>
            <button 
              onClick={removeUploadedFile}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
      
      {/* Hidden Project Instructions - Still functional but not visible in UI */}
      <textarea
        className="hidden"
        value={instructions}
        readOnly
      />

      <div className="mt-8">
        <h2 className="font-semibold mb-2">Newsletter Preview</h2>
        <p className="mb-4">See how your newsletter will look based on your content and instructions</p>
        <div className="bg-black text-white p-6 rounded-lg">
          <h3 className="text-lg font-bold">Your Newsletter</h3>
          <p className="text-gray-300">Subject: Your Newsletter Subject</p>
          
          <div className="mt-4 border-t border-gray-700 pt-4">
            <p className="text-lg">Welcome to Your Newsletter</p>
            <p className="mt-3 text-gray-200">• Add your content to see the preview</p>
            <p className="mt-2 text-gray-200">• Your newsletter content will appear here</p>
            <p className="mt-2 text-gray-200">• Dynamic content based on your input</p>
          </div>
          
          <button className="mt-6 px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-100 transition">
            Learn More
          </button>
          
          <div className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-300 mb-3">Thank you for reading!</p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-blue-400 hover:text-blue-300 transition">Website</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition">Twitter</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          className={`flex items-center space-x-2 px-8 py-4 rounded-lg font-semibold text-lg transition ${
            isGenerating 
              ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
              : (!message && !uploadedFile)
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
          onClick={handleSubmit}
          disabled={isGenerating || (!message && !uploadedFile)}
        >
          <Send size={24} />
          <span>{isGenerating ? 'Generating...' : 'Generate Newsletter'}</span>
        </button>
      </div>
      
          {(!message && !uploadedFile) && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Please enter content or upload a PDF to enable newsletter generation
              </p>
            </div>
          )}
        </div>
      </div>
    </UniversalChatLayout>
  );
}