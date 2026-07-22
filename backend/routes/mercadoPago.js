import express from 'express';
import { crearPreferencia, recibirWebhook, estadoPago } from '../controllers/mercadoPagoController.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/crear-preferencia', requireUser, crearPreferencia);
router.post('/webhook', recibirWebhook); // Mercado Pago llama esto directo, sin sesión de usuario.
router.get('/estado/:appointmentId', requireUser, estadoPago);

export default router;
