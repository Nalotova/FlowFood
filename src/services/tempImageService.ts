/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompressedImage } from '../utils/imageCompression';

/**
 * Service for managing temporary images used for recognition.
 * Ensures images are cleared from memory and not persisted.
 */
export const tempImageService = {
  /**
   * Clears images from local state.
   */
  clearLocalImageState: (setter: (images: string[]) => void) => {
    setter([]);
  },

  /**
   * Placeholder for Firebase Storage integration if needed.
   * Path: tempUploads/{userId}/{requestId}/{fileName}
   */
  uploadTempImage: async (userId: string, requestId: string, image: CompressedImage): Promise<string> => {
    // In current implementation, we send base64 directly to AI.
    // If we were to use Storage, we would upload here and return the URL.
    return image.dataUrl;
  },

  /**
   * Cleanup function for temporary assets.
   */
  cleanupTempImages: async (userId: string, requestId: string): Promise<void> => {
    try {
      // Logic for deleting from Firebase Storage would go here.
      console.log(`Cleaning up temp images for request ${requestId}...`);
    } catch (error) {
      console.warn("Failed to cleanup temp images:", error);
    }
  }
};
