import express from 'express';
import { actualizarPerfilMembresia } from '../controllers/perfilController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/membresia', requireUser, actualizarPerfilMembresia);

export default router;
