import express from 'express';
import { listarBarberias, crearBarberiaConDuenio, eliminarBarberia, listarResenas, crearCiudad, crearZona, eliminarCiudad, eliminarZona, agregarImagenGaleria, eliminarImagenGaleria } from '../controllers/adminController.js';
import { requireUser } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

router.get('/barberias', requireUser, requireSuperAdmin, listarBarberias);
router.post('/barberias', requireUser, requireSuperAdmin, crearBarberiaConDuenio);
router.delete('/barberias/:barberiaId', requireUser, requireSuperAdmin, eliminarBarberia);
router.get('/resenas', requireUser, requireSuperAdmin, listarResenas);
router.post('/ciudades', requireUser, requireSuperAdmin, crearCiudad);
router.post('/zonas', requireUser, requireSuperAdmin, crearZona);
router.delete('/ciudades/:ciudadId', requireUser, requireSuperAdmin, eliminarCiudad);
router.delete('/zonas/:zonaId', requireUser, requireSuperAdmin, eliminarZona);
router.post('/galeria', requireUser, requireSuperAdmin, agregarImagenGaleria);
router.delete('/galeria/:imagenId', requireUser, requireSuperAdmin, eliminarImagenGaleria);

export default router;
