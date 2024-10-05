import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import {
	cloudinaryRemove,
	cloudinaryUpload,
} from '../utils/Cloudinary.utils.js';
import fs from 'node:fs';
import { Video } from '../models/Video.models.js';
import { User } from '../models/User.models.js';

const removeLocalPath = (path) => {
	try {
		fs.unlinkSync(path);
	} catch (error) {
		console.log(`file not found`);
	}
};
// 1. video save
const publishVideo = AsyncHandler(async (req, res, next) => {
	try {
		const { title, description, isPublished } = req?.body;

		if (!title || !description) {
			removeLocalPath(thumbnail.path);
			removeLocalPath(videoFile.path);
			return next(
				new APIError(
					400,
					`Bad Request:title and description fileds are missing!`
				)
			);
		}

		const files = req?.files;
		if (!files || Object.keys(files).length === 0) {
			return next(new APIError(400, `Bad Reqeuest:missing files`));
		} else if (!files.thumbnail || !files?.thumbnail[0]) {
			removeLocalPath(files?.videoFile[0]?.path);
			return next(new APIError(400, `Bad Reqeuest:missing thumbnail files`));
		} else if (!files.videoFile || !files.videoFile[0]) {
			removeLocalPath(files?.thumbnail[0]?.path);
			return next(new APIError(400, `Bad Reqeuest:missing video files`));
		}

		const thumbnail = files?.thumbnail[0];
		const videoFile = files?.videoFile[0];

		const uploadThumbnail = await cloudinaryUpload(
			thumbnail.path,
			thumbnail.filename,
			thumbnail.mimetype,
			thumbnail.mimetype.split('/')[0]
		);
		if (!uploadThumbnail) {
			return next(new APIError(500, `server issue failed to uplaod thumbnail`));
		}
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

		if (!videoSave) {
			const thumbnailUrl = uploadThumbnail.url.split('/')[9].split('.')[0];
			await cloudinaryRemove(thumbnailUrl, 'image');

			const videoFileUrl = uploadVideoFile.url.split('/')[9].split('.')[0];
			await cloudinaryRemove(videoFileUrl, 'video');

			return next(
				new APIError(500, `server issue failed to upload video object`)
			);
		}

		return res
			.status(200)
			.json(new APIResponse(200, 'video-save-successfully', videoSave));
	} catch (error) {
		console.log('video-create-error:', error);
		return next(new APIError(500, 'failed to create video', error));
	}
});

// 2. get video by id
const getVideoById = AsyncHandler(async (req, res, next) => {
	try {
		const { videoId } = req?.params;
		if (!videoId)
			return next(new APIError(400, 'Bad Request:video-Id is Missing'));

		const videoFile = await Video.findById(videoId);

		if (!videoFile)
			return next(new APIError(500, 'failed to get requested Video'));

		const user = await User.findOne(req.user._id);

		if (!user.watchHistory.includes(videoId)) {
			user.watchHistory.push(videoId);
			await user.save({ validateBeforeSave: false });
		}

		const video = await Video.findByIdAndUpdate(
			videoFile._id,
			{
				$inc: { views: 1 },
			},
			{ new: true, validateBeforeSave: false }
		);
		return res
			.status(200)
			.json(new APIResponse(200, 'video-fetch-successfully', { video }));
	} catch (error) {
		console.log(`video-get-error-${error}`);
		return next(new APIError(500, 'failed to load requested video', error));
	}
});

// 3. update video by id
const updateVideo = AsyncHandler(async (req, res, next) => {
	try {
		const { videoId } = req?.params;
		const videoFile = req?.file;
		if (!videoId) {
			removeLocalPath(videoFile.path);
			return next(new APIError(400, `Bad Request: video id is missing`));
		}
		if (!videoFile)
			return next(new APIError(400, `Bad Request: video file is missing`));

		const video = await Video.findById({ _id: videoId, owner: req.user._id });

		if (!video) {
			removeLocalPath(videoFile.path);
			return next(
				new APIError(
					500,
					`Current Login user is not owner of the video to perform this Operations`
				)
			);
		}

		const uploadVideoFile = await cloudinaryUpload(
			videoFile.path,
			videoFile.filename,
			videoFile.mimetype,
			videoFile.mimetype.split('/')[0]
		);
		if (!uploadVideoFile) {
			return next(new APIError(500, `server issue failed to uplaod videoFile`));
		}

		const videoFileUrl = video?.videoFile?.split('/')[9].split('.')[0];

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

		const video = await Video.findOneAndDelete({
			_id: videoId,
			owner: req.user._id,
		});
		if (!video)
			return next(
				new APIError(401, 'Un-Autherized Access. you are not the owner')
			);

		const videoUrl = video.videoFile.split('/')[9].split('.')[0];
		const thumbnailUrl = video.thumbnail.split('/')[9].split('.')[0];

		if (videoUrl) {
			await cloudinaryRemove(videoUrl, 'video');
		}
		if (thumbnailUrl) {
			await cloudinaryRemove(thumbnailUrl, 'image');
		}

		await Video.findByIdAndDelete(video._id);
		return res
			.status(200)
			.json(new APIResponse(200, `successfully deleted requested video`, {}));
	} catch (error) {
		console.log(`server issue:failed to delete video${error}`);
		return next(
			new APIError(500, `server issue:failed to delete video${error}`)
		);
	}
});

