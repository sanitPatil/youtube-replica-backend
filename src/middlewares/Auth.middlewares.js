import { User } from "../models/User.models.js";
import { APIError } from "../utils/APIError.utils.js";
import { AsyncHandler } from "../utils/AsyncHandler.utils.js";
import jwt from "jsonwebtoken";
const Authenticate = AsyncHandler(async (req, res, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req?.header("Authorization")?.replace("Bearer ", "");

    if (!token) return next(new APIError(401, "Token not present or invalid."));

    const decodeToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken._id).select(
      "-password -refreshToken"
    );

    if (!user) return next(new APIError(401, "Invalid Access"));
    req.user = user;
    next();
  } catch (error) {
    console.log(`failed Authentication`);
    return next(new APIError(401, error?.message || "Invalid access token"));
  }
});

export { Authenticate };
