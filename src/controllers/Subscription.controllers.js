import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { Subscriptions } from '../models/Subscriptions.models.js';
import { User } from '../models/User.models.js';
const toggleSubscription = asyncHandler(async (req, res, next) => {
  // TODO: toggle subscription
  try {
    const { channelId } = req.params;
    if (!channelId)
      return next(new APIError(400, `Bad Request: missing channel id`));

    let exists = await Subscriptions.findOne({ channel: channelId });
    let subs = '';
    if (exists) {
      subs = await Subscriptions.findByIdAndDelete(exists._id);
    } else {
      subs = await Subscriptions.create({
        subscriber: req.user._id,
        channel: channelId,
      });
    }

    if (!subs)
      return next(
        new APIError(500, 'server issue:failed to update subscription')
      );

    return res.status(200).json(200, `successfully-subscription-state-update`, {
      subs,
      status: true,
    });
  } catch (error) {
    console.log(`failed to change subscriptions state`, error);
    return next(
      new APE(500, `server issue:failed to toggle state subscription`, error)
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res, next) => {
  try {
    const { channelId } = req.params;
    if (!channelId)
      return next(new APIError(400, `Bad Request:missing channel id`));

    const list = await User.aggregate([
      {
        $match: {
          _id: channelId, // channel-> user
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'channel',
          as: 'subscriber_list',
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
          totalSubscribers: { $size: '$subscriber_list' },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new APIResponse(
          200,
          `successfully-retrive-subscriber-list-for-channel`,
          { list }
        )
      );
  } catch (error) {
    console.log(`server issue failed to get subscriber list ${error}`);
    return next(
      new APIError(500, `server issue:failed to get subscriber list`, error)
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res, next) => {
  try {
    const { subscriberId } = req.params;
    if (!subscriberId)
      return next(new APIError(400, `bad request: missing subscriber list`));

    const list = await User.aggregate([
      {
        $match: {
          _id: subscriberId,
        },
      },
      {
        $lookup: {
          form: 'subscriptions',
          localField: '_id',
          foreignField: 'subscriber',
          as: 'subscribedChannels',
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
          totalSubscribedChannel: {
            $size: '$subscribedChannels',
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new APIResponse(200, `successfully-retrive-channels-list`, { list })
      );
  } catch (error) {
    console.log(`server issue:failed to get channel list subscribed${error}`);
    return next(
      new APIError(
        500,
        `server issue:failed to get subscribed channels list`,
        error
      )
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
