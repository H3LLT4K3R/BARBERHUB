import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { limiterGeneral } from './middleware/rateLimit.js';
import { enviarRecordatoriosDeCupones } from './utils/cupones.js';
import { enviarRecordatoriosDeCitas, enviarResumenDiario } from './controllers/citasController.js';
import pagosRoutes from './routes/pagos.js';
import mercadoPagoRoutes from './routes/mercadoPago.js';
import citasRoutes from './routes/citas.js';
import operacionRoutes from './routes/operacion.js';
import resenasRoutes from './routes/resenas.js';
import perfilRoutes from './routes/perfil.js';
import equipoRoutes from './routes/equipo.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import suscripcionesRoutes from './routes/suscripciones.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario en producción (Render/Railway/etc.) para que el rate limiter identifique
// la IP real del visitante y no la del proxy interno.
app.set('trust proxy', 1);

app.use(helmet());

// Solo el frontend real puede llamar la API desde un navegador — pero solo en
// producción. En desarrollo se deja abierto a propósito: al probar la app desde el
// celular por la red local, Vite reenvía la petición al backend conservando el Origin
// original (algo como http://192.168.1.x:5173, que cambia según la red), y esa IP no
// se puede saber de antemano. Peticiones sin header Origin (webhooks de Mercado Pago,
// curl, servidor a servidor) siempre pasan: CORS solo aplica a peticiones de navegador.
const enProduccion = process.env.NODE_ENV === 'production';
const origenesPermitidos = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!enProduccion || !origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS.'));
    }
  },
}));

app.use(express.json());
app.use('/api', limiterGeneral);

// Respuesta limpia en JSON cuando CORS rechaza el origen, en vez de la página de
// error HTML por defecto de Express.
app.use((err, req, res, next) => {
  if (err && err.message === 'Origen no permitido por CORS.') {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

// 🔴 LA CLAVE: Lo dejamos como '/api' para que coincida con tu frontend original
app.use('/api', pagosRoutes);
app.use('/api/pagos/mp', mercadoPagoRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api', operacionRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/equipo', equipoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suscripciones', suscripcionesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Recordatorio de cupones por vencer: una vez al día, a las 9am hora del servidor.
cron.schedule('0 9 * * *', () => {
  enviarRecordatoriosDeCupones().catch((err) => console.error('Error en el job de recordatorios de cupones:', err));
});

// Recordatorio de citas confirmadas para "mañana": una vez al día, a las 9am.
cron.schedule('0 9 * * *', () => {
  enviarRecordatoriosDeCitas().catch((err) => console.error('Error en el job de recordatorios de citas:', err));
});

// Resumen diario para el barbero ("Resumen diario" en Ajustes): una vez al día, a las
// 7am, antes de que empiece la jornada.
cron.schedule('0 7 * * *', () => {
  enviarResumenDiario().catch((err) => console.error('Error en el job de resumen diario:', err));
});
