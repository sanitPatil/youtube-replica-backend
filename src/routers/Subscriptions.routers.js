import e from 'express';
const subsRouter = e.Router();
import { Authenticate } from '../middlewares/Auth.middlewares.js';

import {
	getSubscribedChannels,
	getUserChannelSubscribers,
	toggleSubscription,
} from '../controllers/Subscription.controllers.js';
subsRouter
	.route('/subscribe-toggle/:channelId')
	.get(Authenticate, toggleSubscription);
subsRouter
	.route('/channel-subscriber-list/:channelId')
	.get(Authenticate, getUserChannelSubscribers);
subsRouter
	.route('/subscribed-channels/:subscriberId')
	.get(Authenticate, getSubscribedChannels);
export { subsRouter };
