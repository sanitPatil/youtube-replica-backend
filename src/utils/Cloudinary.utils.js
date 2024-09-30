import { v2 as cloudinary } from 'cloudinary';
import { APIError } from './APIError.utils.js';
import fs from 'node:fs';
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const cloudinaryUpload = async (
  localFilePath,
  filename,
  fileMimeType,
  fileType
) => {
  if (!localFilePath)
    throw new APIError(400, 'Bad Request: File-Path-is-Missing');
  if (!filename) throw new APIError(400, 'Bad Request: File-Name-is-Missing');
  if (!fileMimeType)
    throw new APIError(400, 'Bad Request: File-Mime-Type-is-Missing');
  if (!fileType) throw new APIError(400, 'Bad Request: File-Type-is-Missing');
  const folder = fileType === 'image' ? 'images' : 'videos';
  const format = fileMimeType.split('/')[1];
  try {
    const res = await cloudinary.uploader.upload(localFilePath, {
      filename_override: filename,
      folder: `apiyoutube/${folder}`,
      format: format,
    });
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    console.log('Cloudinary upload Error', error);
    try {
      fs.unlinkSync(localFilePath);
    } catch (error) {
      console.log(`failed to clean local storage:${error}`);
    }
    throw new APIError(500, 'Server Issue:Failed to Uplaod File Over Cloud');
  }
};

const cloudinaryRemove = async (resource, resource_type) => {
  try {
    const res = await cloudinary.api.delete_resources(
      [`apiyoutube/images/${resource}`],
      {
        type: `upload`,
        resource_type: `${resource_type}`,
      }
    );
    return res;
  } catch (err) {
    console.log(`Error While Removing Resource:${err}`);
  }
};
export { cloudinaryUpload, cloudinaryRemove };
