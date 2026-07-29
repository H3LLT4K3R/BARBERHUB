import express from 'express';
import { solicitarRecuperacion, registrarUsuario } from '../controllers/authController.js';

const router = express.Router();

router.post('/recuperar-password', solicitarRecuperacion);
router.post('/registro', registrarUsuario);

export default router;
