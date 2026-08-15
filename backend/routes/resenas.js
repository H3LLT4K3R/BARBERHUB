import express from 'express';
import { moderarResena, destacarResena } from '../controllers/resenasController.js';
import { requireUser } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

router.post('/:id/moderar', requireUser, moderarResena); // owner/admin: ocultar/mostrar
// Curaduría del landing page: exclusiva del super admin (los dueños ya no deciden esto).
router.post('/:id/destacar', requireUser, requireSuperAdmin, destacarResena);

export default router;
