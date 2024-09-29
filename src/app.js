import express from "express";
const app = express();
import { APIError } from "./utils/APIError.utils.js";

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

// U-S-E-R-O-U-T-E-R
import { userRouter } from "./routers/User.routers.js";
app.use("/api/v1/users", userRouter);
// GLOBAL MIDDLEWARE TO  CATCH ALL ERROR NEXT
app.use((err, req, res, next) => {
  if (err instanceof APIError) {
    return res.status(err.statusCode || 500).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      stack: process.env.MODE_ENV === "development" ? err.stack : undefined,
    });
  } else {
    return res.status(500).json({
      message: "internal server issue!",
      success: false,
    });
  }
});
export default app;
