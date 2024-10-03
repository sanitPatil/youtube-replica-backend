import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { Video } from '../models/Video.models.js';
import { Subscriptions } from '../models/Subscriptions.models.js';
import { User } from '../models/User.models.js';
import mongoose from 'mongoose';
const getChannelStats = AsyncHandler(async (req, res, next) => {
	// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
	try {
		const totalVideos = await Video.aggregate([
			{
				$match: {
					owner: req.user._id,
				},
			},
		]);

		const totalViews = await Video.aggregate([
			{
				$match: {
					owner: req.user._id,
				},
			},
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$views' },
				},
			},
			{
				$project: {
					_id: 0,
					totalViews: 1,
				},
			},
		]);

		const totalSubscribers = await Subscriptions.aggregate([
			{
				$match: {
					channel: req.user._id,
				},
			},
			{
				$group: {
					_id: null,
					subscribers: { $sum: 1 },
				},
			},
		]);

		const totalLikes = await Video.aggregate([
			{
				$match: {
					owner: req.user._id,
				},
			},
			{
				$lookup: {
					from: 'likebys',
					localField: '_id',
					foreignField: 'video',
					as: 'VideoLike',
				},
			},
			{
				$group: {
					_id: null,
					totalLikes: { $sum: 1 }, // NOTE:- Empty -1
				},
			},
			{
				$project: {
					_id: 0,
					totalLikes: 1,
				},
			},
		]);
		return res.status(200).json(
			new APIResponse(200, `successfully-retrive-stats`, {
				videos: totalVideos,
				views: totalViews[0],
				subscribers: totalSubscribers[0],
				likes: totalLikes[0],
			})
		);
	} catch (error) {
		console.log(`server failure: failed to get stats`, error);
		return next(
			new APIError(500, `server failure: failed to get stats`, error)
		);
	}
});

const getChannelVideos = AsyncHandler(async (req, res, next) => {
	// TODO: Get all the videos uploaded by the channel

	try {
		const { channelId } = req.params;
		if (!channelId)
			return next(new APIError(400, `Bad Request:missing channel id`));

		const channelVideos = await Video.aggregate([
			{
				$match: {
					owner: new mongoose.Types.ObjectId(channelId),
				},
			},
		]);
		//

		const owner = await User.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(channelId),
				},
			},
			{
				$project: {
					_id: 1,
					username: 1,
					avatar: 1,
				},
			},
		]);

		return res.status(200).json(
			new APIResponse(200, `successfully-retrive-videos-of-channel`, {
				owner,
				channelVideos,
			})
		);
	} catch (error) {
		console.log(`server failure:failed to load channels-all-videos`, error);
	}
});

export { getChannelStats, getChannelVideos };
