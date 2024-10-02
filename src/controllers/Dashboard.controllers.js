import { asyncHandler } from '../utils/AsyncHandler.utils.js';
import { APIError } from '../utils/APIError.utils.js';
import { APIResponse } from '../utils/APIResponse.utils.js';
import { Video } from '../models/Video.models.js';
import { Subscriptions } from '../models/Subscriptions.models.js';
import { User } from '../models/User.models.js';
const getChannelStats = asyncHandler(async (req, res, next) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
    const views = await Video.aggregate([
      {
        $match: {
          owner: req.user._id,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
      {
        $project: {
          totalViews: 1,
          _id: 0,
        },
      },
    ]);

    const subscribers = await Subscriptions.aggregate([
      {
        $match: {
          channel: req.user._id,
        },
      },
      {
        $count: 'totalSubscribers',
      },
    ]);
    const totalSubscribers =
      subscribers.length > 0 ? subscribers[0].totalSubscribers : 0;

    const videos = await Video.aggregate([
      {
        $match: {
          owner: req.user._id,
        },
      },
      {
        $count: 'totalVideos',
      },
    ]);
    const totalVideos = videos.length > 0 ? videos[0].totalVideos : 0;

    const likes = await Video.aggregate([
      {
        $match: {
          owner: req.user._id,
        },
      },
      {
        $lookup: {
          from: 'likebys',
          localField: '_id',
          foreignField: 'video',
          as: 'likesArray',
        },
      },
      {
        $unwind: {
          path: '$likesArray',
        },
      },
      {
        $group: {
          _id: null,
          grandLikes: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          grandLikes: 1,
        },
      },
    ]);

    return res.status(200).json(
      new APIResponse(200, `successfully-retrive-stats`, {
        views: views,
        subscribers: totalSubscribers,
        videos: totalVideos,
        likes: likes.length > 0 ? likes[0].grandLikes : 0,
      })
    );
  } catch (error) {
    console.log(`server failure: failed to get stats`, error);
    return next(
      new APIError(500, `server failure: failed to get stats`, error)
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res, next) => {
  // TODO: Get all the videos uploaded by the channel

  try {
    const { channelId } = req.params;
    if (!channelId)
      return next(new APIError(400, `Bad Request:missing channel id`));

    const channelVideos = await User.aggregate([
      {
        $match: {
          _id: channelId,
        },
      },
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: 'owner',
          as: 'videos',
        },
      },
      {
        $project: {
          _id: 0,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          views: 1,
        },
      },
    ]);

    return res.status(200).json(
      new APIResponse(200, `successfully-retrive-videos-of-channel`, {
        channelVideos,
      })
    );
  } catch (error) {
    console.log(`server failure:failed to load channels-all-videos`, error);
  }
});

export { getChannelStats, getChannelVideos };
