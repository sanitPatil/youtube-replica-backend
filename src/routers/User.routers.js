import e from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/User.controllers.js";
import { upload } from "../middlewares/Multer.middlewares.js";
import { Authenticate } from "../middlewares/Auth.middlewares.js";
const userRouter = e.Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").get(Authenticate, logoutUser);
export { userRouter };
