import express from 'express';
import {
    obtenerEstadoSuscripcion,
    cambiarSuspension,
    obtenerConfigPlataforma,
    actualizarConfigPlataforma,
    subirComprobanteSuscripcion,
    confirmarComprobanteSuscripcion,
    rechazarComprobanteSuscripcion,
} from '../controllers/subscriptionController.js';
import { requireUser } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

router.get('/mia', requireUser, obtenerEstadoSuscripcion); // owner: consulta la suscripción de su propia barbería
router.post('/:barberiaId/suspension', requireUser, requireSuperAdmin, cambiarSuspension); // super admin: activar/desactivar

router.get('/config', requireUser, requireSuperAdmin, obtenerConfigPlataforma); // super admin: link de pago de la plataforma
router.put('/config', requireUser, requireSuperAdmin, actualizarConfigPlataforma);

router.post('/:barberiaId/comprobante', requireUser, subirComprobanteSuscripcion); // owner: sube su comprobante de pago
router.post('/:barberiaId/confirmar', requireUser, requireSuperAdmin, confirmarComprobanteSuscripcion); // super admin: acepta
router.post('/:barberiaId/rechazar', requireUser, requireSuperAdmin, rechazarComprobanteSuscripcion); // super admin: rechaza

export default router;
