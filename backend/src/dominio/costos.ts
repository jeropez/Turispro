import { Concepto, Recurso } from './tipos';

export const redondear = (n: number) => Math.round(n * 100) / 100;

/** HU06: total = suma de cantidad × costo unitario; por persona = total ÷ viajeros. */
export function calcularCostos(
  conceptos: Pick<Concepto, 'cantidad' | 'costo_unitario_cop'>[],
  viajeros: number | null | undefined,
) {
  const total = redondear(conceptos.reduce((s, c) => s + c.cantidad * c.costo_unitario_cop, 0));
  const porPersona = viajeros && viajeros > 0 ? redondear(total / viajeros) : null;
  return { total, porPersona };
}

interface Seleccion {
  actividades: string[]; // ids de recurso, uno por cada vez que aparece en el itinerario
  alojamientoId?: string | null;
  transporteId?: string | null;
}

/**
 * Deriva los conceptos de costo a partir de lo seleccionado. El costo unitario se COPIA
 * de la tarifa del catálogo para que cambios posteriores no alteren planes ya guardados.
 */
export function construirConceptos(
  sel: Seleccion,
  catalogo: Map<string, Recurso>,
  viajeros: number,
  noches: number,
): Concepto[] {
  const conceptos: Concepto[] = [];
  const veces = new Map<string, number>();
  sel.actividades.forEach((id) => veces.set(id, (veces.get(id) ?? 0) + 1));
  for (const [id, n] of veces) {
    const r = catalogo.get(id);
    if (r) conceptos.push({ recurso_id: id, descripcion: r.nombre, cantidad: n * viajeros, unidad: r.unidad, costo_unitario_cop: r.costo_referencia_cop });
  }
  const aloj = sel.alojamientoId ? catalogo.get(sel.alojamientoId) : undefined;
  if (aloj) conceptos.push({ recurso_id: aloj.id, descripcion: aloj.nombre, cantidad: Math.max(noches, 1), unidad: aloj.unidad, costo_unitario_cop: aloj.costo_referencia_cop });
  const trans = sel.transporteId ? catalogo.get(sel.transporteId) : undefined;
  if (trans) conceptos.push({ recurso_id: trans.id, descripcion: trans.nombre, cantidad: 1, unidad: trans.unidad, costo_unitario_cop: trans.costo_referencia_cop });
  return conceptos;
}
