import { supabase } from './supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export class ImageStorageService {
  private static readonly BUCKET_NAME = 'question-images';
  
  /**
   * Upload an image file to Supabase Storage
   * @param file - The image file to upload
   * @param questionId - Optional question ID for organizing files
   * @returns Promise with the public URL and storage path
   */
  static async uploadImage(file: File, questionId?: string): Promise<ImageUploadResult> {
    try {
      // Validate file type
      if (!this.isValidImageType(file)) {
        throw new Error('Invalid file type. Please upload PNG, JPG, JPEG, GIF, or SVG files.');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Please upload images smaller than 5MB.');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = questionId 
        ? `question-${questionId}-${timestamp}-${randomString}.${fileExt}`
        : `image-${timestamp}-${randomString}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Bucket not found') || error.message.includes('bucket does not exist')) {
          throw new Error('Storage not configured. Please ask the admin to set up the question-images bucket in Supabase Storage.');
        } else if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          throw new Error('Storage permissions error. Please ask the admin to configure storage policies.');
        } else if (error.message.includes('File size')) {
          throw new Error('File is too large. Please upload images smaller than 5MB.');
        } else if (error.message.includes('File type')) {
          throw new Error('Invalid file type. Please upload PNG, JPG, JPEG, GIF, or SVG files.');
        } else if (error.message.includes('JWT')) {
          throw new Error('Authentication error. Please log out and log back in.');
        } else {
          throw new Error(`Failed to upload image: ${error.message}`);
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload image');
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param path - The storage path of the image to delete
   */
  static async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Storage delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error instanceof Error ? error : new Error('Failed to delete image');
    }
  }

  /**
   * Check if file type is valid for upload
   * @param file - The file to validate
   * @returns boolean indicating if file type is valid
   */
  private static isValidImageType(file: File): boolean {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/svg+xml',
      'image/webp'
    ];
    return validTypes.includes(file.type);
  }

  /**
   * Get file size in human readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}