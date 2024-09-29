import { v2 as cloudinary } from "cloudinary";
import { APIError } from "./APIError.utils.js";
import fs from "node:fs";
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const uploadImage = async (localFilePath, filename, fileMimeType) => {
  if (!localFilePath)
    return next(APIError(400, "Bad Request: File-Path-is-Missing"));
  if (!filename)
    return next(APIError(400, "Bad Request: File-Name-is-Missing"));
  if (!fileMimeType)
    return next(APIError(400, "Bad Request: File-Mime-Type-is-Missing"));
  try {
    const res = await cloudinary.uploader.upload(localFilePath, {
      filename_override: filename,
      folder: "users/images",
      format: fileMimeType,
    });
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    console.log("Cloudinary upload Error", error);
    try {
      fs.unlinkSync(localFilePath);
    } catch (error) {
      console.log(`failed to clean local storage`);
    }
    return next(APIError(500, "Server Issue:Failed to Uplaod File Over Cloud"));
  }
};
