class APIResponse {
  constructor(statusCode, message = "Success", data) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}
// return res.status(200).json(new APIResponse(200,{data},"message"))
export { APIResponse };
