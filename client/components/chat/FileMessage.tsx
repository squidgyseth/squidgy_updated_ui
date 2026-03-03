import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader, Clock, Eye, Download, X } from 'lucide-react';
import type { FileUploadInfo } from '../../types/n8n.types';
import { FileUploadService } from '../../services/fileUploadService';

interface FileMessageProps {
  fileInfo: FileUploadInfo;
  timestamp: Date;
  processingProgress?: {
    status: string;
    message: string;
    progress: number;
  };
}

export default function FileMessage({ fileInfo, timestamp, processingProgress }: FileMessageProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const fileUploadService = FileUploadService.getInstance();

  const isImageFile = (fileName: string): boolean => {
    return /\.(jpg|jpeg|png)$/i.test(fileName);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleDownload = () => {
    window.open(fileInfo.fileUrl, '_blank');
  };

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {fileUploadService.getFileTypeIcon(fileInfo.fileName)}
            <div>
              <h3 className="font-semibold text-gray-900">{fileInfo.fileName}</h3>
              <p className="text-sm text-gray-500">
                {fileUploadService.getStatusText(fileInfo.status)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isImageFile(fileInfo.fileName) ? (
            <div className="flex items-center justify-center">
              <img 
                src={fileInfo.fileUrl} 
                alt={fileInfo.fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : fileInfo.status === 'completed' && fileInfo.extractedText ? (
            <div className="prose max-w-none">
              <h4 className="text-lg font-semibold mb-3">Extracted Text:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {fileInfo.extractedText}
                </pre>
              </div>
            </div>
          ) : fileInfo.status === 'processing' ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Processing file...</p>
            </div>
          ) : fileInfo.status === 'failed' ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-2">Processing failed</p>
              {fileInfo.errorMessage && (
                <p className="text-sm text-gray-600">{fileInfo.errorMessage}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-600">File is queued for processing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`max-w-xs border rounded-lg p-3 ${getStatusColor(fileInfo.status)}`}>
        {/* Image thumbnail for image files */}
        {isImageFile(fileInfo.fileName) && (
          <div 
            className="mb-2 cursor-pointer"
            onClick={handlePreview}
          >
            <img 
              src={fileInfo.fileUrl} 
              alt={fileInfo.fileName}
              className="w-full max-h-32 object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {fileUploadService.getFileTypeIcon(fileInfo.fileName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(fileInfo.status)}
              <span className={`text-xs ${fileUploadService.getStatusColor(fileInfo.status)}`}>
                {fileUploadService.getStatusText(fileInfo.status)}
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium truncate">
              {fileInfo.fileName}
            </p>
            {fileInfo.errorMessage && (
              <p className="text-xs text-red-500 mt-1 truncate">
                {fileInfo.errorMessage}
              </p>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handlePreview}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={handleDownload}
                className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500 mt-2 block">
          {timestamp.toLocaleTimeString()}
        </span>
        
        {/* Processing Progress Dropdown */}
        {processingProgress && showProgress && fileInfo.status !== 'completed' && (
          <div className="mt-2 pt-2 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Loader className="w-3 h-3 animate-spin" />
                {processingProgress.message}
              </span>
              <span className="text-xs text-gray-500">{processingProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && <PreviewModal />}
    </>
  );
}
