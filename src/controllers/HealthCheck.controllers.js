import { APIResponse } from '../utils/APIResponse.utils.js';

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  return res
    .status(200)
    .json(new APIResponse(200, `system Health is OK`, { health: 'OK' }));
});

export { healthcheck };
