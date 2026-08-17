import express from 'express';
import {
    crearCuentaStaff, restablecerPasswordStaff, listarEquipo,
    alternarActivoStaff, eliminarCuentaStaff,
} from '../controllers/equipoController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireUser, listarEquipo);
router.post('/', requireUser, crearCuentaStaff);
router.post('/:membershipId/password', requireUser, restablecerPasswordStaff);
router.post('/:membershipId/activo', requireUser, alternarActivoStaff);
router.delete('/:membershipId', requireUser, eliminarCuentaStaff);

export default router;
