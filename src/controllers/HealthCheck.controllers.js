import { APIResponse } from '../utils/APIResponse.utils.js';
import { AsyncHandler } from '../utils/AsyncHandler.utils.js';

const healthcheck = AsyncHandler(async (req, res, next) => {
	//TODO: build a healthcheck response that simply returns the OK status as json with a message
	return res
		.status(200)
		.json(new APIResponse(200, `system Health is good`, { status: 'OK' }));
});

export { healthcheck };
