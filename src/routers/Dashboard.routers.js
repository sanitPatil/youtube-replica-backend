import e from 'express';
import { Authenticate } from '../middlewares/Auth.middlewares.js';
import {
	getChannelStats,
	getChannelVideos,
} from '../controllers/Dashboard.controllers.js';
const dashboardRouter = e.Router();

dashboardRouter.route('/dashboard').get(Authenticate, getChannelStats);

dashboardRouter.route('/channel-videos/:channelId').get(getChannelVideos);
export { dashboardRouter };
