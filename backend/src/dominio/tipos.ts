export type EstadoPlan = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
export type TipoViajero = 'FAMILIAS' | 'ADULTOS' | 'PAREJAS' | 'GRUPOS';
export type TipoRecurso = 'ALOJAMIENTO' | 'ACTIVIDAD' | 'TRANSPORTE';
export type UnidadCosto = 'HABITACION_NOCHE' | 'PERSONA' | 'SERVICIO';
export type FranjaHoraria = 'MANANA' | 'TARDE' | 'NOCHE';

export const ESTADOS: EstadoPlan[] = ['BORRADOR', 'PUBLICADO', 'ARCHIVADO'];
export const TIPOS_VIAJERO: TipoViajero[] = ['FAMILIAS', 'ADULTOS', 'PAREJAS', 'GRUPOS'];
export const TIPOS_RECURSO: TipoRecurso[] = ['ALOJAMIENTO', 'ACTIVIDAD', 'TRANSPORTE'];
export const UNIDADES: UnidadCosto[] = ['HABITACION_NOCHE', 'PERSONA', 'SERVICIO'];
export const FRANJAS: FranjaHoraria[] = ['MANANA', 'TARDE', 'NOCHE'];

/** Cada tipo de recurso tiene una unidad fija (diagrama de clases). */
export const UNIDAD_POR_TIPO: Record<TipoRecurso, UnidadCosto> = {
  ALOJAMIENTO: 'HABITACION_NOCHE',
  ACTIVIDAD: 'PERSONA',
  TRANSPORTE: 'SERVICIO',
};

export interface Recurso {
  id: string;
  destino_id: string;
  tipo: TipoRecurso;
  nombre: string;
  descripcion: string | null;
  costo_referencia_cop: number;
  unidad: UnidadCosto;
}

export interface Concepto {
  id?: string;
  recurso_id: string | null;
  descripcion: string;
  cantidad: number;
  unidad: UnidadCosto;
  costo_unitario_cop: number;
}

export interface ActividadProgramada {
  id?: string;
  recurso_id: string;
  franja: FranjaHoraria;
  orden: number;
  recursos?: { nombre: string; tipo: TipoRecurso; costo_referencia_cop: number } | null;
}

export interface Dia {
  id?: string;
  numero_dia: number;
  actividades: ActividadProgramada[];
}

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  destino_id: string | null;
  duracion_dias: number | null;
  noches: number | null;
  numero_viajeros: number | null;
  tipo_viajero: TipoViajero | null;
  presupuesto_por_persona_cop: number | null;
  estado: EstadoPlan;
  incluye: string | null;
  no_incluye: string | null;
  recomendaciones: string | null;
  origen_ia: boolean;
  creado_en: string;
  actualizado_en: string;
  destinos?: { nombre: string; pais: string } | null;
}

export interface PlanCompleto extends Plan {
  dias: Dia[];
  conceptos: Concepto[];
  costo_total_cop: number;
  costo_por_persona_cop: number | null;
}
