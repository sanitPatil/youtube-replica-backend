import e from 'express';
import {
	deleteAccount,
	getCurrentUserDetails,
	getUserChannelProfile,
	getWatchHisotry,
	loginUser,
	logoutUser,
	registerUser,
	updateAvatar,
	updateCoverImage,
	updatePassword,
	updateUserDetails,
} from '../controllers/User.controllers.js';
import { upload } from '../middlewares/Multer.middlewares.js';
import { Authenticate } from '../middlewares/Auth.middlewares.js';
const userRouter = e.Router();

userRouter.route('/register').post(
	upload.fields([
		{
			name: 'coverImage',
			maxCount: 1,
		},
		{
			name: 'avatar',
			maxCount: 1,
		},
	]),
	registerUser
);
userRouter.route('/login').post(loginUser);

userRouter.route('/logout').get(Authenticate, logoutUser);

userRouter.route('/get-login-user').get(Authenticate, getCurrentUserDetails);

userRouter.route('/update-user-details').patch(Authenticate, updateUserDetails);

userRouter
	.route('/update-cover-image')
	.patch(Authenticate, upload.single('coverImage'), updateCoverImage);

userRouter
	.route('/update-avatar')
	.patch(Authenticate, upload.single('avatar'), updateAvatar);
userRouter.route('/update-password').patch(Authenticate, updatePassword);
userRouter.route('/watch-history').get(Authenticate, getWatchHisotry);
userRouter
	.route('/get-channel-profile')
	.get(Authenticate, getUserChannelProfile);
userRouter.route('/delete-account').delete(Authenticate, deleteAccount);
export { userRouter };
