//  USER CONTROLLERS
import { AsyncHandler } from "../utils/AsyncHandler.utils.js";
import { APIError } from "../utils/APIError.utils.js";
import { APIResponse } from "../utils/APIResponse.utils.js";
import { User } from "../models/User.models.js";
import { cloudinaryUpload } from "../utils/Cloudinary.utils.js";
import fs from "node:fs";
// 1. register user
const registerUser = AsyncHandler(async (req, res, next) => {
  //username, email,password, fullname,coverimage, avatar
  //ALGORITHM
  // 1. CHECK FOR EMPTY {USERNAME,EMAIL,PASSWORD,FULLNAME,COVERIMAGE,AVATAR}
  // 2. USERNAME &EMAIL EXISTS OR NOT
  // 3. COVER IMAGE AND AVATAR GET
  // 3. COVERIMAGE AND AVATAR UPLOAD ON CLOUD GET THE URL
  // 4. SAVE TO DB
  // 5 .REMOVE PASSWORD AND REFRESH TOKEN FILED FROM RESPONSE
  // 6. RETURN RES TO USER

  const { username, email, password, fullname } = req?.body;
  if (!username || !email || !password || !fullname) {
    return next(new APIError(400, "Bad Request: Missing Required Fields!!!"));
  }
  const files = req?.files;
  const coverImage = files.coverImage[0];
  const avatar = files.avatar[0];
  let checkUserExists = "";
  try {
    checkUserExists = await User.findOne({
      $or: [{ username }, { email }],
    });
  } catch (error) {
    fs.unlinkSync(coverImage.path);
    fs.unlinkSync(avatar.path);
    console.log(error);
    return next(new APIError(500, "server issue:", error));
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
        "Bad Request: User With EMail and Username Already Exists!!!"
      )
    );
  }

  const uploadCoverImage = await cloudinaryUpload(
    coverImage.path,
    coverImage.filename,
    coverImage.mimetype,
    coverImage.mimetype.split("/")[0]
  );
  if (!uploadCoverImage)
    return next(
      new APIError(500, "Server Issue:failed to uplaod on cloudinary")
    );

  const uploadAvatar = await cloudinaryUpload(
    avatar.path,
    avatar.filename,
    avatar.mimetype,
    avatar.mimetype.split("/")[0]
  );
  if (!uploadCoverImage)
    return next(
      new APIError(500, "Server Issue:failed to uplaod on cloudinary")
    );

  let createUser = "";
  try {
    createUser = await User.create({
      username,
      fullname,
      password,
      email,
      avatar: uploadAvatar?.url || "",
      coverImage: uploadCoverImage?.url || "",
    });
  } catch (error) {
    console.log(`error while registerating-user:${error}`);
  }
  if (!createUser)
    return next(new APIError(500, "server issue:db failed to create user"));

  const getUser = await User.findOne({ _id: createUser._id }).select(
    "-password -refreshToken"
  );
  if (!getUser) {
    return next(new APIError(500, "server issue:failed to get created user"));
  }

  return res
    .status(201)
    .json(new APIResponse(201, "user-created-successfully", getUser));
});

export { registerUser };
