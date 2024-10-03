//  USER CONTROLLERS
import { AsyncHandler } from '../utils/AsyncHandler.utils.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { User } from '../models/User.models.js';
import {
	cloudinaryRemove,
	cloudinaryUpload,
} from '../utils/Cloudinary.utils.js';
import fs from 'node:fs';
import mongoose from 'mongoose';

// GENERATE ACCESS AND REFRESH TOKEN
const generateAccessRefreshToken = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = await user.generateAccessToken();
		const refreshToken = await user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		console.log(`failed to generate access and refresh token `);
	}
};
// GLOBAL METHOD
const removeLocalFile = (path) => {
	try {
		fs.unlinkSync(path);
	} catch (error) {
		console.log(`File Not Found:${error}`);
	}
};
// 1. register user
const registerUser = AsyncHandler(async (req, res, next) => {
	const { username, email, password, fullname } = req?.body;
	if (!username || !email || !password || !fullname) {
		return next(new APIError(400, 'Bad Request: Missing Required Fields!!!'));
	}

	if (!req.files || Object.keys(req.files).length === 0) {
		return next(new APIError(400, `required files are missing`));
	} else if (!req.files.coverImage || !req.files.coverImage[0]) {
		removeLocalFile(req.files.avatar[0].path);
		return next(new APIError(400, 'coverImage is required.'));
	} else if (!req.files.avatar || !req.files.avatar[0]) {
		removeLocalFile(req.files.coverImage[0].path);
		return next(new APIError(400, 'avatar is required.'));
	}

	const files = req?.files;
	const coverImage = files.coverImage[0];
	const avatar = files.avatar[0];

	let checkUserExists = '';
	try {
		checkUserExists = await User.findOne({
			$or: [{ username }, { email }],
		});
	} catch (error) {
		removeLocalFile(coverImage.path);
		removeLocalFile(avatar.path);
		return next(new APIError(500, 'server issue:failed to find user', error));
	}

	if (checkUserExists) {
		removeLocalFile(coverImage.path);
		removeLocalFile(avatar.path);
		return next(
			new APIError(
				400,
				'Bad Request: User With Email and Username Already Exists!!!'
			)
		);
	}

	const uploadCoverImage = await cloudinaryUpload(
		coverImage.path,
		coverImage.filename,
		coverImage.mimetype,
		coverImage.mimetype.split('/')[0]
	);
	if (!uploadCoverImage)
		return next(
			new APIError(500, 'Server Issue:failed to uplaod on cloudinary')
		);

	const uploadAvatar = await cloudinaryUpload(
		avatar.path,
		avatar.filename,
		avatar.mimetype,
		avatar.mimetype.split('/')[0]
	);
	if (!uploadCoverImage) {
		const coverResource = uploadCoverImage.split('/')[9].split('.')[0];
		await cloudinaryRemove(coverResource, 'image');
		return next(
			new APIError(500, 'Server Issue:failed to uplaod on cloudinary')
		);
	}

	let createUser = '';
	try {
		createUser = await User.create({
			username,
			fullname,
			password,
			email,
			avatar: uploadAvatar?.url || '',
			coverImage: uploadCoverImage?.url || '',
		});
	} catch (error) {
		const avatarResource = uploadAvatar.split('/')[9].split('.')[0];
		const coverResource = uploadCoverImage.split('/')[9].split('.')[0];
		await cloudinaryRemove(avatarResource, 'image');
		await cloudinaryRemove(coverResource, 'image');
		console.log(`error while registerating-user:${error}`);
	}
	if (!createUser) {
		const avatarResource = uploadAvatar.split('/')[9].split('.')[0];
		const coverResource = uploadCoverImage.split('/')[9].split('.')[0];
		await cloudinaryRemove(avatarResource, 'image');
		await cloudinaryRemove(coverResource, 'image');
		return next(new APIError(500, 'server issue:db failed to create user'));
	}

	const getUser = await User.findOne({ _id: createUser._id }).select(
		'-password -refreshToken'
	);
	if (!getUser) {
		return next(new APIError(500, 'server issue:failed to get created user'));
	}

	return res
		.status(201)
		.json(new APIResponse(201, 'user-created-successfully', { getUser }));
});

// 2. login user
const loginUser = AsyncHandler(async (req, res, next) => {
	try {
		const { email, password } = req?.body;

		if (!email || !password)
			return next(
				new APIError(400, 'Bad request: Email and Password required')
			);

		const user = await User.findOne({ email });
		if (!user)
			return next(new APIError(404, 'user with this email not found!!!'));

		const isPasswordValid = await user.validatePassword(password);

		if (!isPasswordValid) {
			return next(new APIError(401, 'Authentication failed: invalid password'));
		}

		const { accessToken, refreshToken } = await generateAccessRefreshToken(
			user._id
		);

		const loggedInUser = await User.findById(user._id).select(
			'-password -refreshToken'
		);

		const httpOptions = {
			httpOnly: true,
			secure: true,
		};

		return res
			.cookie('accessToken', accessToken, httpOptions)
			.cookie('refreshToken', refreshToken, httpOptions)
			.status(200)
			.json(
				new APIResponse(200, 'user-successfully-logged-in', {
					user: loggedInUser,
					accessToken,
					refreshToken,
				})
			);
	} catch (error) {
		console.log(`login user failed ${error}`);
		return next(new APIError(500, `server issue:failed to login`));
	}
});

