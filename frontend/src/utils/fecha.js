const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function fechaAKey(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function keyAFecha(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function nombreMesAnio(fecha) {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

export function nombreDiaSemana(fecha) {
  return DIAS_SEMANA[fecha.getDay()];
}

export function formatearHorarioCita(fecha, hora) {
  return `${nombreDiaSemana(fecha)}, a las ${hora} hrs`;
}

export function formatearHorarioCorto(fecha, hora) {
  return `${nombreDiaSemana(fecha)} a las ${hora} hrs`;
}

export { DIAS_CORTOS };

export function construirCeldasCalendario(anio, mes) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  let inicioSemana = primerDia.getDay() - 1;
  if (inicioSemana < 0) inicioSemana = 6;

  const celdas = [];

  for (let i = inicioSemana; i > 0; i--) {
    const d = new Date(anio, mes, 1 - i);
    celdas.push({ fecha: d, fueraDeMes: true });
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    celdas.push({ fecha: new Date(anio, mes, d), fueraDeMes: false });
  }

  while (celdas.length % 7 !== 0) {
    const ultima = celdas[celdas.length - 1].fecha;
    const sig = new Date(ultima);
    sig.setDate(sig.getDate() + 1);
    celdas.push({ fecha: sig, fueraDeMes: true });
  }

  return celdas;
}
