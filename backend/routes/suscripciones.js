import express from 'express';
import { crearSuscripcion, obtenerEstadoSuscripcion, cambiarSuspension } from '../controllers/subscriptionController.js';
import { requireUser } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

router.get('/mia', requireUser, obtenerEstadoSuscripcion); // owner: consulta la suscripción de su propia barbería
router.post('/', requireUser, requireSuperAdmin, crearSuscripcion); // super admin: configura el cobro mensual
router.post('/:barberiaId/suspension', requireUser, requireSuperAdmin, cambiarSuspension); // super admin: activar/desactivar

export default router;
