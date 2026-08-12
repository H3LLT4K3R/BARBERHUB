import rateLimit from 'express-rate-limit';

// Límite general: red de seguridad de fondo para toda la API.
export const limiterGeneral = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
});

// Límite estricto para rutas que se pueden abusar de forma concreta: crear citas
// (fuerza bruta de códigos de cupón, saturar horarios con solicitudes falsas),
// registro de cuentas y solicitudes de recuperación de contraseña.
export const limiterSensible = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' },
});
