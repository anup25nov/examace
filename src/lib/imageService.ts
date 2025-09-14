// Image Service for Question Support
import { supabase } from '@/integrations/supabase/client';

export interface QuestionImage {
  id: string;
  question_id: string;
  image_type: 'question' | 'option' | 'explanation';
  image_url: string;
  alt_text?: string;
  created_at: string;
}

export class ImageService {
  // Upload image to Supabase Storage
  static async uploadImage(
    file: File,
    questionId: string,
    imageType: 'question' | 'option' | 'explanation',
    altText?: string
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${questionId}_${imageType}_${Date.now()}.${fileExt}`;
      const filePath = `question-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      // Save image record to database
      const { error: dbError } = await supabase
        .from('question_images' as any)
        .insert({
          question_id: questionId,
          image_type: imageType,
          image_url: urlData.publicUrl,
          alt_text: altText
        });

      if (dbError) {
        console.error('Error saving image record:', dbError);
        return { success: false, error: dbError.message };
      }

      return { success: true, imageUrl: urlData.publicUrl };
    } catch (error: any) {
      console.error('Error in uploadImage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get images for a question
  static async getQuestionImages(questionId: string): Promise<QuestionImage[]> {
    try {
      const { data, error } = await supabase
        .from('question_images' as any)
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching question images:', error);
        return [];
      }

      return (data as unknown as QuestionImage[]) || [];
    } catch (error) {
      console.error('Error in getQuestionImages:', error);
      return [];
    }
  }

  // Delete image
  static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get image record first
      const { data: imageData, error: fetchError } = await supabase
        .from('question_images' as any)
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('Error fetching image record:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Extract file path from URL
      const url = new URL((imageData as any).image_url);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('question-images')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        return { success: false, error: storageError.message };
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('question_images' as any)
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return { success: false, error: dbError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteImage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get image URL with fallback
  static getImageUrl(imageUrl: string, fallbackUrl?: string): string {
    if (!imageUrl) return fallbackUrl || '/placeholder.svg';
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative path, construct full URL
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/question-images/${imageUrl}`;
  }

  // Validate image file
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
    }

    return { valid: true };
  }

  // Generate image component props
  static getImageProps(
    imageUrl: string,
    altText?: string,
    className?: string
  ): {
    src: string;
    alt: string;
    className?: string;
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  } {
    return {
      src: this.getImageUrl(imageUrl),
      alt: altText || 'Question image',
      className: className || 'max-w-full h-auto rounded-lg',
      onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder.svg';
      }
    };
  }
}

export const imageService = new ImageService();
