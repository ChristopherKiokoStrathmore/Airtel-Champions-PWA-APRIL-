import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Native Camera Capture for Capacitor/Cordova WebView Apps
 * Guarantees native camera access across all Android devices
 */
export const NativeCamera = {
  /**
   * Capture photo using native camera
   * @returns Base64 image string
   */
  async capturePhoto(): Promise<{ base64: string; format: string } | null> {
    try {
      console.log('[NativeCamera] Opening native camera...');
      
      const image = await Camera.getPhoto({
        quality: 80, // Compress for 2G/3G networks
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera, // Force camera (not gallery)
        saveToGallery: false,
        correctOrientation: true,
        width: 1920, // Max width for optimization
        height: 1920,
      });

      if (image.base64String) {
        console.log('[NativeCamera] ✅ Photo captured successfully');
        return {
          base64: `data:image/${image.format};base64,${image.base64String}`,
          format: image.format || 'jpeg',
        };
      }

      return null;
    } catch (error: any) {
      if (error.message === 'User cancelled photos app') {
        console.log('[NativeCamera] User cancelled camera');
        return null;
      }
      
      console.error('[NativeCamera] Error capturing photo:', error);
      throw new Error('Failed to capture photo');
    }
  },

  /**
   * Check if camera is available
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions();
        return request.camera === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('[NativeCamera] Permission check failed:', error);
      return false;
    }
  },

  /**
   * Check if running in native container (Capacitor/Cordova)
   */
  isNative(): boolean {
    return !!(window as any).Capacitor || !!(window as any).cordova;
  },
};
