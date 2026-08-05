# Barber Hub

Plataforma web para conectar clientes con barberías: los clientes exploran negocios, agendan citas y pagan un anticipo en línea; los dueños y su equipo gestionan agenda, inventario, finanzas y su perfil de negocio; un super administrador da de alta barberías reales y controla el cobro de la plataforma.

## Stack

- **Frontend**: React 19 + Vite, React Router, Tailwind CSS, Leaflet/OpenStreetMap para mapas, Recharts para gráficas.
- **Backend**: Node.js + Express.
- **Base de datos**: Supabase (Postgres + Auth + Storage + RLS).
- **Pagos**: Mercado Pago (checkout de anticipo y suscripciones recurrentes).
- **Correo**: Nodemailer sobre SMTP de Gmail (verificación de cuenta y recuperación de contraseña).

## Estructura del repositorio

```
BARBERHUB/
├── backend/          # API Express
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── server.js
├── frontend/          # SPA React (Vite)
│   └── src/
│       ├── modules/cliente/pages/   # cliente, barbero, owner, admin
│       ├── modules/cliente/components/
│       ├── hooks/
│       ├── lib/
│       └── utils/
├── DB/                # Scripts SQL (esquema base + migraciones incrementales)
└── DATABASE-DESIGN-PRODUCTION.md
```

## Roles de la aplicación

| Rol | Qué puede hacer |
|---|---|
| **Cliente** | Explorar barberías por estado/ciudad/zona, ver perfil de barbero (foto y portafolio), agendar cita, pagar anticipo, calificar el servicio, guardar favoritos. |
| **Barbero** | Gestionar su agenda del día, ver seguimiento de la cita en curso, responder opiniones, subir foto de perfil y portafolio, configurar su disponibilidad. |
| **Owner (dueño)** | Todo lo del barbero, más: finanzas, inventario, estadísticas, cupones, gestión de cuentas de su equipo, permisos por módulo (Seguridad), configuración de la barbería y suscripción de la plataforma. |
| **Super admin** | Da de alta barberías junto con la cuenta del dueño, configura el cobro mensual de cada barbería, puede suspender/reactivar una barbería (bloquea el acceso del dueño y su equipo), elimina barberías de forma permanente, y decide qué reseñas de toda la plataforma aparecen como testimonios en el landing. |

## Requisitos previos

- Node.js 18+
- Un proyecto de Supabase (URL, anon key y service role key)
- Una cuenta de Mercado Pago con credenciales de API
- Una cuenta de Gmail con una **contraseña de aplicación** (no la contraseña normal) para el envío de correos

## Configuración

### 1. Base de datos (Supabase)

Corre `DB/supabase-schema-production.sql` en el editor SQL de Supabase para crear el esquema base. Después corre, en orden, los scripts incrementales que hay en `DB/` (cada uno documenta qué agrega).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Completa `backend/.env`:

```
MAIL_USER=tu-correo@gmail.com
MAIL_PASS=tu-contraseña-de-aplicacion

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

MP_ACCESS_TOKEN=tu-access-token
MP_WEBHOOK_SECRET=tu-clave-secreta-de-webhook

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
PORT=3000
```

```bash
node server.js
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Completa `frontend/.env.local`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_KEY=tu-anon-key
```

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173` (requiere que el backend esté corriendo en `http://localhost:3000`).

## Notas importantes

- **Nunca subas `backend/.env` ni `frontend/.env.local`** — ya están en `.gitignore`. Comparte las credenciales por un canal directo (no por git).
- El backend actualmente acepta peticiones de cualquier origen (CORS abierto). Restríngelo al dominio real antes de desplegar a producción.
- Los webhooks de Mercado Pago necesitan que `BACKEND_URL` sea una URL pública HTTPS (no funciona con `localhost` en producción).
- Los archivos SQL en `DB/` deben correrse en el orden en que fueron agregados; cada uno asume que el anterior ya se aplicó.

## Scripts útiles

| Comando | Dónde | Qué hace |
|---|---|---|
| `npm run dev` | `frontend/` | Levanta el servidor de desarrollo de Vite |
| `npm run build` | `frontend/` | Genera el build de producción |
| `npm run lint` | `frontend/` | Corre ESLint |
| `node server.js` | `backend/` | Levanta la API Express |
