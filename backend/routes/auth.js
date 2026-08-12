import express from 'express';
import { solicitarRecuperacion, registrarUsuario } from '../controllers/authController.js';
import { limiterSensible } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/recuperar-password', limiterSensible, solicitarRecuperacion);
router.post('/registro', limiterSensible, registrarUsuario);

export default router;
