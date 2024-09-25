import e from "express";
const app = e();

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
