import express from 'express';
import { solicitarLink, aprobarLink, estadoLink } from '../controllers/pagosController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/solicitar', requireUser, solicitarLink); // owner
router.get('/aprobar/:token', aprobarLink); // moderador, vía el link del correo (sin sesión)
router.get('/estado-link/:barberiaId', requireUser, estadoLink); // owner/admin

export default router;
