import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})








const uploadOnCloudinary = async (localFilePath, folder = "") => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
            folder,
        })
        fs.unlinkSync(localFilePath) 
        return { ...response, url: response.secure_url || response.url }
    } catch (error) {
        
        
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
        
        
        console.error("Cloudinary delete failed:", publicId, error?.message || error)
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }