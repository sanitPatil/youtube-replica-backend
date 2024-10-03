import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
import { Playlist } from '../models/Playlist.models.js';
import mongoose from 'mongoose';

// 1. create playlist
const createPlaylist = AsyncHandler(async (req, res, next) => {
	//TODO: create playlist
	try {
		const { name, description } = req.body;
		if (!name || !description)
			return next(
				new APIError(400, `Bad Request:missing name and description!!!`)
			);

		const list = await Playlist.create({
			name,
			description,
			owner: req.user._id,
		});

		return res
			.status(200)
			.json(new APIResponse(200, `successfully-create-playList`, { list }));
	} catch (error) {
		console.log(`server issue:failed to create playlist`, error);
		return next(
			new APIError(500, `server issue: failed to create play list`, error)
		);
	}
});

// 2. get-user-playlist
const getUserPlaylists = AsyncHandler(async (req, res, next) => {
	//TODO: get user playlists
	try {
		const { userId } = req.params;

		if (!userId) return next(new APIError(400, `Bad Requet: missing userId`));

		const userPlayList = await Playlist.aggregate([
			{
				$match: {
					owner: new mongoose.Types.ObjectId(userId),
				},
			},
		]);

		return res.status(200).json(
			new APIResponse(200, `successfully-retrive-user-playlists`, {
				playlist: userPlayList,
			})
		);
	} catch (error) {
		console.log(`server issue:failed to get playlist`, error);
		return next(
			new APIError(500, `server issue: failed to get play list`, error)
		);
	}
});

// 3. get-play-list-by-id
const getPlaylistById = AsyncHandler(async (req, res, next) => {
	//TODO: get playlist by id

	try {
		const { playlistId } = req.params;
		if (!playlistId)
			return next(new APIError(400, `Bad Request: missing playlist id`));

		const playlist = await Playlist.findById(playlistId);

		return res
			.status(200)
			.json(
				new APIResponse(200, `successfully retrive playlist`, { playlist })
			);
	} catch (error) {
		console.log(`server issue:failed to get play-list-by-id playlist`, error);
		return next(
			new APIError(
				500,
				`server issue: failed to get-play-list-by-id play list`,
				error
			)
		);
	}
});

// 4. add-video-to-play-list
const addVideoToPlaylist = AsyncHandler(async (req, res, next) => {
	try {
		const { playlistId, videoId } = req.body;

		if (!playlistId || !videoId)
			return next(
				new APIError(400, `Bad Reuqest: missing playlist id and video id`)
			);

		const playlist = await Playlist.findOne({
			_id: playlistId,
			owner: req.user._id,
		});

		if (!playlist)
			return next(new APIError(401, 'You dont have access to the playList'));

		if (!playlist.videos.includes(videoId)) {
			playlist.videos.push(videoId);
			await playlist.save({ validateBerforeSave: false });
		}

		const list = await Playlist.findById(playlist._id);
		return res.status(200).json(
			new APIResponse(200, `successfully-add-video-to-playlist`, {
				playlist: list,
			})
		);
	} catch (error) {
		console.log(`server issue:failed to add video to playlist`, error);
		return next(
			new APIError(500, `server issue: failed to add video to play list`, error)
		);
	}
});

// 5. remove-video-from-play-list
const removeVideoFromPlaylist = AsyncHandler(async (req, res, next) => {
	// TODO: remove video from playlist
	try {
		const { playlistId, videoId } = req.body;

		if (!playlistId || !videoId)
			return next(
				new APIError(400, `Bad Reuqest Missing playlist id and video Id`)
			);

		const isOwner = await Playlist.findOne({
			_id: playlistId,
			owner: req.user._id,
		});

		if (!isOwner) return next(401, `You Don't have Access!!!`);

		const remVideo = await Playlist.findByIdAndUpdate(
			isOwner._id,
			{
				$pull: {
					videos: videoId,
				},
			},
			{ new: true }
		);

		return res.status(200).json(
			new APIResponse(200, `successfully-remove-video-from-playlist`, {
				playlist: remVideo,
			})
		);
	} catch (error) {
		console.log(`server issue:failed to remove video from playlist`, error);
		return next(
			new APIError(
				500,
				`server issue: failed to remove video from play list`,
				error
			)
		);
	}
});

// 6. delete-playlist
const deletePlaylist = AsyncHandler(async (req, res, next) => {
	// TODO: delete playlist
	try {
		const { playlistId } = req.params;
		if (!playlistId)
			return next(
				new APIResponse(200).json(200, `Bad Request: missing playlist id`)
			);

		const isOwner = await Playlist.findOne({
			_id: playlistId,
			owner: req.user._id,
		});

		if (!isOwner) return next(new APIError(401, 'Un-Authorized Access!!!'));

		const removeList = await Playlist.findByIdAndDelete(playlistId);

		return res
			.status(200)
			.json(new APIResponse(200, `successfully-removed-list`, {}));
	} catch (error) {
		console.log(`server issue:failed to delete playlist`, error);
		return next(
			new APIError(500, `server issue: failed to delete play list`, error)
		);
	}
});

// 7. update-playlist
const updatePlaylist = AsyncHandler(async (req, res, next) => {
	//TODO: update playlist
	try {
		const { playlistId } = req.params;
		const { name, description } = req.body;

		if (!playlistId)
			return next(new APIError(400, `Bad Request: missing playlist id`));

		if (!description)
			return next(
				new APIError(400, `Bad Request: missing playlist description`)
			);

		const isOwner = await Playlist.findOne({
			_id: playlistId,
			owner: req.user._id,
		});

		if (!isOwner) return next(new APIError(401, `Un-Autherized Access!!!`));

		const list = await Playlist.findByIdAndUpdate(
			playlistId,
			{
				name: name || isOwner.name,
				description: description || isOwner.description,
			},
			{
				new: true,
			}
		);

		return res
			.status(200)
			.json(
				new APIResponse(200, `successfully-update-list`, { playlist: list })
			);
	} catch (error) {
		console.log(`server issue:failed to update-playlist`, error);
		return next(
			new APIError(500, `server issue: failed to update-play list`, error)
		);
	}
});

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	deletePlaylist,
	updatePlaylist,
};
