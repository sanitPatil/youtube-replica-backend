import e from 'express';

import { healthcheck } from '../controllers/HealthCheck.controllers.js';

const healthRouter = e.Router();

healthRouter.route('/system-health-status').get(healthcheck);

export { healthRouter };
