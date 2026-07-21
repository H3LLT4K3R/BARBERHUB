import express from 'express';
import { responderResena, moderarResena } from '../controllers/resenasController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/responder', requireUser, responderResena); // owner/admin
router.post('/:id/moderar', requireUser, moderarResena); // owner/admin: ocultar/mostrar

export default router;
