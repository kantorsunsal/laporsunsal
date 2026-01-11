/**
 * Image compression utility using browser-image-compression library
 * Provides better compression with multi-threading support
 */
import imageCompression from "browser-image-compression";

// Allowed image types for security
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE_MB = 5; // 5MB max original file

/**
 * Validate file before processing
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
    };
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Compress image for optimal upload
 * Target: ~200KB with readable text quality
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  }
): Promise<File> {
  const compressionOptions = {
    maxSizeMB: options?.maxSizeMB ?? 0.2, // Default 200KB
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1280,
    useWebWorker: true, // Multi-threading for better performance
    initialQuality: options?.quality ?? 0.8,
    fileType: "image/jpeg" as const,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error("Compression failed:", error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress image specifically for profile photos (smaller)
 */
export async function compressProfilePhoto(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1, // 100KB for profile photos
    maxWidthOrHeight: 400, // Profile photos don't need to be large
    quality: 0.7,
  });
}

/**
 * Compress image for payment proof (higher quality to keep text readable)
 */
export async function compressPaymentProof(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2, // 200KB
    maxWidthOrHeight: 1280, // Good resolution for reading receipts
    quality: 0.8,
  });
}
