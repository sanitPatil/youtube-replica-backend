import { LikeBy } from '../models/Likes.models.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { AsyncHandler } from '../utils/AsyncHandler.utils.js';

const toggleVideoLike = AsyncHandler(async (req, res, next) => {
	//TODO: toggle like on video
	try {
		const { videoId } = req.params;

		if (!videoId)
			return next(new APIError(400, `Bad Request: missing video id`));

		const exists = await LikeBy.findOne({
			video: videoId,
			likeby: req.user._id,
		});
		let state = '';
		if (exists) {
			state = await LikeBy.findByIdAndDelete(exists._id);
		} else {
			state = await LikeBy.create({
				video: videoId,
				likeby: req.user._id,
			});
		}

		return res.status(200).json(
			new APIResponse(200, `successfully-update-liked-state`, {
				state: state === '' ? true : state,
			})
		);
	} catch (error) {
		console.log(`server issue: failed to update like state`, error);
		return next(
			new APIError(500, `server issue: failed to update like state`, error)
		);
	}
});

const toggleCommentLike = AsyncHandler(async (req, res, next) => {
	//TODO: toggle like on comment
	try {
		const { commentId } = req.params;

		if (!commentId)
			return next(new APIError(400, `Bad Request: missing comment id`));

		const exists = await LikeBy.findOne({
			comment: commentId,
			likeby: req.user._id,
		});
		let state = '';
		if (exists) {
			state = await LikeBy.findByIdAndDelete(exists._id);
		} else {
			state = await LikeBy.create({
				comment: commentId,
				likeBy: req.user._id,
			});
		}

		return res
			.status(200)
			.json(
				new APIResponse(200, `successfully-update-comment-state`, { state })
			);
	} catch (error) {
		console.log(`server issue: failed to update comment state`, error);
		return next(
			new APIError(500, `server issue: failed to update comment state`, error)
		);
	}
});

const toggleTweetLike = AsyncHandler(async (req, res, next) => {
	//TODO: toggle like on tweet
	try {
		const { tweetId } = req.params;

		if (!tweetId)
			return next(new APIError(400, `Bad Request: missing tweet id`));

		const exists = await LikeBy.findOne({
			tweet: tweetId,
			likeby: req.user._id,
		});
		let state = '';
		if (exists) {
			state = await LikeBy.findByIdAndDelete(exists._id);
		} else {
			state = await LikeBy.create({
				tweet: tweetId,
				likeBy: req.user._id,
			});
		}

		return res
			.status(200)
			.json(new APIResponse(200, `successfully-update-tweet-state`, { state }));
	} catch (error) {
		console.log(`server issue: failed to update tweet state`, error);
		return next(
			new APIError(500, `server issue: failed to update tweet state`, error)
		);
	}
});

const getLikedVideos = AsyncHandler(async (req, res, next) => {
	//TODO: get all liked videos
	try {
		const likedVideos = await LikeBy.aggregate([
			{
				$match: {
					likeby: req.user._id,
				},
			},
			{
				$lookup: {
					from: 'videos',
					localField: 'video',
					foreignField: '_id',
					as: 'likedVideos',
					pipeline: [
						{
							$project: {
								_id: 1,
								title: 1,
								views: 1,
								description: 1,
								videoFile: 1,
								thumbnail: 1,
								duration: 1,
							},
						},
					],
				},
			},
			{
				$project: {
					_id: 0,
					likedVideos: 1,
				},
			},
		]);

		return res.status(200).json(
			new APIResponse(200, `successfully-retrive-liked-videos`, {
				list: likedVideos,
			})
		);
	} catch (error) {
		console.log(`failed to get liked videos `, error);
		return next(
			new APIError(500, `server failure: failed to get all liked videos`, error)
		);
	}
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
