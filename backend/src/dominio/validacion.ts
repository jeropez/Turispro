import { PlanCompleto } from './tipos';

/**
 * HU12: lista lo que falta para poder publicar. Vacía = se puede publicar.
 * Supuesto del equipo (a confirmar): los «datos básicos» obligatorios son
 * nombre, destino, duración, viajeros y tipo de viajero.
 */
export function pendientesDePublicacion(p: PlanCompleto): string[] {
  const pendientes: string[] = [];
  if (!p.nombre?.trim()) pendientes.push('Falta el nombre del plan.');
  if (!p.destino_id) pendientes.push('Falta seleccionar el destino.');
  if (!p.duracion_dias || p.duracion_dias < 1) pendientes.push('Falta indicar la duración en días.');
  if (!p.numero_viajeros || p.numero_viajeros < 1) pendientes.push('Falta indicar el número de viajeros.');
  if (!p.tipo_viajero) pendientes.push('Falta indicar el tipo de viajero.');
  if (p.duracion_dias) {
    if (p.dias.length !== p.duracion_dias)
      pendientes.push(`El itinerario tiene ${p.dias.length} día(s) y la duración es de ${p.duracion_dias}.`);
    p.dias.forEach((d) => {
      if (d.actividades.length === 0) pendientes.push(`El día ${d.numero_dia} no tiene actividades.`);
    });
  }
  if (p.conceptos.length === 0) pendientes.push('Los costos no se pueden calcular: no hay conceptos de costo.');
  return pendientes;
}