//5. title,description
const updateVideoDetails = AsyncHandler(async (req, res, next) => {
	try {
		const { videoId } = req?.params;
		const { title, description } = req?.body;
		if (!description || !title) {
			return next(
				new APIError(400, `Bad Request: missing title description missing`)
			);
		}
		if (!videoId)
			return next(new APIError(400, `Bad Request: video id missing`));

		const video = await Video.findOne({ _id: videoId, owner: req.user._id });
		if (!video)
			return next(
				new APIError(404, 'current loggin user is Not Owner of the video!')
			);

		const updateRes = await Video.findByIdAndUpdate(
			video._id,
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
			.json(new APIResponse(200, `successfully updated`, { updateRes }));
	} catch (error) {
		console.log(`error while updating user details ${error}`);
		return next(new APIError(500, 'server issue:', error));
	}
});

//6. ispublished
const toggleIsPublished = AsyncHandler(async (req, res, next) => {
	try {
		const { videoId } = req.params;
		const { isPublished } = req.body;
		if (!videoId) return next(new APIError(400, `Bad Request:mising video id`));

		if (typeof isPublished !== 'boolean')
			return next(new APIError(400, 'Bad Request missing isPublished state'));

		const video = await Video.findOne({ _id: videoId, owner: req.user._id });
		if (!video) {
			return next(
				new APIError(
					401,
					`current loggin user is NOT onwer of this video, Unathorized operation`
				)
			);
		}

		const updateRes = await Video.findByIdAndUpdate(
			video._id,
			{
				$set: {
					isPublished: isPublished,
				},
			},
			{ new: true }
		).select('-password -refreshToken');

		if (!updateRes)
			return next(new APIError(500, 'server issue:failed to change state'));

		return res
			.status(200)
			.json(
				new APIResponse(200, `successfully update state`, { video: updateRes })
			);
	} catch (error) {
		console.log(`failed to change  published stats ${error}`);
		return next(
			new APIResponse(500, `server issue:failed change published stats${error}`)
		);
	}
});

//7. get-All-videos
const getAllVideos = AsyncHandler(async (req, res, next) => {
	try {
		const videoArr = await Video.find();
		// TODO: PAGINATION,QUERY-SERACH
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
//8. thumbnail update
const updateThumbnail = AsyncHandler(async (req, res, next) => {
	try {
		const { videoId } = req?.params;
		const thumbnail = req.file;

		if (!videoId) {
			removeLocalPath(thumbnail.path);
			return next(new APIError(400, `Bad Requst:video id missing`));
		}

		if (!thumbnail)
			return next(new APIError(400, `Bad Requst:thumbnail file missing`));

		const video = await Video.findOne({ _id: videoId, owner: req.user._id });

		if (!video) {
			removeLocalPath(thumbnail.path);
			return next(
				new APIError(401, `Current loggin user is NOT owner of the video`)
			);
		}

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
		const prevThumbnailUrl = video.thumbnail.split('/')[9].split('.')[0];

		const updateThumbnailRes = await Video.findByIdAndUpdate(
			video._id,
			{
				$set: {
					thumbnail: uploadThumbnail.url,
				},
			},
			{ new: true }
		);

		await cloudinaryRemove(prevThumbnailUrl, 'image');

		return res.status(200).json(
			new APIResponse(200, `thumbnail update successfully`, {
				video: updateThumbnailRes,
			})
		);
	} catch (error) {
		console.log(`failed to update thumbnail ${error}`);
		return next(
			new APIError(500, `server issue:failed to update thumbnail`, error)
		);
	}
});

export {
	publishVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	updateVideoDetails,
	toggleIsPublished,
	getAllVideos,
	updateThumbnail,
};