// 3. logout user
const logoutUser = AsyncHandler(async (req, res, next) => {
	try {
		await User.findByIdAndUpdate(req?.user?._id, {
			$unset: {
				refreshToken: 1,
			},
		});
		const httpOptions = {
			httpOnly: true,
			secure: true,
		};

		return res
			.status(200)
			.clearCookie('accessToken', httpOptions)
			.clearCookie('refreshToken', httpOptions)
			.json(new APIResponse(200, 'user-logout-successfully', {}));
	} catch (error) {
		return next(new APIError(500, 'server issue:failed to logout!!! '));
	}
});

// 4. get current login user
const getCurrentUserDetails = AsyncHandler(async (req, res, next) => {
	try {
		return res.status(200).json(
			new APIResponse(200, 'successfully-fetch-current-login-user-details', {
				user: req.user,
			})
		);
	} catch (error) {
		console.log(`server issue: failed to get-current-user ${error}`);
		return next(
			new APIError(500, 'server issue: failed to get-current-user', error)
		);
	}
});

// 5. update-user-details
const updateUserDetails = AsyncHandler(async (req, res, next) => {
	try {
		if (!req?.body)
			return next(new APIError(400, 'Bad Request:fields are missing'));

		const user = await User.findByIdAndUpdate(
			req?.user?._id,
			{
				$set: {
					username: req?.body.username || req?.user.username,
					fullname: req?.body?.fullname || req?.user?.fullname,
					email: req?.body?.email || req?.user?.email,
				},
			},
			{
				new: true,
				omitUndefined: true,
			}
		).select('-password -refreshToken');

		if (!user) return next(new APIError(500, `failed to update user details`));

		res
			.status(200)
			.json(new APIResponse(200, `user-details-update-successful`, { user }));
	} catch (error) {
		console.log(`failed to update details`, error);
		return next(new APIResponse(500, `server issue:${error}`));
	}
});

// 6. update-cover-image

const updateCoverImage = AsyncHandler(async (req, res, next) => {
	try {
		const coverImage = req?.file;
		if (!coverImage)
			return next(new APIError(400, `Bad Request: cover image missing`));

		const uploadRes = await cloudinaryUpload(
			coverImage.path,
			coverImage.filename,
			coverImage.mimetype,
			coverImage.mimetype.split('/')[0]
		);
		if (!uploadRes)
			return next(
				new APIError(500, `server issue:failed to upload image on cloud`)
			);

		const coverUrl = req?.user?.coverImage?.split('/')[9].split('.')[0];
		const remResource = await cloudinaryRemove(coverUrl, 'image');

		if (!remResource) console.log(`failed to remove resource`);

		const userUpdate = await User.findByIdAndUpdate(
			req?.user?._id,
			{
				$set: { coverImage: uploadRes.url || '' },
			},
			{ new: true, omitUndefined: true }
		).select('-password -refreshToken');

		if (!userUpdate)
			return next(
				new APIError(500, 'server issue:failed to update cover-image')
			);

		req.user = userUpdate;

		return res
			.status(200)
			.json(new APIResponse(200, 'update-cover-image-successfully', {}));
	} catch (error) {
		console.log(`failed to update coverImage${error}`);
		return next(
			new APIError(500, 'server issue:failed to update cover-image', error)
		);
	}
});

// 7. update-avatar
const updateAvatar = AsyncHandler(async (req, res, next) => {
	try {
		const avatar = req?.file;
		if (!avatar)
			return next(new APIError(400, `Bad Request: avatar image missing`));

		const uploadRes = await cloudinaryUpload(
			avatar.path,
			avatar.filename,
			avatar.mimetype,
			avatar.mimetype.split('/')[0]
		);
		if (!uploadRes)
			return next(
				new APIError(500, `server issue:failed to upload image on cloud`)
			);
		const avatarUrl = req?.user?.avatar?.split('/')[9].split('.')[0];
		const remResource = await cloudinaryRemove(avatarUrl, 'image');

		if (!remResource) console.log(`failed to remove resource`);

		const userUpdate = await User.findByIdAndUpdate(
			req?.user?._id,
			{
				$set: { avatar: uploadRes.url || '' },
			},
			{ new: true, omitUndefined: true }
		).select('-password -refreshToken');

		if (!userUpdate)
			return next(
				new APIError(500, 'server issue:failed to update avatar-image')
			);
		req.user = userUpdate;
		return res
			.status(200)
			.json(new APIResponse(200, 'update-avatar-image-successfully', {}));
	} catch (error) {
		console.log(`failed to update avavar-image${error}`);
		return next(new APIError(500, 'server issue:', error));
	}
});

