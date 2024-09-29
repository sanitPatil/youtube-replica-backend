import e from "express";
import { registerUser } from "../controllers/User.controllers.js";
import { upload } from "../middlewares/Multer.middlewares.js";
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

export { userRouter };
