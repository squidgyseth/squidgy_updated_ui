/**
 * Service for fetching and uploading media to HighLevel
 */

import { ghlSubaccountsApi } from '../lib/supabase-api';

interface GHLCredentials {
  locationId: string;
  bearerToken: string;
}

interface MediaFile {
  id: string;
  url: string;
  name: string;
  thumbnailUrl?: string;
  createdAt: string;
}

interface GHLMediaResponse {
  files: MediaFile[];
}

export class GHLMediaService {
  private static instance: GHLMediaService;

  private constructor() {}

  static getInstance(): GHLMediaService {
    if (!GHLMediaService.instance) {
      GHLMediaService.instance = new GHLMediaService();
    }
    return GHLMediaService.instance;
  }

  /**
   * Fetch GHL credentials from Supabase
   * Uses the same pattern as the token feature
   */
  async getGHLCredentials(userId: string, agentId: string = 'social_media_scheduler'): Promise<GHLCredentials | null> {
    try {
      // Fetch all GHL subaccounts for this user
      const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(userId);
      
      
      if (Array.isArray(ghlDataArray)) {
      }
      
      // Find the record matching the agent_id
      const ghlData = Array.isArray(ghlDataArray) 
        ? ghlDataArray.find(item => item.agent_id === agentId) 
        : null;

      if (!ghlData) {
        console.error('[GHL Media] No record found for agent_id:', agentId);
        // Try to use the first available record if no exact match
        if (Array.isArray(ghlDataArray) && ghlDataArray.length > 0) {
          const firstRecord = ghlDataArray[0];
          if (firstRecord.ghl_location_id && firstRecord.pit_token) {
            return {
              locationId: firstRecord.ghl_location_id,
              bearerToken: firstRecord.pit_token
            };
          }
        }
        return null;
      }

      if (!ghlData.ghl_location_id || !ghlData.pit_token) {
        console.error('[GHL Media] Missing location_id or token in record');
        return null;
      }

      return {
        locationId: ghlData.ghl_location_id,
        bearerToken: ghlData.pit_token
      };
    } catch (error) {
      console.error('[GHL Media] Error in getGHLCredentials:', error);
      return null;
    }
  }

  /**
   * Fetch media files from GHL
   */
  async fetchMedia(userId: string, agentId: string = 'social_media_scheduler'): Promise<MediaFile[]> {
    try {
      const credentials = await this.getGHLCredentials(userId, agentId);
      
      if (!credentials) {
        throw new Error('No HighLevel credentials found');
      }

      const response = await fetch(
        `https://services.leadconnectorhq.com/medias/files?altId=${credentials.locationId}&altType=location&sortBy=createdAt&sortOrder=desc&type=file`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Version': '2021-07-28',
            'Authorization': `Bearer ${credentials.bearerToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }

      const data: GHLMediaResponse = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching media from GHL:', error);
      throw error;
    }
  }

  /**
   * Upload a file to GHL media storage
   */
  async uploadFile(
    userId: string,
    file: File,
    agentId: string = 'social_media_scheduler'
  ): Promise<MediaFile> {
    try {
      const credentials = await this.getGHLCredentials(userId, agentId);
      
      if (!credentials) {
        throw new Error('No HighLevel credentials found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('locationId', credentials.locationId);

      const response = await fetch(
        'https://services.leadconnectorhq.com/medias/upload-file',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Version': '2021-07-28',
            'Authorization': `Bearer ${credentials.bearerToken}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading file to GHL:', error);
      throw error;
    }
  }
}

export const ghlMediaService = GHLMediaService.getInstance();
