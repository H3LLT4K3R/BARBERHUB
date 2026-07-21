import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pagosRoutes from './routes/pagos.js';
import mercadoPagoRoutes from './routes/mercadoPago.js';
import citasRoutes from './routes/citas.js';
import operacionRoutes from './routes/operacion.js';
import resenasRoutes from './routes/resenas.js';
import perfilRoutes from './routes/perfil.js';
import equipoRoutes from './routes/equipo.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔴 LA CLAVE: Lo dejamos como '/api' para que coincida con tu frontend original
app.use('/api', pagosRoutes);
app.use('/api/pagos/mp', mercadoPagoRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api', operacionRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/equipo', equipoRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
