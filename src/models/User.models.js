// USER MODELS
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			index: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
			lowercase: true,
			trim: true,
		},
		fullname: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
		},
		// for avatar we store string for the images
		avatar: {
			type: String,
		},
		coverImage: {
			type: String,
			reuqired: true,
		},
		password: {
			type: String,
			required: true,
		},
		refreshToken: {
			type: String,
		},
		watchHistory: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Video',
			},
		],
	},
	{ timestamps: true }
);

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.validatePassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

// ACCESS TOKEN
userSchema.methods.generateAccessToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
			username: this.username,
			fullname: this.fullname,
			email: this.email,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_EXPIRY,
		}
	);
};

userSchema.methods.generateRefreshToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
			username: this.username,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_EXPIRY,
		}
	);
};
export const User = mongoose.model('User', userSchema);
