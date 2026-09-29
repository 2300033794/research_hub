import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are missing.");
  }
}

export async function uploadPdfBuffer(buffer: Buffer, filename: string) {
  assertCloudinaryConfig();
  const dataUri = `data:application/pdf;base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    resource_type: "raw",
    folder: "research-papers",
    public_id: filename.replace(/\.pdf$/i, "").slice(0, 80),
    overwrite: false,
    unique_filename: true,
    use_filename: true,
    format: "pdf",
  });
}

export async function uploadImageBuffer(buffer: Buffer, mimeType: string) {
  assertCloudinaryConfig();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    folder: "research-thumbnails",
    overwrite: false,
    unique_filename: true,
  });
}

export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: "raw" | "image" = "raw",
) {
  assertCloudinaryConfig();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
