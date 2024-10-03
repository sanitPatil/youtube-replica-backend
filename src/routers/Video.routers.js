import e from 'express';
import { Authenticate } from '../middlewares/Auth.middlewares.js';
import {
	deleteVideo,
	getAllVideos,
	getVideoById,
	publishVideo,
	toggleIsPublished,
	updateThumbnail,
	updateVideo,
	updateVideoDetails,
} from '../controllers/Video.controllers.js';
import { upload } from '../middlewares/Multer.middlewares.js';
const videoRouter = e.Router();

videoRouter.route('/publish-video').post(
	Authenticate,
	upload.fields([
		{
			name: 'thumbnail',
			maxCount: 1,
		},
		{
			name: 'videoFile',
			maxCount: 1,
		},
	]),
	publishVideo
);
videoRouter.route('/get-video/:videoId').get(Authenticate, getVideoById);
videoRouter
	.route('/update-video/:videoId')
	.patch(Authenticate, upload.single('videoFile'), updateVideo);
videoRouter.route('/delete-video/:videoId').delete(Authenticate, deleteVideo);
videoRouter
	.route('/update-video-details/:videoId')
	.patch(Authenticate, updateVideoDetails);
videoRouter
	.route('/toggle-publish/:videoId')
	.patch(Authenticate, toggleIsPublished);
videoRouter.route('/get-all-videos').get(getAllVideos);
videoRouter
	.route('/update-thumbnail/:videoId')
	.patch(Authenticate, upload.single('thumbnail'), updateThumbnail);
export { videoRouter };
