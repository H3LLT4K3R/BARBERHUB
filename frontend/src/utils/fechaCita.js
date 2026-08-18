// Las citas se guardan con la hora "cruda": los dígitos de appointments.scheduled_at ya
// representan la hora local de la barbería directamente, sin ninguna conversión real de
// zona horaria (mismo criterio que business_hours/staff_availability y la validación de
// horario en crearCita — ver backend/controllers/citasController.js). Por eso, para leer,
// comparar o mostrar la fecha/hora de una cita, siempre hay que usar los componentes UTC
// del objeto Date (getUTCHours, getUTCDate, etc.), nunca los métodos que convierten a la
// zona horaria del navegador (toLocaleString, toTimeString, toDateString, getHours...) —
// esos desfasan la hora según dónde esté el navegador de quien mira la pantalla.
// Estas utilidades centralizan ese criterio para no repetirlo (ni equivocarlo) en cada
// pantalla que muestra o filtra citas.

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "HH:MM" de la cita, tal cual se reservó (sin conversión de zona horaria). */
export function horaDeCita(scheduledAt) {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * Componentes de fecha/hora de la cita leídos en crudo (mes 0-indexado, igual que Date),
 * para comparar contra un Date real del navegador sin mezclar convenciones.
 */
export function componentesDeCita(scheduledAt) {
  const d = new Date(scheduledAt);
  return {
    anio: d.getUTCFullYear(),
    mes: d.getUTCMonth(),
    dia: d.getUTCDate(),
    diaSemana: d.getUTCDay(),
    horas: d.getUTCHours(),
    minutos: d.getUTCMinutes(),
  };
}

/**
 * ¿La cita cae en el mismo día calendario que `fechaReferencia` (un Date real del
 * navegador, ej. `new Date()`)? Sustituye a comparar dos `.toDateString()`, que
 * duplicaría la conversión de zona horaria sobre una hora que ya es local.
 */
export function esMismoDia(scheduledAt, fechaReferencia) {
  const c = componentesDeCita(scheduledAt);
  return (
    c.anio === fechaReferencia.getFullYear() &&
    c.mes === fechaReferencia.getMonth() &&
    c.dia === fechaReferencia.getDate()
  );
}

/** "Jue 09:00" — día corto + hora. */
export function diaYHoraCorta(scheduledAt) {
  const { diaSemana } = componentesDeCita(scheduledAt);
  return `${DIAS_CORTOS[diaSemana]} ${horaDeCita(scheduledAt)}`;
}

/** "20 ago" — fecha corta, sin conversión de zona horaria. */
export function fechaCorta(scheduledAt) {
  const { dia, mes } = componentesDeCita(scheduledAt);
  return `${dia} ${MESES_CORTOS[mes]}`;
}

/** "jueves, 20 de agosto de 2026" — fecha larga en español. */
export function fechaLarga(scheduledAt) {
  const { anio, mes, dia, diaSemana } = componentesDeCita(scheduledAt);
  return `${DIAS_LARGOS[diaSemana]}, ${dia} de ${MESES_LARGOS[mes]} de ${anio}`;
}

/** "20 ago 2026, 09:00" — fecha y hora completas en un formato corto. */
export function fechaYHora(scheduledAt) {
  const { anio, dia, mes } = componentesDeCita(scheduledAt);
  return `${dia} ${MESES_CORTOS[mes]} ${anio}, ${horaDeCita(scheduledAt)}`;
}

/**
 * Reconstruye un Date "local" cuyos getDay()/getDate()/getHours()... devuelven los
 * mismos dígitos que se guardaron (sin conversión) — útil para reusar funciones que
 * esperan un Date real y leen sus componentes locales (ej. formatearHorarioCorto de
 * utils/fecha.js). No representa el instante real, solo reempaqueta los componentes
 * crudos en un Date normal para poder leerlos con los métodos locales de siempre.
 */
export function comoFechaLocal(scheduledAt) {
  const c = componentesDeCita(scheduledAt);
  return new Date(c.anio, c.mes, c.dia, c.horas, c.minutos);
}

/**
 * Convierte un Date real del navegador (ej. "medianoche de hoy", "inicio de esta
 * semana") al string que hay que mandarle a Supabase para comparar contra
 * scheduled_at — `toISOString()` NO sirve para esto porque sí convierte a UTC real,
 * desfasando el filtro respecto a las citas guardadas en crudo.
 */
export function aNaiveISOString(fechaLocal) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())}T${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}.000Z`;
}
