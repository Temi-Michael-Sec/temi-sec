import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "@/lib/env";

/**
 * Cloudinary image uploads for the editor.
 *
 * Configured lazily from env so the module imports cleanly when Cloudinary is
 * not set up (local dev without credentials) — `uploadImage` throws only when
 * actually called. The upload route turns that into a clear 503.
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
    );
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  configured = true;
}

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

/** Uploads image bytes to Cloudinary under the site's folder. */
export function uploadImage(bytes: Buffer): Promise<UploadedImage> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "temi-sec", resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result."));
            return;
          }
          resolve({
            url: result.secure_url,
            width: result.width,
            height: result.height,
          });
        },
      )
      .end(bytes);
  });
}
