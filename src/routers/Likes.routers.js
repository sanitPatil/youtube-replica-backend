import e from 'express';
import {
	getLikedVideos,
	toggleVideoLike,
} from '../controllers/Likes.controllers.js';
import { Authenticate } from '../middlewares/Auth.middlewares.js';
const likeRouter = e.Router();

likeRouter
	.route('/toggle-video-like/:videoId')
	.get(Authenticate, toggleVideoLike);
likeRouter.route('/get-liked-videos').get(Authenticate, getLikedVideos);
export { likeRouter };
