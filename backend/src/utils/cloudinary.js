import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Upload to a dedicated folder so the Media Library stays organized:
//   vidora/videos/        video files
//   vidora/thumbnails/    video thumbnails
//   vidora/avatars/       profile pictures
//   vidora/covers/        cover images
// The folder becomes part of the public_id (vidora/avatars/xyz), so
// deleteFromCloudinary keeps working with the returned public_id unchanged.
const uploadOnCloudinary = async (localFilePath, folder = "") => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
            folder,
        })
        fs.unlinkSync(localFilePath) // Delete the local file after successful upload
        return response
    } catch (error) {
        // The caller turns null into a 4xx/5xx — log the real reason so a
        // production upload failure is diagnosable (auth, quota, bad file).
        console.error("Cloudinary upload failed:", error?.message || error)
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        })
        if (response?.result && response.result !== "ok") {
            console.error(`Cloudinary delete reported: ${response.result} for ${publicId}`)
        }
        return response
    } catch (error) {
        // Deleting is best-effort (a failed delete leaves an orphaned asset,
        // not a broken app) — but log it so orphans are discoverable.
        console.error("Cloudinary delete failed:", publicId, error?.message || error)
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }