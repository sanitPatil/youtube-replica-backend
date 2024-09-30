import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import {
  cloudinaryRemove,
  cloudinaryUpload,
} from '../utils/Cloudinary.utils.js';

import fs from 'node:fs';
import { Video } from '../models/Video.models.js';
// 1. video save
const createVideo = AsyncHandler(async (req, res, next) => {
  try {
    const { title, description, isPublished } = req?.body;

    const files = req?.files;
    const thumbnail = files?.thumbnail[0];
    const videoFile = files?.videoFile[0];
    // console.log(thumbnail);
    // console.log(videoFile);

    if (!title || !description) {
      try {
        if (thumbnail) fs.unlinkSync(thumbnail.path);
      } catch (error) {
        console.log('file not found');
      }
      try {
        if (videoFile) fs.unlinkSync(videoFile.path);
      } catch (error) {
        console.log('file not found');
      }
      return next(
        new APIError(
          400,
          `Bad Request:title and description fileds are missing!`
        )
      );
    }
    if (!thumbnail)
      return next(new APIError(400, `Bad Reqeuest:thumbnail is missing`));

    if (!videoFile)
      return next(new APIError(400, `Bad Reqeuest:videoFile is missing`));

    const uploadThumbnail = await cloudinaryUpload(
      thumbnail.path,
      thumbnail.filename,
      thumbnail.mimetype,
      thumbnail.mimetype.split('/')[0]
    );
    if (!uploadThumbnail)
      return next(new APIError(500, `server issue failed to uplaod thumbnail`));

    const uploadVideoFile = await cloudinaryUpload(
      videoFile.path,
      videoFile.filename,
      videoFile.mimetype,
      videoFile.mimetype.split('/')[0]
    );
    if (!uploadVideoFile) {
      const thumbnailUrl = uploadThumbnail.url.split('/')[9].split('.')[0];
      await cloudinaryRemove(thumbnailUrl, 'image');
      return next(new APIError(500, `server issue failed to uplaod videoFile`));
    }

    const videoSave = await Video.create({
      title,
      description,
      thumbnail: uploadThumbnail.url,
      videoFile: uploadVideoFile.url,
      duration: uploadVideoFile.duration,
      isPublished: isPublished === 'true' ? true : false,
      owner: req?.user?._id,
    });

    if (!videoSave)
      return next(
        new APIError(500, `server issue failed to upload video object`)
      );

    return res
      .status(200)
      .json(new APIResponse(200, 'video-save-successfully', videoSave));
  } catch (error) {
    console.log('video-create-error:', error);
    return next(new APIError(500, 'failed to create video', error));
  }
});

// 2. get video
const getVideo = AsyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req?.params;
    if (!videoId)
      return next(new APIError(400, 'Bad Request:video-Id is Missing'));

    const videoFile = await Video.findById(videoId);
    if (!videoFile)
      return next(new APIError(500, 'failed to get requested Video'));

    return res
      .status(200)
      .json(new APIResponse(200, 'video-fetch-successfully', { videoFile }));
  } catch (error) {
    console.log(`video-get-error-${error}`);
    return next(new APIError(500, 'failed to load requested video', error));
  }
});

// 3. update video
const updateVideo = AsyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req?.params;
    const videoFile = req?.file;
    if (!videoId) {
      try {
        if (videoFile.path) fs.unlinkSync(videoFile.path);
      } catch (error) {
        console.log('file not Found ');
      }
      return next(new APIError(400, `Bad Request: video id is missing`));
    }
    if (!videoFile)
      return next(new APIError(400, `Bad Request: video file is missing`));

    const video = await Video.findById(videoId);
    if (!video) {
      try {
        if (videoFile.path) fs.unlinkSync(videoFile.path);
      } catch (error) {
        console.log('file not Found ');
      }
      return next(new AP(500, `server issue:failed to get file`));
    }

    const uploadVideoFile = await cloudinaryUpload(
      videoFile.path,
      videoFile.filename,
      videoFile.mimetype,
      videoFile.mimetype.split('/')[0]
    );
    if (!uploadVideoFile) {
      try {
        if (videoFile.path) fs.unlinkSync(videoFile.path);
      } catch (error) {
        console.log('file not Found ');
      }
      return next(new APIError(500, `server issue failed to uplaod videoFile`));
    }

    const videoFileUrl = video?.videoFile?.split('/')[9].split('.')[0];
    console.log(videoFileUrl);

    const remResource = await cloudinaryRemove(videoFileUrl, 'video');
    if (!remResource) console.log(`failed to remove resource`);

    video.videoFile = uploadVideoFile.url;
    await video.save({ validateBeforeSave: false });

    const videoRes = await Video.findById(videoId);

    res
      .status(200)
      .json(new APIResponse(200, `successfully-update-video`, videoRes));
  } catch (error) {
    console.log(`error-video-update:${error}`);
    return next(
      new APIError(500, `server issue:Failed to update-video`, error)
    );
  }
});

