import e from 'express';

const playlistRouter = e.Router();
import { Authenticate } from '../middlewares/Auth.middlewares.js';
import {
	addVideoToPlaylist,
	createPlaylist,
	getPlaylistById,
	getUserPlaylists,
	removeVideoFromPlaylist,
} from '../controllers/Playlist.controllers.js';

playlistRouter.route('/create-playlist').post(Authenticate, createPlaylist);

playlistRouter
	.route('/get-user-playlist/:userId')
	.get(Authenticate, getUserPlaylists);

playlistRouter
	.route('/get-playlist/:playlistId')
	.get(Authenticate, getPlaylistById);

playlistRouter
	.route('/add-video-playlist')
	.post(Authenticate, addVideoToPlaylist);

playlistRouter
	.route('/remove-video-playlist')
	.delete(Authenticate, removeVideoFromPlaylist);
export { playlistRouter };
