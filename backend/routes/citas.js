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
    ocultarCita,
    ocultarCitaCliente,
    ocultarCitaOwner,
    subirComprobante,
    confirmarPagoManual,
    rechazarComprobante,
    obtenerResumenFidelidad,
} from '../controllers/citasController.js';
import { validarCuponPreview } from '../controllers/cuponesController.js';
import { requireUser } from '../middleware/auth.js';
import { limiterSensible } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/disponibilidad', obtenerDisponibilidad); // pública: se puede explorar sin sesión
router.get('/fidelidad/resumen', requireUser, obtenerResumenFidelidad); // owner/admin: puntos otorgados este mes
router.post('/validar-cupon', limiterSensible, requireUser, validarCuponPreview); // limita fuerza bruta de códigos
router.post('/', limiterSensible, requireUser, crearCita); // limita fuerza bruta de cupones y saturación de horarios
router.post('/:id/cancelar', requireUser, cancelarCita); // cliente: cancela su cita (reembolsa si ya pagó)
router.post('/:id/aceptar', requireUser, aceptarCita); // barbero/admin: aprueba la solicitud, aún sin pago
router.post('/:id/rechazar', requireUser, rechazarCita); // barbero/admin: rechaza la solicitud o cancela antes de confirmar
router.post('/:id/confirmar', requireUser, confirmarCitaFinal); // barbero/admin: confirma al 100% tras el pago
router.post('/:id/iniciar', requireUser, iniciarServicio); // barbero: el cliente llegó
router.post('/:id/completar', requireUser, completarCita); // barbero: servicio terminado, otorga puntos
router.post('/:id/no-asistio', requireUser, marcarNoShow); // barbero: el cliente no llegó
router.post('/:id/ocultar', requireUser, ocultarCita); // barbero/admin: oculta una cita terminal de su agenda (no la borra)
router.post('/:id/ocultar-cliente', requireUser, ocultarCitaCliente); // cliente: oculta una cita terminal de su historial (no la borra)
router.post('/:id/ocultar-owner', requireUser, ocultarCitaOwner); // owner/admin: oculta una cita terminal de Gestión de Agenda (no la borra)
router.post('/:id/comprobante', requireUser, subirComprobante); // cliente: registra el comprobante del pago manual
router.post('/:id/confirmar-pago', requireUser, confirmarPagoManual); // barbero/admin: revisó el comprobante, confirma el pago
router.post('/:id/rechazar-comprobante', requireUser, rechazarComprobante); // barbero/admin: el comprobante no sirve, pide uno nuevo

export default router;
