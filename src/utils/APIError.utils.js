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
      // this: Refers to the current instance of the error object. The stack trace will be captured for this error object.
      // this.constructor: This ensures that the stack trace will not include the current constructor call itself, making the trace more relevant by focusing on the external calls that led to the error.
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
