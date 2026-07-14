import express from 'express';
import cors from 'cors';
import pagosRoutes from './routes/pagos.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 🔴 LA CLAVE: Lo dejamos como '/api' para que coincida con tu frontend original
app.use('/api', pagosRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});