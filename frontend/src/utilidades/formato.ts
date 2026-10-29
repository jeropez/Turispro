import { EstadoPlan, FranjaHoraria, TipoRecurso, TipoViajero, UnidadCosto } from '../api/tipos';

export const cop = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export const ETIQUETA_ESTADO: Record<EstadoPlan, string> = { BORRADOR: 'Borrador', PUBLICADO: 'Publicado', ARCHIVADO: 'Archivado' };
export const ETIQUETA_FRANJA: Record<FranjaHoraria, string> = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
export const ETIQUETA_VIAJERO: Record<TipoViajero, string> = { FAMILIAS: 'Familias', ADULTOS: 'Adultos', PAREJAS: 'Parejas', GRUPOS: 'Grupos' };
export const ETIQUETA_TIPO: Record<TipoRecurso, string> = { ALOJAMIENTO: 'Alojamiento', ACTIVIDAD: 'Actividad', TRANSPORTE: 'Transporte' };
export const ETIQUETA_UNIDAD: Record<UnidadCosto, string> = { HABITACION_NOCHE: 'habitación / noche', PERSONA: 'persona', SERVICIO: 'servicio' };
export const ESTADOS: EstadoPlan[] = ['BORRADOR', 'PUBLICADO', 'ARCHIVADO'];
export const FRANJAS: FranjaHoraria[] = ['MANANA', 'TARDE', 'NOCHE'];
export const VIAJEROS: TipoViajero[] = ['FAMILIAS', 'ADULTOS', 'PAREJAS', 'GRUPOS'];

/** Réplica de calcularCostos del backend (HU06). El servidor vuelve a calcular al guardar. */
export function calcularCostos(c: { cantidad: number; costo_unitario_cop: number }[], viajeros: number | null | undefined) {
  const total = Math.round(c.reduce((s, x) => s + (Number(x.cantidad) || 0) * (Number(x.costo_unitario_cop) || 0), 0) * 100) / 100;
  return { total, porPersona: viajeros && viajeros > 0 ? Math.round((total / viajeros) * 100) / 100 : null };
}
