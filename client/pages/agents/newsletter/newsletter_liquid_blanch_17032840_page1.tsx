import React, { useState, useRef } from 'react';
import { Send, Mic, Upload, FileText, X } from 'lucide-react';
import { useUser } from '../../../hooks/useUser';
import { sendToN8nWorkflow } from '../../../lib/n8nService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are not set. Please check your .env file.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default function NewsletterNewsletterLiquidBlanch17032840Page1() {
  const { userId, sessionId } = useUser();
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const startingMessageRef = useRef('');
  const [instructions, setInstructions] = useState(`Newsletter Generation Instructions:

1. Tone & Style:
   - Keep a professional yet friendly tone
   - Use clear, concise language
   - Include engaging subject lines

2. Content Structure:
   - Start with a compelling headline
   - Include 3-5 main sections
   - Add a call-to-action at the end
   - Include social media links

3. Design Preferences:
   - Use consistent branding colors
   - Include relevant images
   - Maintain mobile-friendly formatting
   - Use bullet points for easy scanning

4. Target Audience:
   - Primary: Business professionals
   - Secondary: Industry stakeholders
   - Focus on value-driven content

5. Additional Notes:
   - Keep newsletter length under 800 words
   - Include data/statistics when relevant
   - Proofread for grammar and spelling`);

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
          user_id: userId || 'anonymous',
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

  return (
    <div className="h-full bg-white overflow-y-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-4">Newsletter Content Creator</h1>
      <p className="text-center mb-8">Input your content and customize your newsletter generation instructions</p>
      
      <div className="flex space-x-4">
        <div className="w-1/2 p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Content Input</h2>
          <p className="mb-4">Type your content or click the microphone to speak</p>
          <textarea
            className="w-full h-32 p-2 border rounded mb-4"
            placeholder="Start typing your newsletter content here, or use the microphone to speak..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center space-x-2 mb-4">
            <button 
              onClick={handleMicClick}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
            >
              <Mic size={16} />
            </button>
            {isRecording && (
              <span className="text-red-500 text-sm animate-pulse">
                🔴 Recording... Click mic to stop
              </span>
            )}
            <div className="flex-1">
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
                className={`flex items-center justify-center space-x-2 p-2 rounded-lg cursor-pointer transition ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Upload size={16} />
                <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
              </label>
            </div>
          </div>
          {uploadedFile && (
            <div className="p-3 bg-green-50 border border-green-300 rounded mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                  <p className="text-xs text-green-600">
                    {(uploadedFile.size / 1024).toFixed(2)} KB • Uploaded to Supabase
                  </p>
                </div>
              </div>
              <button 
                onClick={removeUploadedFile}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="w-1/2 p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Project Instructions</h2>
          <p className="text-sm text-gray-600 mb-4">Customize how your newsletter should be generated</p>
          <div>
            <label className="block text-sm font-medium mb-2">Generation Instructions</label>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter your custom generation instructions..."
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-2">Newsletter Preview</h2>
        <p className="mb-4">See how your newsletter will look based on your content and instructions</p>
        <div className="bg-black text-white p-4 rounded-lg mb-4">
          <h3 className="text-lg font-bold">Your Newsletter</h3>
          <p>Subject: Your Newsletter Subject</p>
          <p className="mt-4">Welcome to Your Newsletter</p>
          <p className="mt-2">• Add your content to see the preview</p>
          <button className="mt-4 p-2 bg-white text-black rounded">Learn More</button>
        </div>
        <p className="text-center">Thank you for reading!</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="#" className="text-blue-500">Website</a>
          <a href="#" className="text-blue-500">Twitter</a>
          <a href="#" className="text-blue-500">LinkedIn</a>
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
  );
}