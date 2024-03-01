import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" // file system is provided by node.js

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary =async (localFilePath) => { // ** localFilePath will come from multer
    try {
        if(!localFilePath) return null
        // ** upload on cloudinary **
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // ** uploaded on cloudinary **
        console.log( "the file is successfully uploaded on cloudinary at : ", response.url)
        // ** remove the locally saved file path as it got uploaded **
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        // ** remove the locally saved file path as it failed to upload **
        fs.unlinkSync(localFilePath)
        return null
    }
}
const deleteFromCloudinary = async (publicId) => {
    try {console.log(publicId)
        const response = await cloudinary.uploader.destroy(publicId)
    
        console.log("file successfully deleted form cloudinary", response)
        
        return response
    } catch (error) {
        console.log("Error deleting this file from cloudinary :", error.message)
    }
}

const deleteVideoFromCloudinary = async (publicId) => {
    try {console.log(publicId)
        const response = await cloudinary.uploader.destroy(publicId,{ resource_type: "video"})
    
        console.log("file successfully deleted form cloudinary", response)
        
        return response
    } catch (error) {
        console.log("Error deleting this file from cloudinary :", error.message)
    }
}
export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    deleteVideoFromCloudinary
}