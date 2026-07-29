import express from 'express';
import { listarBarberias, crearBarberiaConDuenio, eliminarBarberia } from '../controllers/adminController.js';
import { requireUser } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

router.get('/barberias', requireUser, requireSuperAdmin, listarBarberias);
router.post('/barberias', requireUser, requireSuperAdmin, crearBarberiaConDuenio);
router.delete('/barberias/:barberiaId', requireUser, requireSuperAdmin, eliminarBarberia);

export default router;
