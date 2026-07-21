import express from 'express';
import {
    crearCita,
    obtenerDisponibilidad,
    cancelarCita,
    aceptarCita,
    rechazarCita,
    confirmarCitaFinal,
    iniciarServicio,
    completarCita,
    marcarNoShow,
} from '../controllers/citasController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/disponibilidad', obtenerDisponibilidad); // pública: se puede explorar sin sesión
router.post('/', requireUser, crearCita);
router.post('/:id/cancelar', requireUser, cancelarCita); // cliente: cancela su cita (reembolsa si ya pagó)
router.post('/:id/aceptar', requireUser, aceptarCita); // barbero/admin: aprueba la solicitud, aún sin pago
router.post('/:id/rechazar', requireUser, rechazarCita); // barbero/admin: rechaza la solicitud o cancela antes de confirmar
router.post('/:id/confirmar', requireUser, confirmarCitaFinal); // barbero/admin: confirma al 100% tras el pago
router.post('/:id/iniciar', requireUser, iniciarServicio); // barbero: el cliente llegó
router.post('/:id/completar', requireUser, completarCita); // barbero: servicio terminado, otorga puntos
router.post('/:id/no-asistio', requireUser, marcarNoShow); // barbero: el cliente no llegó

export default router;
