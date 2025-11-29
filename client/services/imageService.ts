/**
 * Image Service
 * Handles all database operations for content_repurposer_images table
 * and image generation/upload functionality
 */

import { supabase } from '../lib/supabase';

export interface ImageRecord {
  id?: string;
  user_id: string;
  agent_id: string;
  platform: string;
  post_id: string;
  content?: string;
  image_url: string | null; // Can be null when image is deleted but record preserved
  prompt?: string;
  generation_type: 'custom' | 'auto' | 'upload';
  created_date?: string;
  updated_date?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  output_format?: string;
  response_format?: string;
}

export interface ImageGenerationResponse {
  Image: string; // base64 string
}

class ImageService {
  private static instance: ImageService;

  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Send image generation request to N8N webhook using the same pattern as main workflow
   */
  private async sendToImageGeneratorWorkflow(
    prompt: string,
    agentId: string,
    userId: string,
    imageGeneratorUrl?: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<string> {
    // Use the provided image generator URL or fall back to default
    const n8nImageGeneratorUrl = imageGeneratorUrl || 'https://n8n.theaiteam.uk/webhook/image_generator';
    
    if (!n8nImageGeneratorUrl) {
      throw new Error('Image generator URL not configured');
    }

    const requestBody: ImageGenerationRequest = {
      prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 4,
      seed: options.seed || 0,
      output_format: options.output_format || 'jpeg',
      response_format: options.response_format || 'b64',
      ...options
    };

    console.log('🎨 Calling image generator:', {
      url: n8nImageGeneratorUrl,
      method: 'POST',
      body: requestBody
    });

    const response = await fetch(n8nImageGeneratorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image generation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data: ImageGenerationResponse = await response.json();
    console.log('✅ Image generated successfully, base64 length:', data.Image?.length || 0);
    
    if (!data.Image) {
      throw new Error('No image data received from generator');
    }
    
    return data.Image; // Returns base64 string
  }

  /**
   * Generate image using N8N webhook
   */
  async generateImage(
    prompt: string, 
    agentId: string,
    userId: string,
    imageGeneratorUrl?: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<string> {
    return this.sendToImageGeneratorWorkflow(prompt, agentId, userId, imageGeneratorUrl, options);
  }

  /**
   * Upload base64 image to Supabase storage
   */
  async uploadBase64Image(
    base64Image: string,
    fileName: string,
    userId: string
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Sanitize filename - remove special characters and spaces
      const sanitizedFileName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .toLowerCase(); // Convert to lowercase

      // Create unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('content_repurposer')
        .upload(uniqueFileName, blob);

      if (error) {
        console.error('Supabase storage error:', error);
        if (error.message.includes('not found')) {
          throw new Error('Storage bucket "content_repurposer" not found. Please create the bucket in Supabase dashboard.');
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content_repurposer')
        .getPublicUrl(uniqueFileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    file: File,
    userId: string
  ): Promise<string> {
    try {
      // Sanitize filename - remove special characters and spaces
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .toLowerCase(); // Convert to lowercase

      // Create unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

      console.log('📁 Uploading file to Supabase storage:', {
        bucket: 'content_repurposer',
        fileName: uniqueFileName,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('content_repurposer')
        .upload(uniqueFileName, file);

      if (error) {
        console.error('❌ Supabase storage error:', error);
        if (error.message.includes('not found')) {
          throw new Error('Storage bucket "content_repurposer" not found. Please create the bucket in Supabase dashboard.');
        }
        throw error;
      }

      console.log('✅ File uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content_repurposer')
        .getPublicUrl(uniqueFileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Save image metadata to database
   */
  async saveImageRecord(record: Omit<ImageRecord, 'id' | 'created_date' | 'updated_date'>): Promise<ImageRecord> {
    try {
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .insert([record])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving image record:', error);
      throw error;
    }
  }

  /**
   * Get images for a specific post - only returns records with valid image URLs
   */
  async getPostImages(
    userId: string,
    agentId: string,
    postId: string
  ): Promise<ImageRecord[]> {
    try {
      console.log(`🔍 ImageService: Searching for post_id: "${postId}"`);
      
      // Try exact match first
      let { data, error } = await supabase
        .from('content_repurposer_images')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .eq('post_id', postId)
        .not('image_url', 'is', null) // Only get records with valid image URLs
        .order('created_date', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`🔍 ImageService: Exact match found ${data?.length || 0} images`);

      // If no exact match and postId contains UUID, try without UUID
      if ((!data || data.length === 0) && postId.includes('-') && postId.split('-').length > 3) {
        const shortPostId = postId.split('-').slice(0, 3).join('-');
        console.log(`🔍 ImageService: Trying shortened post_id: "${shortPostId}"`);
        
        const { data: shortData, error: shortError } = await supabase
          .from('content_repurposer_images')
          .select('*')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .eq('post_id', shortPostId)
          .not('image_url', 'is', null)
          .order('created_date', { ascending: true });

        if (shortError) {
          throw shortError;
        }
        
        console.log(`🔍 ImageService: Shortened match found ${shortData?.length || 0} images`);
        data = shortData;
      }
      
      // If still no match and postId is short, try with wildcard pattern
      if ((!data || data.length === 0) && !postId.includes('-', postId.lastIndexOf('_') + 1)) {
        console.log(`🔍 ImageService: Trying wildcard pattern for post_id starting with: "${postId}"`);
        
        const { data: wildcardData, error: wildcardError } = await supabase
          .from('content_repurposer_images')
          .select('*')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .like('post_id', `${postId}%`)
          .not('image_url', 'is', null)
          .order('created_date', { ascending: true });

        if (wildcardError) {
          throw wildcardError;
        }
        
        console.log(`🔍 ImageService: Wildcard match found ${wildcardData?.length || 0} images`);
        data = wildcardData;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting post images:', error);
      throw error;
    }
  }

  /**
   * Delete image - removes file from storage and sets image_url to NULL, preserving the record
   */
  async deleteImage(imageId: string, userId: string): Promise<void> {
    try {
      // Get image record first to get the file path
      const { data: imageRecord, error: fetchError } = await supabase
        .from('content_repurposer_images')
        .select('image_url')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Delete from storage bucket
      if (imageRecord?.image_url) {
        const urlParts = imageRecord.image_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Get last two parts: userId/filename
        
        console.log('🗑️ Deleting image from storage:', fileName);
        
        const { error: storageError } = await supabase.storage
          .from('content_repurposer')
          .remove([fileName]);
          
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database update even if storage deletion fails
        }
      }

      // Update database record to set image_url to NULL (preserve the row and metadata)
      const { error } = await supabase
        .from('content_repurposer_images')
        .update({ 
          image_url: null,
          updated_date: new Date().toISOString()
        })
        .eq('id', imageId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
      
      console.log('✅ Image deleted from storage, database record preserved with image_url set to NULL');
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Complete workflow: Generate image and save to storage + database
   */
  async generateAndSaveImage(
    prompt: string,
    userId: string,
    agentId: string,
    platform: string,
    postId: string,
    content?: string,
    generationType: 'custom' | 'auto' = 'custom',
    imageGeneratorUrl?: string,
    sessionId?: string,
    historyContentRepurposerId?: string
  ): Promise<ImageRecord> {
    try {
      // 1. Generate image
      const base64Image = await this.generateImage(prompt, agentId, userId, imageGeneratorUrl);
      
      // 2. Upload to storage
      const fileName = `generated_${Date.now()}.jpg`;
      const imageUrl = await this.uploadBase64Image(base64Image, fileName, userId);
      
      // 3. Save metadata to database
      const imageRecord = await this.saveImageRecord({
        user_id: userId,
        agent_id: agentId,
        platform,
        post_id: postId,
        content,
        image_url: imageUrl,
        prompt,
        generation_type: generationType,
        session_id: sessionId,
        history_content_repurposer_id: historyContentRepurposerId
      });

      return imageRecord;
    } catch (error) {
      console.error('Error in generateAndSaveImage:', error);
      throw error;
    }
  }

  /**
   * Complete workflow: Upload file and save to storage + database
   */
  async uploadAndSaveImage(
    file: File,
    userId: string,
    agentId: string,
    platform: string,
    postId: string,
    content?: string,
    sessionId?: string,
    historyContentRepurposerId?: string
  ): Promise<ImageRecord> {
    try {
      // 1. Upload file to storage
      const imageUrl = await this.uploadFile(file, userId);
      
      // 2. Save metadata to database
      const imageRecord = await this.saveImageRecord({
        user_id: userId,
        agent_id: agentId,
        platform,
        post_id: postId,
        content,
        image_url: imageUrl,
        generation_type: 'upload',
        session_id: sessionId,
        history_content_repurposer_id: historyContentRepurposerId
      });

      return imageRecord;
    } catch (error) {
      console.error('Error in uploadAndSaveImage:', error);
      throw error;
    }
  }
}

export default ImageService;