import express from 'express';
import { solicitarLink, aprobarLink, estadoLink } from '../controllers/pagosController.js';

const router = express.Router();

router.post('/solicitar', solicitarLink);
router.get('/aprobar/:id', aprobarLink);
router.get('/estado-link/:barberia', estadoLink);

export default router;