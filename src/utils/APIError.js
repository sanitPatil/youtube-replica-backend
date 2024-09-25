class APIError extends Error {
  constructor(
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.data = null;
    this.message = message;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// (() => {
//   try {
//     throw new APIError(
//       "missing parameters", // message
//       400, // statusCode
//       "at function add(){}//", // stack (optional, can be auto-captured)
//       ["name is required", "password required"] // errors
//     );
//   } catch (error) {
//     console.log(error); // This will output the manually passed stack trace
//   }
// })();
export { APIError };
