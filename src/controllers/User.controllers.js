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

// GENERATE ACCESS AND REFRESH TOKEN
const generateAccessRefreshToken = async userId => {
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

// 1. register user
const registerUser = AsyncHandler(async (req, res, next) => {
  const { username, email, password, fullname } = req?.body;
  if (!username || !email || !password || !fullname) {
    return next(new APIError(400, 'Bad Request: Missing Required Fields!!!'));
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
    fs.unlinkSync(coverImage.path);
    fs.unlinkSync(avatar.path);
    console.log(error);
    return next(new APIError(500, 'server issue:', error));
  }

  if (checkUserExists) {
    if (coverImage.path) {
      fs.unlinkSync(coverImage.path);
    }
    if (avatar.path) {
      fs.unlinkSync(avatar.path);
    }
    return next(
      new APIError(
        400,
        'Bad Request: User With EMail and Username Already Exists!!!'
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
  if (!uploadCoverImage)
    return next(
      new APIError(500, 'Server Issue:failed to uplaod on cloudinary')
    );

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
    console.log(`error while registerating-user:${error}`);
  }
  if (!createUser)
    return next(new APIError(500, 'server issue:db failed to create user'));

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
    await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
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
    const user = req?.user;
    if (!user) return next(new APIError(401, 'Un-Autherized Access'));

    return res.status(200).json(
      new APIResponse(200, 'successfully-fetch-current-login-user-details', {
        user,
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
        username: req?.body.username || req?.user.username,
        fullname: req?.body?.fullname || req?.user?.fullname,
        email: req?.body?.email || req?.user?.email,
      },
      {
        new: true,
        omitUndefined: true,
      }
    ).select('-password -refreshToken');

    if (!user) return next(new APIError(500, `failed to update user details`));

    res
      .status(200)
      .json(new APIResponse(200, `user-details-update-successful`));
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
    console.log(coverUrl);

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
    return next(new APIError(500, 'server issue:', error));
  }
});

// 7. update-avatar
const updateAvatar = AsyncHandler(async (req, res, next) => {
  try {
    const avatar = req?.file;
    if (!avatar)
      return next(new APIError(400, `Bad Request: avatar image missing`));

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
    const avatarUrl = req?.user?.avatar?.split('/')[9].split('.')[0];
    console.log(avatarUrl);

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
      return next(new APIError(400, `password filed is missing`));

    const user = await User.findById(req?.user?._id);

    const isPasswordValid = await user.validatePassword(oldPassword);

    if (!isPasswordValid)
      return next(
        new APIError(401, `Un-Autherized Access: password does not match`)
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
    return next(new APIResponse(500, 'server issue', error));
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
};
