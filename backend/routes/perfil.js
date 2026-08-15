import express from 'express';
import { actualizarPerfilMembresia, eliminarCuenta, desactivarMiMembresia } from '../controllers/perfilController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/membresia', requireUser, actualizarPerfilMembresia);
router.delete('/cuenta', requireUser, eliminarCuenta);
router.post('/membresia/desactivar', requireUser, desactivarMiMembresia);

export default router;
