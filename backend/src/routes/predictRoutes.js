import express from 'express';

import { validate } from '../middleware/validate.js';
import { predictSchema } from '../validators/predictValidator.js';
import auth from '../middleware/auth.js';
import { predict } from '../controllers/predictControllers.js';

const router = express.Router();

router.use(auth);
router.post('/', validate(predictSchema), predict);

export default router;