import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { AgentConfigService } from '../services/agentConfigService';
import { Mic, Upload, Send, File, X, ArrowLeft, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendToN8nWorkflow, generateRequestId, generateSessionId } from '../lib/n8nService';

export default function AgentSettings() {
  const { agentId } = useParams<{ agentId: string }>();
  const { userId } = useUser();
  const navigate = useNavigate();
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Knowledge base state
  const [currentText, setCurrentText] = useState('');
  const [voiceText, setVoiceText] = useState(''); // Separate state for voice input
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // File processing status tracking
  type FileStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  interface FileProcessingState {
    file: File;
    status: FileStatus;
    error?: string;
  }
  const [fileProcessingStates, setFileProcessingStates] = useState<FileProcessingState[]>([]);

  // Previously uploaded files from Supabase
  interface PreviousFile {
    file_id: string;
    file_name: string;
    file_url: string;
    created_at: string;
    agent_id: string;
  }
  const [previousFiles, setPreviousFiles] = useState<PreviousFile[]>([]);
  const [loadingPreviousFiles, setLoadingPreviousFiles] = useState(false);

  // Existing knowledge base data from backend API
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [existingInstructions, setExistingInstructions] = useState<string>('');
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [instructionsLoaded, setInstructionsLoaded] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '', isError: false });

  // Speech recognition
  const [recognition, setRecognition] = useState<any>(null);
  const accumulatedTextRef = useRef(''); // Store accumulated speech
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAgentConfig = async () => {
      if (!agentId) {
        setError('No agent ID provided');
        setLoading(false);
        return;
      }

      try {
        const configService = AgentConfigService.getInstance();
        const config = await configService.loadAgentConfig(agentId);
        
        if (config) {
          setAgentConfig(config);
          console.log(`${config.agent.name} config loaded for settings`);
        } else {
          setError(`Failed to load configuration for agent: ${agentId}`);
        }
      } catch (error) {
        console.error('Error loading agent config:', error);
        setError(`Error loading agent configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadAgentConfig();
  }, [agentId]);

  // Fetch previously uploaded files from Supabase
  const fetchPreviousFiles = async () => {
    if (!userId) return;
    
    setLoadingPreviousFiles(true);
    try {
      const { data, error } = await supabase
        .from('firm_users_knowledge_base')
        .select('file_id,file_name,file_url,created_at,agent_id')
        .eq('firm_user_id', userId);

      if (error) {
        console.error('Error fetching previous files:', error);
        return;
      }

      // Filter by current agent if agentId is available
      const filteredFiles = agentId 
        ? data?.filter(f => f.agent_id === agentId) || []
        : data || [];
      
      // Sort by created_at descending (newest first)
      const sortedFiles = filteredFiles.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setPreviousFiles(sortedFiles);
      console.log(`Loaded ${filteredFiles.length} previous files for agent ${agentId}`);
    } catch (error) {
      console.error('Error fetching previous files:', error);
    } finally {
      setLoadingPreviousFiles(false);
    }
  };

  // Load previous files when userId and agentId are available
  useEffect(() => {
    if (userId && agentId) {
      fetchPreviousFiles();
    }
  }, [userId, agentId]);

  // Load existing knowledge base data from Neon database via backend API
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!userId || !agentId) return;

      setLoadingExisting(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      try {
        // Fetch files from Neon database via backend API
        const filesResponse = await fetch(`${backendUrl}/api/knowledge-base/files/${userId}`);
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setExistingFiles(filesData.files || []);
        } else {
          console.error('Failed to fetch files:', await filesResponse.text());
          setExistingFiles([]);
        }

        // Fetch custom instructions from Neon database via backend API
        const instructionsResponse = await fetch(`${backendUrl}/api/knowledge-base/instructions/${userId}`);
        if (instructionsResponse.ok) {
          const instructionsData = await instructionsResponse.json();
          setExistingInstructions(instructionsData.instructions || '');
        } else {
          console.error('Failed to fetch instructions:', await instructionsResponse.text());
          setExistingInstructions('');
        }
      } catch (error) {
        console.error('Error fetching existing knowledge:', error);
        setExistingFiles([]);
        setExistingInstructions('');
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingData();
  }, [userId, agentId]);

  // Pre-fill textarea with existing custom instructions
  useEffect(() => {
    if (existingInstructions && !instructionsLoaded && !currentText) {
      setCurrentText(existingInstructions);
      setInstructionsLoaded(true);
    }
  }, [existingInstructions, instructionsLoaded, currentText]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-GB'; // UK English
      
      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Only process results from the last resultIndex to avoid duplicates
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update accumulated text with only NEW final results
        if (finalTranscript) {
          accumulatedTextRef.current = accumulatedTextRef.current + finalTranscript;
        }
        
        // Show accumulated + current interim (not all previous interim)
        const currentFullText = accumulatedTextRef.current + interimTranscript;
        setVoiceText(currentFullText);
        setCurrentText(currentFullText);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
        // Keep the accumulated text when recording ends
        setCurrentText(accumulatedTextRef.current);
        setVoiceText(accumulatedTextRef.current);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const handleStartRecording = () => {
    if (recognition) {
      // Store the current manually typed text before starting recording
      const existingText = currentText;
      accumulatedTextRef.current = existingText ? existingText + ' ' : '';
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const handleClearText = () => {
    setCurrentText('');
    setVoiceText('');
    accumulatedTextRef.current = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- COMMENTED OUT: handleDeletePreviousFile (firm_users_knowledge_base removed) ---

  const updateFileStatus = (index: number, status: FileStatus, error?: string) => {
    setFileProcessingStates(prev => {
      const newStates = [...prev];
      if (newStates[index]) {
        newStates[index] = { ...newStates[index], status, error };
      }
      return newStates;
    });
  };

  const handleSubmit = async () => {
    if (!userId || !agentId || (!currentText.trim() && uploadedFiles.length === 0)) {
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Handle text input — send to agent's config webhook with user_instruction format
      if (currentText.trim()) {
        // Use FK_RAG_SAVE for Personal Assistant, otherwise use agent's configured webhook
        const webhookUrl = agentId === 'personal_assistant' 
          ? 'https://n8n.theaiteam.uk/webhook/FK_RAG_SAVE'
          : agentConfig?.n8n?.webhook_url;
        
        if (webhookUrl) {
          console.log('🔍 AgentSettings DEBUG - Sending to webhook:', webhookUrl);
          try {
            const payload = {
              user_id: userId,
              user_instruction: currentText.trim(),
              file_url: '',
              session_id: generateSessionId(userId, agentId || ''),
              agent_name: agentId,
              timestamp_of_call_made: new Date().toISOString(),
              request_id: generateRequestId()
            };
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            console.log('Text instructions sent successfully with payload:', payload);
          } catch (err) {
            console.error('n8n config webhook error:', err);
          }
        }
      }

      // Initialize file processing states
      if (uploadedFiles.length > 0) {
        setFileProcessingStates(uploadedFiles.map(file => ({ file, status: 'pending' as FileStatus })));
      }

      // Process files one by one sequentially
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          // Step 1: Uploading to storage
          updateFileStatus(i, 'uploading');
          
          const timestamp = Date.now();
          const fileName = `${userId}_${timestamp}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('newsletter')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            updateFileStatus(i, 'failed', 'Failed to upload file to storage');
            failCount++;
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('newsletter')
            .getPublicUrl(fileName);

          // Call backend processing endpoint (same as chat interface)
          const formData = new FormData();
          formData.append('firm_user_id', userId);
          formData.append('file_name', file.name);
          formData.append('file_url', publicUrl);
          formData.append('agent_id', agentId || '');
          formData.append('agent_name', agentConfig?.agent?.name || '');

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
          try {
            const backendResponse = await fetch(`${backendUrl}/api/file/process`, {
              method: 'POST',
              body: formData
            });

            if (!backendResponse.ok) {
              const errorText = await backendResponse.text();
              console.error('Backend processing error:', errorText);
            } else {
              console.log('File record inserted via backend for:', file.name);
            }
          } catch (backendError) {
            console.error('Error calling backend processing:', backendError);
          }

          // Step 2: Processing - sending to n8n with user_instruction format
          updateFileStatus(i, 'processing');

          // Use FK_RAG_SAVE for Personal Assistant, otherwise use agent's configured webhook
          const fileWebhookUrl = agentId === 'personal_assistant' 
            ? 'https://n8n.theaiteam.uk/webhook/FK_RAG_SAVE'
            : agentConfig?.n8n?.webhook_url;
          
          if (fileWebhookUrl) {
            try {
              const payload = {
                user_id: userId,
                user_instruction: '',
                file_url: publicUrl,
                session_id: generateSessionId(userId, agentId || ''),
                agent_name: agentId,
                timestamp_of_call_made: new Date().toISOString(),
                request_id: generateRequestId()
              };
              const response = await fetch(fileWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              
              if (response.ok) {
                updateFileStatus(i, 'completed');
                successCount++;
                console.log(`File ${file.name} processed successfully with payload:`, payload);
              } else {
                updateFileStatus(i, 'failed', 'No response from processing service');
                failCount++;
              }
            } catch (err) {
              console.error('n8n config webhook error:', err);
              updateFileStatus(i, 'failed', 'Error sending to n8n');
              failCount++;
            }
          } else {
            updateFileStatus(i, 'failed', 'No webhook URL configured');
            failCount++;
          }
        } catch (error) {
          console.error('Failed to process file:', error);
          updateFileStatus(i, 'failed', error instanceof Error ? error.message : 'Unknown error');
          failCount++;
        }
      }

      // Clear text and voice state after all processing
      setCurrentText('');
      setVoiceText('');
      accumulatedTextRef.current = '';

      // Show appropriate toast based on results
      if (failCount === 0 && (successCount > 0 || currentText.trim())) {
        setToastMessage({
          title: 'All files processed successfully!',
          subtitle: `${successCount} file${successCount !== 1 ? 's' : ''} uploaded and processed.`,
          isError: false
        });
      } else if (successCount > 0 && failCount > 0) {
        setToastMessage({
          title: 'Some files failed to process',
          subtitle: `${successCount} succeeded, ${failCount} failed.`,
          isError: true
        });
      } else if (failCount > 0) {
        setToastMessage({
          title: 'Failed to process files',
          subtitle: 'Please try again.',
          isError: true
        });
      } else if (currentText.trim()) {
        setToastMessage({
          title: 'Instructions saved!',
          subtitle: 'Your custom instructions have been sent.',
          isError: false
        });
      }
      
      // Refresh the previous files list to show newly uploaded files
      if (successCount > 0) {
        await fetchPreviousFiles();
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Clear file states and uploaded files after toast disappears
        setFileProcessingStates([]);
        setUploadedFiles([]);
      }, 4000);

    } catch (error) {
      console.error('Error submitting knowledge:', error);
      setToastMessage({
        title: 'Error',
        subtitle: 'Something went wrong. Please try again.',
        isError: true
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Configuration Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/chat/${agentId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <img 
              src={agentConfig?.agent?.avatar || "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64"} 
              alt={agentConfig?.agent?.name || 'Agent'} 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Configurable Data
              </h1>
              <p className="text-sm text-gray-600">
                Add information to help your agent learn about your preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Figma Style Layout */}
      <div className="flex-1 bg-white">
        <div className="max-w-4xl mx-auto p-8">
          {/* Custom Instructions Section - Figma Style */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white mb-2">Add Custom Instructions</h2>
              <p className="text-purple-100">
                Share your knowledge with {agentConfig?.agent?.name} to get personalized assistance
              </p>
            </div>

            {/* Custom Instructions Area */}
            <div className="p-8">
              {/* Input Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Voice Input Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-4 mx-auto">
                    <Mic className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800 text-center mb-2">Voice Input</h3>
                  <p className="text-sm text-blue-600 text-center mb-4">
                    Speak naturally and we'll transcribe your words
                  </p>
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isRecording ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Stop Recording
                      </div>
                    ) : (
                      'Start Recording'
                    )}
                  </button>
                </div>

                {/* File Upload Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4 mx-auto">
                    <Upload className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 text-center mb-2">Upload Files</h3>
                  <p className="text-sm text-green-600 text-center mb-4">
                    PDF, TXT, DOCX, or Markdown files
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Choose Files
                  </button>
                </div>
              </div>

              {/* Live Content Display - Only show while recording or uploading files */}
              {((isRecording && voiceText) || uploadedFiles.length > 0) && (
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Content</h3>
                  
                  {/* Voice Content Only - Only show while recording */}
                  {isRecording && voiceText && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mic size={16} className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Recording in progress...
                          </span>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        <button
                          onClick={handleClearText}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-gray-800 leading-relaxed">{voiceText}</p>
                    </div>
                  )}

                  {/* Uploaded Files with Status */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {isUploading ? 'Processing Files:' : 'Selected Files:'}
                      </h4>
                      {uploadedFiles.map((file, index) => {
                        const fileState = fileProcessingStates[index];
                        const status = fileState?.status || 'pending';
                        
                        return (
                          <div key={index} className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                            status === 'completed' ? 'border-green-300 bg-green-50' :
                            status === 'failed' ? 'border-red-300 bg-red-50' :
                            status === 'uploading' || status === 'processing' ? 'border-blue-300 bg-blue-50' :
                            'border-gray-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              {/* Status Icon */}
                              {status === 'uploading' && (
                                <Loader size={20} className="text-blue-500 animate-spin" />
                              )}
                              {status === 'processing' && (
                                <Loader size={20} className="text-purple-500 animate-spin" />
                              )}
                              {status === 'completed' && (
                                <CheckCircle size={20} className="text-green-500" />
                              )}
                              {status === 'failed' && (
                                <AlertCircle size={20} className="text-red-500" />
                              )}
                              {status === 'pending' && (
                                <File size={20} className="text-gray-600" />
                              )}
                              
                              <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {status === 'uploading' && 'Uploading to storage...'}
                                  {status === 'processing' && 'Processing with AI...'}
                                  {status === 'completed' && 'Completed'}
                                  {status === 'failed' && (fileState?.error || 'Failed')}
                                  {status === 'pending' && (isUploading ? 'Pending...' : `${(file.size / 1024 / 1024).toFixed(2)} MB`)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Only show remove button when not processing */}
                            {!isUploading && (
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Main Text Input Area */}
              <div className="mb-6">
                <label htmlFor="content-textarea" className="block text-lg font-semibold text-gray-800 mb-3">
                  Custom Instructions
                </label>
                <textarea
                  id="content-textarea"
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Type your instructions here, or use voice input above. Your instructions will be saved and you can edit them anytime..."
                  className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-800 leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || (!currentText.trim() && uploadedFiles.length === 0)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Save
                    </>
                  )}
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.doc,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Previously Uploaded Files Section */}
          {(previousFiles.length > 0 || loadingPreviousFiles) && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4">
                <h2 className="text-xl font-bold text-white">Previously Uploaded Files</h2>
                <p className="text-blue-100 text-sm">Files you've shared with {agentConfig?.agent?.name}</p>
              </div>
              
              <div className="p-6">
                {loadingPreviousFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={24} className="text-blue-500 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading your files...</span>
                  </div>
                ) : previousFiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No files uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {previousFiles.map((file) => (
                      <div 
                        key={file.file_id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <File size={20} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{file.file_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded {new Date(file.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing Knowledge Base Section (from Backend API) */}
          {(existingFiles.length > 0 || loadingExisting) && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
                <h2 className="text-xl font-bold text-white">Existing Knowledge Base</h2>
                <p className="text-emerald-100 text-sm">Files stored in your knowledge base</p>
              </div>
              
              <div className="p-6">
                {loadingExisting ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={24} className="text-emerald-500 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading knowledge base...</span>
                  </div>
                ) : existingFiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No files in knowledge base yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {existingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <File size={20} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate mb-1">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            {file.file_url && (
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline mt-1 inline-block"
                              >
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 text-white rounded-xl shadow-2xl ${
            toastMessage.isError 
              ? 'bg-gradient-to-r from-red-500 to-orange-500' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            {toastMessage.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <div>
              <p className="font-semibold">{toastMessage.title}</p>
              <p className={`text-sm ${toastMessage.isError ? 'text-red-100' : 'text-green-100'}`}>
                {toastMessage.subtitle}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
