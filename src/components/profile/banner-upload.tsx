import { useState, useRef } from 'react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface BannerUploadProps {
  userId: string;
  currentBannerUrl?: string;
  onUploadComplete: (url: string) => void;
}

export function BannerUpload({ userId, currentBannerUrl, onUploadComplete }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      setProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('make-28f2f653-profile-banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload banner');
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('make-28f2f653-profile-banners')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      setProgress(80);

      // Update user's banner_url in database
      const { error: dbError } = await supabase
        .from('app_users')
        .update({ banner_url: publicUrl })
        .eq('id', userId);

      if (dbError) {
        console.error('Database update error:', dbError);
        toast.error('Failed to save banner');
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      toast.success('Banner updated successfully');
      onUploadComplete(publicUrl);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-3 right-3 w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        title="Upload banner"
      >
        {uploading ? (
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
            <div 
              className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"
              style={{ 
                clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`
              }}
            ></div>
          </div>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </>
  );
}
