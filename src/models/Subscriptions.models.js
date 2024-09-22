// SUBSCRIPTION MODELS
import mongoose, { Schema } from "mongoose";

const SubscriptionsSchema = new Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscriptions = mongoose.model(
  "Subscriptions",
  SubscriptionsSchema
);