// 8. update password
const updatePassword = AsyncHandler(async (req, res, next) => {
	try {
		const { oldPassword, newPassword } = req?.body;
		if (!oldPassword || !newPassword)
			return next(new APIError(400, `password fields are missing`));

		const user = await User.findById(req?.user?._id);

		const isPasswordValid = await user.validatePassword(oldPassword);

		if (!isPasswordValid)
			return next(
				new APIError(401, `In-valid password. Password does not match`)
			);

		user.password = newPassword;
		await user.save({ validateBeforeSave: false });
		res
			.status(200)
			.json(new APIResponse(200, `password-update-successfully`, {}));
	} catch (error) {
		console.log(`server issue:${error}`);
		return next(new APIError(500, `server issue:${error}`));
	}
});

// 9. delete-account
const deleteAccount = AsyncHandler(async (req, res, next) => {
	try {
		const { password } = req?.body;
		if (!password)
			return next(new APIError(400, `Bad Request: password field Missing`));

		const user = await User.findById(req?.user._id);
		const isPasswordValid = await user.validatePassword(password);
		if (!isPasswordValid)
			return next(new APIError(401, 'Bad Request password invalid'));

		const avatarUrl = req?.user?.avatar?.split('/')[9].split('.')[0];

		const remRes = await cloudinaryRemove(avatarUrl, 'image');
		if (!remRes) console.log(`failed to remove resource`);

		const coverUrl = req?.user?.coverImage?.split('/')[9].split('.')[0];

		const remResource = await cloudinaryRemove(coverUrl, 'image');
		if (!remResource) console.log(`failed to remove resource`);

		const res = await User.findByIdAndDelete(req?.user?._id);
		if (!res)
			return next(new APIError(500, 'server issue:Failed to remove user'));

		const httpOptions = {
			secure: true,
			httpOnly: true,
		};
		res
			.clearCookie('accessToken', httpOptions)
			.clearCookie('refreshToken', httpOptions)
			.status(200)
			.json(new APIResponse(200, `User-Deleted-Successfully`, {}));
	} catch (error) {
		console.log('delete-account', error);
		return next(new APIError(500, 'server issue', error));
	}
});

// 10 .watch history
const getWatchHisotry = AsyncHandler(async (req, res, next) => {
	try {
		const watchList = await User.aggregate([
			{
				$match: { _id: new mongoose.Types.ObjectId(req.user._id) },
			},
			{
				$lookup: {
					from: 'videos',
					localField: 'watchHistory',
					foreignField: '_id',
					as: 'watchList',
					pipeline: [
						{
							$lookup: {
								from: 'users',
								localField: 'owner',
								foreignField: '_id',
								as: 'owner',
								pipeline: [
									{
										$project: {
											_id: 1,
											username: 1,
											avatar: 1,
										},
									},
								],
							},
						},
						{
							$addFields: {
								owner: { $first: '$owner' },
							},
						},
					],
				},
			},

			{
				$project: {
					watchList: 1,
					_id: 0,
				},
			},
		]);
		console.log(watchList);

		return res.status(200).json(
			new APIResponse(200, `successfully fetch watch history`, {
				watchList,
			})
		);
	} catch (error) {
		console.log(`failed to get watch  history${error}`);
		return next(new APIError(500, `failed to get watch hisotry`, error));
	}
});

// 11. get-user-channel-profile
const getUserChannelProfile = AsyncHandler(async (req, res, next) => {
	try {
		const { username } = req.body;

		if (!username.trim())
			return next(new APIError(400, `Bad Request:missing username`));

		const channelProfile = await User.aggregate([
			{
				$match: {
					username: username?.toLowerCase(),
				},
			},
			{
				$lookup: {
					from: 'subscriptions',
					localField: '_id',
					foreignField: 'channel',
					as: 'subscribers',
				},
			},
			{
				$lookup: {
					from: 'subscriptions',
					localField: '_id',
					foreignField: 'subscriber',
					as: 'subscribeTo',
				},
			},
			{
				$addFields: {
					subscribersCount: {
						$size: '$subscribers',
					},
					channelsSubscribedToCount: {
						$size: '$subscribeTo',
					},
					isSubscribed: {
						$cond: {
							if: { $in: [req?.user._id, '$subscribers.subscriber'] },
							then: true,
							else: false,
						},
					},
				},
			},
			{
				$project: {
					fullName: 1,
					username: 1,
					subscribersCount: 1,
					channelsSubscribedToCount: 1,
					isSubscribed: 1,
					avatar: 1,
					coverImage: 1,
					email: 1,
				},
			},
		]);
		return res
			.status(200)
			.json(
				new APIResponse(
					200,
					`successfully-fetch-channel-profile`,
					channelProfile
				)
			);
	} catch (error) {
		console.log(`server issue failed to get channel details`, error);
		return next(new APIError(500, `failed to get user channel profile`));
	}
});
export {
	registerUser,
	loginUser,
	logoutUser,
	getCurrentUserDetails,
	updateUserDetails,
	updateCoverImage,
	updateAvatar,
	updatePassword,
	deleteAccount,
	getWatchHisotry,
	getUserChannelProfile,
};
