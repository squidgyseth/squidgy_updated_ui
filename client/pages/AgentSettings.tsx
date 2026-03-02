import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { AgentConfigService } from '../services/agentConfigService';
import { Mic, Upload, Send, File, X, ArrowLeft, Trash2, FileText, Loader2, CheckCircle, Loader, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PreviousFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  processing_status?: string;
  file_type?: 'document' | 'image';
  has_neon_records?: boolean;
}

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

  // File processing status tracking (from dev branch)
  type FileStatus = 'pending' | 'uploading' | 'extracting' | 'embedding' | 'saving' | 'completed' | 'failed';
  interface FileProcessingState {
    file: File;
    fileId?: string;
    status: FileStatus;
    message?: string;
    progress?: number;
    error?: string;
  }
  const [fileProcessingStates, setFileProcessingStates] = useState<FileProcessingState[]>([]);
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());

  // Previously uploaded files state - Neon (analysed) files
  const [previousFiles, setPreviousFiles] = useState<PreviousFile[]>([]);
  const [loadingPreviousFiles, setLoadingPreviousFiles] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [activeFileTab, setActiveFileTab] = useState<'documents' | 'images'>('documents');

  // Toast message state (from dev branch)
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '', isError: false });

  // Custom instructions state - track existing record for updates
  const [customInstructionsFileId, setCustomInstructionsFileId] = useState<string | null>(null);
  const [loadingCustomInstructions, setLoadingCustomInstructions] = useState(true);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);

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

  // Function to fetch existing custom instructions (text input) from Neon via backend API
  const fetchCustomInstructions = async () => {
    if (!userId || !agentId) {
      setLoadingCustomInstructions(false);
      return;
    }

    try {
      setLoadingCustomInstructions(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/knowledge-base/instructions/${userId}/${agentId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.file_id && data.instructions) {
          setCustomInstructionsFileId(data.file_id);
          setCurrentText(data.instructions);
        }
      } else {
      }
    } catch (error) {
      console.error('Error fetching custom instructions:', error);
    } finally {
      setLoadingCustomInstructions(false);
    }
  };

  // Function to fetch previously uploaded files from BOTH Supabase and Neon (unified view)
  const fetchPreviousFiles = async (showLoading = true) => {
    if (!userId || !agentId) {
      setLoadingPreviousFiles(false);
      return;
    }

    try {
      if (showLoading) setLoadingPreviousFiles(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Use unified endpoint that fetches from both Supabase (chat uploads) and Neon (agent settings uploads)
      const response = await fetch(`${backendUrl}/api/files/unified/${userId}/${agentId}`);

      if (response.ok) {
        const data = await response.json();
        setPreviousFiles(data.files || []);
      } else {
        console.error('Failed to fetch previous files');
        setPreviousFiles([]);
      }
    } catch (error) {
      console.error('Error fetching previous files:', error);
      setPreviousFiles([]);
    } finally {
      setLoadingPreviousFiles(false);
    }
  };

  // Fetch custom instructions and files on mount
  useEffect(() => {
    fetchCustomInstructions();
    fetchPreviousFiles();
  }, [userId, agentId]);

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
    if (files.length === 0) return;
    
    // Check for duplicates against previously uploaded files
    const duplicates: File[] = [];
    const newFiles: File[] = [];
    
    files.forEach(file => {
      const isDuplicate = previousFiles.some(
        prevFile => prevFile.file_name.toLowerCase() === file.name.toLowerCase()
      );
      if (isDuplicate) {
        duplicates.push(file);
      } else {
        newFiles.push(file);
      }
    });
    
    // Handle duplicates with confirmation
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(f => f.name).join(', ');
      const confirmReplace = window.confirm(
        `The following file(s) already exist:\n${duplicateNames}\n\nDo you want to replace them? The old version will be deleted.`
      );
      
      if (confirmReplace) {
        // Delete old files first, then add all files
        duplicates.forEach(async (file) => {
          const existingFile = previousFiles.find(
            pf => pf.file_name.toLowerCase() === file.name.toLowerCase()
          );
          if (existingFile) {
            await handleDeletePreviousFile(existingFile.id, existingFile.file_url);
          }
        });
        setUploadedFiles(prev => [...prev, ...newFiles, ...duplicates]);
      } else {
        // Only add non-duplicate files
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } else {
      setUploadedFiles(prev => [...prev, ...files]);
    }
    
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Delete previously uploaded file via backend API
  // Helper function to update file processing status (from dev branch)
  const updateFileStatus = (index: number, status: FileStatus, message?: string, progress?: number, error?: string) => {
    setFileProcessingStates(prev => {
      const newStates = [...prev];
      if (newStates[index]) {
        newStates[index] = { ...newStates[index], status, message, progress, error };
      }
      return newStates;
    });
  };

  // Subscribe to SSE for file processing status updates
  const subscribeToFileStatus = (fileId: string, fileIndex: number) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const eventSource = new EventSource(`${backendUrl}/api/file/status-stream/${fileId}`);
    
    eventSourcesRef.current.set(fileId, eventSource);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const status = data.status as FileStatus;
        updateFileStatus(fileIndex, status, data.message, data.progress);
        
        // Close connection when completed or failed
        if (status === 'completed' || status === 'failed') {
          eventSource.close();
          eventSourcesRef.current.delete(fileId);
          
          // Refresh files list on completion
          if (status === 'completed') {
            fetchPreviousFiles(false);
          }
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = () => {
      console.error('SSE connection error for file:', fileId);
      eventSource.close();
      eventSourcesRef.current.delete(fileId);
    };
  };

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current.clear();
    };
  }, []);

  const handleDeletePreviousFile = async (fileId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    setDeletingFileId(fileId);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Delete from Neon database and Supabase storage via backend API
      const response = await fetch(`${backendUrl}/api/knowledge-base/file/${fileId}`, {
        method: 'DELETE'
      });

      // Handle 404 as success - file already deleted
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Backend delete failed:', errorText);
        throw new Error('Failed to delete file from database');
      }

      if (response.status === 404) {
      }

      // Update local state - remove from list regardless
      setPreviousFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      // Still remove from local state and refresh list
      setPreviousFiles(prev => prev.filter(file => file.id !== fileId));
      fetchPreviousFiles(false);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !agentId || (!currentText.trim() && uploadedFiles.length === 0)) {
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let totalOperations = 0;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Handle text input - UPDATE if exists, INSERT if new
      if (currentText.trim()) {
        totalOperations++;
        try {
          if (customInstructionsFileId) {
            // UPDATE existing custom instructions
            const response = await fetch(`${backendUrl}/api/knowledge-base/instructions/${customInstructionsFileId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                agent_id: agentId,
                instructions: currentText.trim()
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              console.error('Failed to update custom instructions');
            }
          } else {
            // INSERT new custom instructions
            const response = await fetch(`${backendUrl}/api/knowledge-base/instructions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                agent_id: agentId,
                agent_name: agentConfig?.agent?.name || 'Unknown Agent',
                instructions: currentText.trim()
              })
            });

            if (response.ok) {
              const result = await response.json();
              setCustomInstructionsFileId(result.id || result.file_id);
              successCount++;
            } else {
              console.error('Failed to create custom instructions');
            }
          }
        } catch (error) {
          console.error('Failed to save text knowledge:', error);
        }
      }

      // Handle file uploads with SSE status tracking - ALL FILES IN PARALLEL
      if (uploadedFiles.length > 0) {
        totalOperations += uploadedFiles.length;
        
        // Capture files before clearing state
        const filesToUpload = [...uploadedFiles];
        
        // Initialize file processing states for all files
        const initialStates: FileProcessingState[] = filesToUpload.map(file => ({
          file,
          status: 'uploading' as FileStatus,
          message: 'Uploading file...',
          progress: 5
        }));
        setFileProcessingStates(initialStates);
        
        // Clear uploaded files immediately so they don't show twice
        setUploadedFiles([]);

        // Upload all files in parallel using Promise.all
        const uploadPromises = filesToUpload.map(async (file, i) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', userId);
            formData.append('agent_id', agentId || '');
            formData.append('agent_name', agentConfig?.agent?.name || 'Unknown Agent');

            const response = await fetch(`${backendUrl}/api/knowledge-base/file`, {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const result = await response.json();
              
              // Update state with file ID (backend returns 'id' now)
              const fileId = result.id || result.file_id;
              setFileProcessingStates(prev => {
                const newStates = [...prev];
                if (newStates[i]) {
                  newStates[i] = { ...newStates[i], fileId: fileId, status: 'extracting', message: 'Processing started...', progress: 10 };
                }
                return newStates;
              });
              
              // Subscribe to SSE for real-time status updates
              subscribeToFileStatus(fileId, i);
              return true;
            } else {
              const errorText = await response.text();
              console.error('Failed to upload file:', errorText);
              updateFileStatus(i, 'failed', 'Upload failed', 0, errorText);
              return false;
            }
          } catch (error) {
            console.error('Failed to upload file:', error);
            updateFileStatus(i, 'failed', 'Upload failed', 0, String(error));
            return false;
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        successCount += results.filter(Boolean).length;
      }

      // Show success/error feedback
      if (successCount === totalOperations) {

        // Clear voice state (but keep currentText - it's the persistent custom instructions)
        setVoiceText('');
        accumulatedTextRef.current = '';
      } else if (totalOperations > 0) {
        console.error(`Only ${successCount}/${totalOperations} operations succeeded`);
      }

    } catch (error) {
      console.error('Error submitting knowledge:', error);
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
      <div className="flex-1 bg-white overflow-y-auto">
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

              {/* Live Content Display - Only show while recording, uploading, or processing files */}
              {((isRecording && voiceText) || uploadedFiles.length > 0 || fileProcessingStates.length > 0) && (
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

                  {/* Uploaded Files with inline status */}
                  {(uploadedFiles.length > 0 || fileProcessingStates.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                      {/* Show files being processed */}
                      {fileProcessingStates.map((state, index) => (
                        <div key={`processing-${index}`} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File size={20} className="text-gray-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{state.file.name}</p>
                                <p className="text-xs text-gray-500">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {state.status === 'completed' && <CheckCircle size={18} className="text-green-500" />}
                              {state.status === 'failed' && <X size={18} className="text-red-500" />}
                              {!['completed', 'failed'].includes(state.status) && (
                                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                              )}
                            </div>
                          </div>
                          {/* Progress bar and status message */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  state.status === 'completed' ? 'bg-green-500' : 
                                  state.status === 'failed' ? 'bg-red-500' : 'bg-purple-500'
                                }`}
                                style={{ width: `${state.progress || 0}%` }}
                              />
                            </div>
                            <p className={`text-xs mt-1 ${state.status === 'failed' ? 'text-red-500' : 'text-gray-500'}`}>
                              {state.message || state.status}
                            </p>
                          </div>
                        </div>
                      ))}
                      {/* Show files not yet submitted */}
                      {uploadedFiles.map((file, index) => (
                        <div key={`pending-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <File size={20} className="text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main Text Input Area */}
              <div className="mb-6">
                <label htmlFor="content-textarea" className="block text-lg font-semibold text-gray-800 mb-3">
                  Custom Instructions
                </label>
                {loadingCustomInstructions ? (
                  <div className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-400 mr-2" size={20} />
                    <span className="text-gray-500">Loading your instructions...</span>
                  </div>
                ) : (
                  <textarea
                    id="content-textarea"
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder="Type your instructions here, or use voice input above. Your instructions will be saved and you can edit them anytime..."
                    disabled={fileProcessingStates.some(s => !['completed', 'failed'].includes(s.status))}
                    className={`w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-800 leading-relaxed ${
                      fileProcessingStates.some(s => !['completed', 'failed'].includes(s.status)) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                    }`}
                  />
                )}
              </div>

              {/* Submit Button - Changes to "Continue" when all files processed */}
              <div className="text-center">
                {fileProcessingStates.length > 0 && fileProcessingStates.every(s => ['completed', 'failed'].includes(s.status)) ? (
                  <button
                    onClick={() => {
                      setFileProcessingStates([]);
                      // Reset file input so new files can be selected
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      // Refresh the previous files list
                      fetchPreviousFiles(false);
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <CheckCircle size={20} />
                    Continue
                  </button>
                ) : fileProcessingStates.length > 0 && fileProcessingStates.some(s => !['completed', 'failed'].includes(s.status)) ? (
                  <button
                    disabled={true}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading || loadingCustomInstructions || (!currentText.trim() && uploadedFiles.length === 0)}
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
                )}
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

          {/* Uploaded Files Section - Tabs for Documents and Images */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500">
              <h2 className="text-xl font-bold text-white">Uploaded Files</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveFileTab('documents')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeFileTab === 'documents'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Documents ({previousFiles.filter(f => f.file_type !== 'image').length})
              </button>
              <button
                onClick={() => setActiveFileTab('images')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeFileTab === 'images'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Images ({previousFiles.filter(f => f.file_type === 'image').length})
              </button>
            </div>

            <div className="p-6">
              {loadingPreviousFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                  <span className="ml-2 text-gray-500">Loading files...</span>
                </div>
              ) : previousFiles.filter(f => activeFileTab === 'documents' ? f.file_type !== 'image' : f.file_type === 'image').length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No {activeFileTab} uploaded yet</p>
                  <p className="text-gray-400 text-sm">Upload files above to get started</p>
                </div>
              ) : (
                <div className={activeFileTab === 'images' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'space-y-3'}>
                  {previousFiles
                    .filter(f => activeFileTab === 'documents' ? f.file_type !== 'image' : f.file_type === 'image')
                    .map((file) => (
                    activeFileTab === 'images' ? (
                      /* Image Grid View */
                      <div
                        key={file.id}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-amber-300 transition-colors"
                      >
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-full text-blue-500 hover:bg-blue-50"
                            title="Preview"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button
                            onClick={() => handleDeletePreviousFile(file.id, file.file_url)}
                            disabled={deletingFileId === file.id}
                            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingFileId === file.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate" title={file.file_name}>{file.file_name}</p>
                        </div>
                      </div>
                    ) : (
                      /* Document List View */
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-amber-200">
                            <FileText size={20} className="text-amber-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">{file.file_name}</p>
                              {file.processing_status && file.processing_status !== 'completed' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  file.processing_status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : file.processing_status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {file.processing_status}
                                </span>
                              )}
                            </div>
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
                        <div className="flex items-center gap-2">
                          {/* Preview button */}
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview file"
                          >
                            <ExternalLink size={18} />
                          </a>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeletePreviousFile(file.id, file.file_url)}
                            disabled={deletingFileId === file.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete file"
                          >
                            {deletingFileId === file.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
