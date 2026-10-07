const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
  secure: true,
});

/**
 * Uploads a local file to Cloudinary.
 * Returns the secure_url string, or null if Cloudinary is not configured / fails.
 */
async function uploadToCloudinary(filePath, folder = "vmc_civic_fixes") {
  const isConfigured = Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME) &&
    (process.env.CLOUDINARY_API_KEY || process.env.API_KEY) &&
    (process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET)
  ) || Boolean(process.env.CLOUDINARY_URL);

  if (!isConfigured) {
    console.log("ℹ️ [Cloudinary] Credentials not set in .env. Using local storage path.");
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });
    console.log(`✅ [Cloudinary] Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error("❌ [Cloudinary] Upload failed:", error.message);
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
