import express from 'express';
import axios from 'axios';

import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import {register, login} from '../controllers/authControllers.js';
import { updateUserMeta } from '../controllers/userMetaController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;

