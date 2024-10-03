import express from 'express';
const app = express();
import cookieParser from 'cookie-parser';
import { APIError } from './utils/APIError.utils.js';

app.use(
	express.json({
		limit: '16kb',
	})
);

app.use(
	express.urlencoded({
		limit: '16kb',
		extended: true,
	})
);

app.use(cookieParser());

// U-S-E-R-O-U-T-E-R
import { userRouter } from './routers/User.routers.js';
app.use('/api/v1/users', userRouter);

// V-I-D-E-O-R-O-U-T-E-R
import { videoRouter } from './routers/Video.routers.js';
app.use('/api/v1/videos', videoRouter);

// D-A-S-H-B-O-A-R-D-R-O-U-T-E-R
import { dashboardRouter } from './routers/Dashboard.routers.js';
app.use('/api/v1/stats', dashboardRouter);

// H-E-A-L-T-H-C-H-E-C-K-U-P
import { healthRouter } from './routers/HeathStatus.routers.js';
app.use('/api/v1/health', healthRouter);

//S-U-B-S-C-R-I-P-T-I-O-N-S-R-O-U-T-E-R
import { subsRouter } from './routers/Subscriptions.routers.js';
app.use('/api/v1/subscriptions', subsRouter);

//L-I-K-E-S-R-O-U-T-E-R
import { likeRouter } from './routers/Likes.routers.js';
app.use('/api/v1/likes', likeRouter);

// GLOBAL MIDDLEWARE TO  CATCH ALL ERROR NEXT
app.use((err, req, res, next) => {
	if (err instanceof APIError) {
		return res.status(err.statusCode || 500).json({
			success: err.success,
			message: err.message,
			errors: err.errors,
			stack: process.env.MODE_ENV === 'development' ? err.stack : undefined,
		});
	} else {
		return res.status(500).json({
			message: 'internal server issue!',
			success: false,
			error: err.message,
			stack: err.stack,
		});
	}
});
export default app;
