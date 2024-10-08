// VIDEO MODELS
import mongoose, { Schema } from 'mongoose';

const videoSchema = new Schema(
	{
		videoFile: {
			type: String,
			required: true,
		},
		thumbnail: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
			default: 0,
		},
		views: {
			type: Number,
			required: true,
			default: 0,
		},
		isPublished: {
			type: Boolean,
			required: true,
			default: true,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
);

export const Video = mongoose.model('Video', videoSchema);
