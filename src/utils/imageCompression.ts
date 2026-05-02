/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompressedImage {
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
  dataUrl: string;
  blob?: Blob;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxCompressedSizeBytes?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
  maxCompressedSizeBytes: 900 * 1024, // 900 KB
};

/**
 * Compresses an image file in the browser.
 */
export async function compressImage(file: File, options = DEFAULT_OPTIONS): Promise<CompressedImage> {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Calculate sizes
      const base64Length = dataUrl.split(',')[1].length;
      const compressedSize = Math.floor(base64Length * 0.75);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Blob generation failed'));
          return;
        }

        resolve({
          originalName: file.name,
          originalSize: file.size,
          compressedSize: blob.size,
          width,
          height,
          mimeType: 'image/jpeg',
          dataUrl,
          blob
        });
      }, 'image/jpeg', quality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple image files.
 */
export async function compressImages(files: File[], options = DEFAULT_OPTIONS): Promise<CompressedImage[]> {
  const results: CompressedImage[] = [];
  for (const file of files) {
    results.push(await compressImage(file, options));
  }
  return results;
}