// 4. delete video
const deleteVideo = AsyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req.params;
    if (!videoId)
      return next(new APIError(400, `Bad Request:missing video id`));

    const video = await Video.findById(videoId);
    if (!video)
      return next(new APIError(404, `video with given id not found!!!`));

    const res = Video.findByIdAndDelete(videoId);

    if (!res)
      return next(new APIError(500, `server issue:failed to remove video!!!`));

    return res
      .status(200)
      .json(new APIResponse(200, `successfully-remove-video`, {}));
  } catch (error) {
    console.log(`server issue:failed to delete video${error}`);
    return next(
      new APIError(500, `server issue:failed to delete video${error}`)
    );
  }
});

// title,description, isPublished
const updateVideoDetails = AsyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req?.params;
    const { title, description } = req?.body;
    if (!videoId)
      return next(new APIError(400, `Bad Request: video id missing`));

    const video = await Video.findById(videoId);
    if (!video)
      return next(new APIError(404, 'video could not found with given id'));

    const res = Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title: title || video.title,
          description: description || video.description,
        },
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!res) return next(new APIError(500, `server issue:Failed to update`));

    return res
      .status(200)
      .json(new APIResponse(200, `successfully updated`, { res }));
  } catch (error) {
    console.log(`error while updating user details ${error}`);
    return next(new APIError(500, 'server issue:', error));
  }
});

// ispublished
const toggleIsPublished = AsyncHandler(async (req, res, next) => {
  try {
    const { isPublished, videoId } = req.body;
    if (!videoId) return next(new APIError(400, `Bad Request:mising video id`));
    if (!isPublished)
      return next(new APIError(400, 'Bad Request missing isPublished state'));

    const video = Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          isPublished: isPublished,
        },
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!video)
      return next(new APIError(500, 'server issue:failed to change state'));

    return res
      .status(200)
      .json(new APIResponse(200, `successfully update state`, { video }));
  } catch (error) {
    console.log(`failed to change  published stats ${error}`);
    return next(
      new APIResponse(500, `server issue:failed change published stats${error}`)
    );
  }
});

// get-All-videos
const getAllVideos = AsyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    // do it later
    const pageVal = Number(page);
    const limitVal = Number(limit);
    const skipVal = (pageVal - 1) * limitVal;

    const videoArr = await Video.find().skip(skipVal).limit(limitVal);
    if (!videoArr) return next(new APIError(500, `failed to get All videos`));

    return res.status(200).json(
      new APIResponse(`successfully fetch videos`, {
        videos: videoArr,
      })
    );
  } catch (error) {
    console.log(`failed to get all videos${error}`);
    return next(new APIError(500, `failed to get All videos`));
  }
});
// thumbnail update
const updateThumbnail = AsyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req?.params;
    const thumbnail = req.file;
    if (!videoId) {
      try {
        fs.unlinkSync(thumbnail.path);
      } catch (error) {
        console.log(`file not found`);
      }
      return next(new APIError(400, `Bad Requst:video id missing`));
    }

    if (!thumbnail)
      return next(new APIError(400, `Bad Requst:thumbnail file missing`));

    const uploadThumbnail = await cloudinaryUpload(
      thumbnail.path,
      thumbnail.filename,
      thumbnail.mimetype,
      'image'
    );
    if (!uploadThumbnail) {
      return next(
        new APIError(500, `server issue:failed to upload thumbanail file`)
      );
    }

    const video = await Video.findById(videoId);
    if (!video) return next(new APIError(404, 'file not found'));

    video.thumbnail = updateThumbnail.url;
    await video.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new APIResponse(200, `thumbnail update successfully`, {}));
  } catch (error) {
    console.log(`failed to update thumbnail ${error}`);
    return next(
      new APIError(500, `server issue:failed to update thumbnail`, error)
    );
  }
});
export { createVideo, getVideo, updateVideo, deleteVideo };
