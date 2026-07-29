# BarberHub — diseño de base de datos para Supabase

## Cómo está organizada

Supabase Auth gestiona los usuarios, correos, contraseñas, recuperación de cuenta y
MFA. La tabla `profiles` contiene sólo los datos de la aplicación. Así no se duplican
credenciales ni se guardan contraseñas en tablas propias.

Una persona puede tener roles distintos en distintas sucursales. La relación está en
`barberia_memberships`: cada fila une un perfil con una barbería y define si es owner,
admin o barbero. Los permisos de módulos se gestionan con `platform_modules`,
`barberia_modules` y `membership_module_permissions`.

```text
auth.users ── 1:1 ── profiles
profiles ──< barberia_memberships >── barberias ──< services
                       │                   │
                       ├─ barber_settings  ├─ business_hours
                       ├─ barber_notification_preferences
                       └─< staff_services >── services

profiles (cliente) ──< appointments >── barbero/membresía
appointments ──< appointment_services >── services
appointments ──< payments ──< payment_events
appointments ── 0..1 reviews
```

## Áreas y tablas

| Área | Tablas |
|---|---|
| Identidad | `profiles`, `user_addresses` |
| Organización | `barberias`, `barberia_memberships`, `barber_settings`, `barber_notification_preferences` |
| Módulos y permisos | `platform_modules`, `barberia_modules`, `membership_module_permissions` |
| Catálogo | `service_categories`, `services`, `staff_services`, `barberia_media` |
| Agenda | `business_hours`, `staff_availability`, `availability_exceptions`, `appointments`, `appointment_services`, `appointment_status_history` |
| Pagos | `payment_provider_accounts`, `payments`, `payment_events`, `refunds` |
| Cliente | `favorite_barberias`, `reviews`, `notifications` |
| Comercial | `coupons`, `coupon_redemptions`, `loyalty_accounts`, `loyalty_ledger` |
| Operación | `suppliers`, `inventory_items`, `inventory_movements`, `financial_transactions`, `audit_log` |

## Ajustes del barbero

La pantalla nueva usa dos tablas por membresía: `barber_settings` controla aceptar
citas y confirmación automática; `barber_notification_preferences` controla los
cuatro avisos. Un trigger crea ambas automáticamente al registrar un miembro con rol
`barber`. Nombre, foto y teléfono pertenecen a `profiles`; especialidad pertenece a
`barberia_memberships`; contraseña y dos pasos pertenecen a Supabase Auth.

## Integridad y automatización

- Todas las claves principales son UUID.
- Las tablas mutables tienen `created_at` y `updated_at`.
- Una exclusión PostgreSQL evita reservar al mismo barbero en horarios solapados.
- Triggers validan que el barbero/servicio pertenezca a la barbería de la cita.
- El historial de estados de cita, saldo de lealtad e inventario se actualizan
  automáticamente.
- Pagos y eventos de webhook son separados para que Mercado Pago sea idempotente.

## Seguridad

El script habilita RLS en tablas expuestas. Clientes ven sus citas/pagos; barberos sus
ajustes y operaciones; owner/admin únicamente recursos de su barbería. La clave de
servidor de Supabase nunca debe estar en React: úsala sólo en Edge Functions para
Mercado Pago, webhooks, correos y administración.

## Datos demo

Después de crear tres usuarios mediante Authentication > Users, consulta sus UUID en
`auth.users` y ejecuta:

```sql
select public.seed_barberhub_demo('UUID_OWNER', 'UUID_BARBERO', 'UUID_CLIENTE');
```

Esto crea una barbería demo, el equipo, servicios, horarios, módulos y cuenta de
fidelidad. No uses el seed en producción.
