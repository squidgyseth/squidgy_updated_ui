import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { AgentConfigService } from '../services/agentConfigService';
import { Mic, MicOff, Upload, Send, File, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface KnowledgeEntry {
  id: string;
  type: 'voice' | 'file';
  content: string;
  fileName?: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
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

  const handleSubmit = async () => {
    if (!userId || !agentId || (!currentText.trim() && uploadedFiles.length === 0)) {
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let totalOperations = 0;

    try {
      // Handle text input
      if (currentText.trim()) {
        totalOperations++;
        try {
          const result = await saveTextKnowledge(currentText.trim());
          if (result.success) {
            successCount++;
            console.log('Text knowledge saved successfully:', result.file_id);
          }
        } catch (error) {
          console.error('Failed to save text knowledge:', error);
        }
      }

      // Handle file uploads
      if (uploadedFiles.length > 0) {
        totalOperations += uploadedFiles.length;
        
        for (const file of uploadedFiles) {
          try {
            // Upload to Supabase first
            const timestamp = Date.now();
            const fileName = `${userId}_${timestamp}_${file.name}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('newsletter')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Supabase upload error:', uploadError);
              continue;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('newsletter')
              .getPublicUrl(fileName);

            // Save to knowledge base with background processing
            const result = await saveFileKnowledge(file, publicUrl);
            if (result.success) {
              successCount++;
              console.log('File knowledge saved successfully:', result.file_id);
            }
          } catch (error) {
            console.error('Failed to save file knowledge:', error);
          }
        }
      }

      // Show success/error feedback
      if (successCount === totalOperations) {
        console.log('All knowledge saved successfully!');
        
        // Clear form
        setCurrentText('');
        setVoiceText('');
        accumulatedTextRef.current = '';
        setUploadedFiles([]);
        
        // Navigate back to agent chat page after short delay
        setTimeout(() => {
          navigate(`/chat/${agentId}`);
        }, 1000);
        
      } else {
        console.error(`Only ${successCount}/${totalOperations} operations succeeded`);
      }
      
    } catch (error) {
      console.error('Error submitting knowledge:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveTextKnowledge = async (textContent: string) => {
    try {
      const formData = new FormData();
      formData.append('firm_user_id', userId);
      formData.append('agent_id', agentId);
      formData.append('agent_name', agentConfig?.agent?.name || 'Unknown Agent');
      formData.append('text_content', textContent);

      const response = await fetch('http://localhost:8000/api/knowledge-base/text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save text knowledge');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving text knowledge:', error);
      throw error;
    }
  };

  const saveFileKnowledge = async (file: File, fileUrl: string) => {
    try {
      const formData = new FormData();
      formData.append('firm_user_id', userId);
      formData.append('file_name', file.name);
      formData.append('file_url', fileUrl);
      formData.append('agent_id', agentId);
      formData.append('agent_name', agentConfig?.agent?.name || 'Unknown Agent');

      const response = await fetch('http://localhost:8000/api/knowledge-base/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save file knowledge');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving file knowledge:', error);
      throw error;
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
                {agentConfig?.agent?.name} Settings
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
          {/* Content Input Section - Figma Style */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white mb-2">Add Your Content</h2>
              <p className="text-purple-100">
                Share your knowledge with {agentConfig?.agent?.name} to get personalized assistance
              </p>
            </div>

            {/* Content Input Area */}
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
                    PDF, TXT, or DOCX documents
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

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
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
                  Content Input
                </label>
                <textarea
                  id="content-textarea"
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Type your content here, or use voice input above..."
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
                      Save Settings
                    </>
                  )}
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}