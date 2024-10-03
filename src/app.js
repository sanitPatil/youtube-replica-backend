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
