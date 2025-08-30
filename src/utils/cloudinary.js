import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file system module to remove file from local storage after uploading to cloudinary or perform read , write operation

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      //agar file path hi na ho to
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      //if hai to upload kar do through cloudinary
      resource_type: "auto", //image , video , raw
    });
    console.log("File has been uploaded to Cloudinary", response.url);

    return response.url;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove file from local storage if error occurs during uploading to cloudinary
    console.log("Error in uploading to Cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary };
