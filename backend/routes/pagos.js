import express from 'express';
// 1. Agregamos rechazarLink y procesarRechazo a las importaciones
import {solicitarLink, aprobarLink, estadoLink, rechazarLink, procesarRechazo }
from '../controllers/pagosController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas (Requieren sesión en la app)
router.post('/solicitar', requireUser, solicitarLink); // owner
router.get('/estado-link/:barberiaId', requireUser, estadoLink); // owner/admin

// Rutas públicas (Se abren directo desde los botones del correo de Gmail)
router.get('/aprobar/:id', aprobarLink); // moderador
router.get('/rechazar/:id', rechazarLink); // Abre la pantallita de motivo
router.post('/procesar-rechazo', procesarRechazo); // Guarda la decisión

export default router;