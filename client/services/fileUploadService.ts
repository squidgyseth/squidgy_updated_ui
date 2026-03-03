// File upload service for managing uploaded files
export interface UploadedFile {
  file_id: string;
  file_name: string;
  file_url: string;
  agent_id: string;
  agent_name: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'extracting' | 'extracted' | 'embedding' | 'saving';
  extracted_text?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
  // SSE status fields for real-time progress
  status?: string;
  message?: string;
  processing_message?: string;
  progress?: number;
}

export interface FileListResponse {
  success: boolean;
  count: number;
  data: UploadedFile[];
}

export interface FileStatusResponse {
  success: boolean;
  data: UploadedFile;
}

export class FileUploadService {
  private static instance: FileUploadService;

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Get all uploaded files for a user
   */
  async getUserFiles(firmUserId: string, agentId?: string): Promise<UploadedFile[]> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const url = agentId 
        ? `${backendUrl}/api/files/user/${firmUserId}?agent_id=${agentId}`
        : `${backendUrl}/api/files/user/${firmUserId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user files: ${response.statusText}`);
      }
      
      const result: FileListResponse = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  /**
   * Get file processing status
   */
  async getFileStatus(fileId: string): Promise<UploadedFile | null> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/file/status/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file status: ${response.statusText}`);
      }
      
      const result: FileStatusResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching file status:', error);
      return null;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      case 'docx':
        return '📘';
      case 'md':
        return '📑';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Processed';
      case 'processing':
        return 'Processing...';
      case 'pending':
        return 'Queued';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }
}
