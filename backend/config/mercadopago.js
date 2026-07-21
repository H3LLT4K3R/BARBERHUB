import 'dotenv/config';
import { MercadoPagoConfig } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
    throw new Error(
        'Falta MP_ACCESS_TOKEN en backend/.env. Se obtiene en el panel de desarrolladores de Mercado Pago (Credenciales de producción o de prueba).'
    );
}

export const mercadoPagoClient = new MercadoPagoConfig({ accessToken });
