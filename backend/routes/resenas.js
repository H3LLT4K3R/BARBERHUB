import express from 'express';
import { responderResena, moderarResena, destacarResena } from '../controllers/resenasController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/responder', requireUser, responderResena); // owner/admin
router.post('/:id/moderar', requireUser, moderarResena); // owner/admin: ocultar/mostrar
router.post('/:id/destacar', requireUser, destacarResena); // owner/admin: mostrar/quitar del landing

export default router;
