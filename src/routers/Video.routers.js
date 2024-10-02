import e from 'express';
import { Authenticate } from '../middlewares/Auth.middlewares.js';
import {
  getVideoById,
  publishVideo,
} from '../controllers/Video.controllers.js';
import { upload } from '../middlewares/Multer.middlewares.js';
const videoRouter = e.Router();

videoRouter.route('/upload-video').post(
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
videoRouter.route('/get-video/:videoId').get(getVideoById);
export { videoRouter };
