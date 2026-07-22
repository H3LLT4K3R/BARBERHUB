import express from 'express';
import { registrarMovimientoInventario, registrarTransaccionFinanciera } from '../controllers/operacionController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/inventario/movimientos', requireUser, registrarMovimientoInventario);
router.post('/finanzas/transacciones', requireUser, registrarTransaccionFinanciera);

export default router;
