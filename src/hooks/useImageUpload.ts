import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_SIZE = 200; // 200x200 pixels for better quality display

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        if (ctx) {
          // Draw image centered and cropped to square
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          ctx.drawImage(img, x, y, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/webp',
            0.9
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File, produtoId: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      // Resize the image
      const resizedBlob = await resizeImage(file);
      
      // Create unique filename
      const fileName = `${produtoId}.webp`;
      const filePath = `produtos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, resizedBlob, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from('produtos').getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (produtoId: string): Promise<boolean> => {
    try {
      const filePath = `produtos/${produtoId}.webp`;
      const { error } = await supabase.storage.from('produtos').remove([filePath]);
      
      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
  };
}
