import e from 'express';
const commentRouter = e.Router();
import { Authenticate } from '../middlewares/Auth.middlewares.js';
import {
	addComment,
	deleteComment,
	getVideoComments,
	updateComment,
} from '../controllers/Comments.controllers.js';

commentRouter.route('/get-comments/:videoId').get(getVideoComments);
commentRouter.route('/add-comment/:videoId').post(Authenticate, addComment);
commentRouter.route('/update-comment').post(Authenticate, updateComment);
commentRouter
	.route('/delete-comment/:commentId')
	.post(Authenticate, deleteComment);
export { commentRouter };
