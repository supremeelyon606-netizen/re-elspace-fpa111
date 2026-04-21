// server/src/modules/upload/cloudinary.service.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File | { buffer: Buffer; mimetype: string; originalname: string },
    folder: string = 'elspace',
    publicId?: string
  ): Promise<{ url: string; publicId: string; error?: string }> {
    try {
      if (!file) {
        return { url: '', publicId: '', error: 'No file provided' };
      }

      return new Promise((resolve) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto',
            overwrite: true,
          },
          (error, result: any) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              resolve({ url: '', publicId: '', error: error.message });
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          }
        );

        if (file instanceof Buffer || 'buffer' in file) {
          stream.end(file.buffer || file);
        } else if ('stream' in file) {
          file.stream.pipe(stream);
        }
      });
    } catch (error: any) {
      console.error('Cloudinary upload exception:', error);
      return { url: '', publicId: '', error: error.message };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: Array<Express.Multer.File | { buffer: Buffer; mimetype: string; originalname: string }>,
    folder: string = 'elspace'
  ): Promise<Array<{ url: string; publicId: string; error?: string }>> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file, folder))
    );
    return results;
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        error: result.result !== 'ok' ? result.result : undefined,
      };
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error: any) {
      console.error('Cloudinary get info error:', error);
      return null;
    }
  }

  /**
   * Generate optimized image URL
   */
  generateImageUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  /**
   * Generate thumbnail
   */
  generateThumbnailUrl(publicId: string, width: number = 200, height: number = 200): string {
    return this.generateImageUrl(publicId, {
      crop: 'fill',
      width,
      height,
      quality: 'auto',
    });
  }

  /**
   * Generate responsive image URLs
   */
  generateResponsiveUrls(publicId: string): {
    thumb: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumb: this.generateImageUrl(publicId, { width: 200, crop: 'fill' }),
      small: this.generateImageUrl(publicId, { width: 400, crop: 'fill' }),
      medium: this.generateImageUrl(publicId, { width: 800, crop: 'fill' }),
      large: this.generateImageUrl(publicId, { width: 1200, crop: 'fill' }),
      original: this.generateImageUrl(publicId),
    };
  }

  /**
   * Upload from URL
   */
  async uploadFromUrl(url: string, folder: string = 'elspace'): Promise<{ url: string; publicId: string; error?: string }> {
    try {
      const result: any = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.error('Cloudinary upload from URL error:', error);
      return { url: '', publicId: '', error: error.message };
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folder: string): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: 100,
      });

      return result.resources;
    } catch (error: any) {
      console.error('Cloudinary get folder contents error:', error);
      return [];
    }
  }
}

export const cloudinaryService = new CloudinaryService();
