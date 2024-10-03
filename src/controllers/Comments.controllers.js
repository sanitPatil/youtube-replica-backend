import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { Comment } from '../models/Comments.models.js';
import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
const getVideoComments = AsyncHandler(async (req, res, next) => {
	try {
		//TODO: get all comments for a video
		const { videoId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		if (!videoId)
			return next(new APIError(400, `Bad request: missing video id`));

		const skip = (Number(page) - 1) * limit;

		const commentList = await Comment.find({ video: videoId })
			.skip(skip)
			.limit(Number(limit));

		return res
			.status(200)
			.json(new APIResponse(200, `success-retrive-comments`, { commentList }));
	} catch (error) {
		console.log(`server failed to load comments`, error);
		return next(
			new APIError(500, `saerver failed: failed to load comments`, error)
		);
	}
});

const addComment = AsyncHandler(async (req, res, next) => {
	// TODO: add a comment to a video content video-link owner-user
	try {
		const { videoId } = req.params;
		if (!videoId)
			return next(new APIError(400, `Bad Request: missing video id`));
		const { content } = req.body;
		if (!content)
			return next(new APIError(400, 'Bad Request:Missing comment field'));

		const comment = await Comment.create({
			content,
			video: videoId,
			owner: req.user._id,
		});

		return res
			.status(200)
			.json(new APIResponse(200, `succesfully add comment`, { comment }));
	} catch (error) {
		console.log(`server issue:failed to add comment`, error);
		return next(
			new APIError(500, `server issue: failed to add comment`, error)
		);
	}
});

const updateComment = AsyncHandler(async (req, res, next) => {
	try {
		// TODO: update a comment
		const { commentId, content } = req.body;

		if (!commentId)
			return next(new APIError(400, 'Bad Request: missing comment id'));

		if (!content)
			return next(new APIError(400, 'Bad Request: missing content '));

		const comment = await Comment.findOne({
			_id: commentId,
			owner: req.user._id,
		});

		if (!comment)
			return next(
				new APIError(
					401,
					`Unautorized Access, you don't have rights to update this comment, you are not the owner`
				)
			);

		comment.content = content;
		await comment.save({ validateBeforeSave: true });

		return res
			.status(200)
			.json(new APIResponse(200, `update-comment-successfully`, { comment }));
	} catch (error) {
		console.log(`server issue:failed to update comment`, error);
		return next(new APIError(500, 'server failed to update comment', error));
	}
});

const deleteComment = AsyncHandler(async (req, res, next) => {
	try {
		const { commentId } = req.params;

		if (!commentId)
			return next(new APIError(400, `bad request missing comment id`));

		const comment = await Comment.findOne({
			_id: commentId,
			owner: req.user._id,
		});

		if (!comment)
			return next(
				new APIError(
					401,
					`forbidden Access: requested user is not the owner of this comment`
				)
			);

		const delResponse = await Comment.findByIdAndDelete(comment._id);
		if (!delResponse)
			return next(
				new APIError(500, `server failure:failed to delete comment try again`)
			);

		return res
			.status(200)
			.json(
				new APIResponse(200, `succesfully-delete-comment`, { success: true })
			);
	} catch (error) {
		console.log(`failed to delete comment:${error}`);
		return next(
			new APIError(500, `server failure:failed to delete comment`, error)
		);
	}
});

export { getVideoComments, addComment, updateComment, deleteComment };
