// LIKES MODEL
import mongoose, { Schema } from "mongoose";
const likesSchema = new Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    likeby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
  },
  { timestamps: true }
);

export const LikeBy = mongoose.model("LikeBy", likesSchema);
