export type EstadoPlan = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
export type TipoViajero = 'FAMILIAS' | 'ADULTOS' | 'PAREJAS' | 'GRUPOS';
export type TipoRecurso = 'ALOJAMIENTO' | 'ACTIVIDAD' | 'TRANSPORTE';
export type UnidadCosto = 'HABITACION_NOCHE' | 'PERSONA' | 'SERVICIO';
export type FranjaHoraria = 'MANANA' | 'TARDE' | 'NOCHE';

export interface Destino { id: string; nombre: string; pais: string; descripcion: string | null }
export interface Recurso {
  id: string; destino_id: string; tipo: TipoRecurso; nombre: string; descripcion: string | null;
  costo_referencia_cop: number; unidad: UnidadCosto; destinos?: { nombre: string } | null;
}
export interface Concepto { recurso_id: string | null; descripcion: string; cantidad: number; unidad: UnidadCosto; costo_unitario_cop: number }
export interface ActividadProg { recurso_id: string; franja: FranjaHoraria; orden: number; recursos?: { nombre: string; tipo: TipoRecurso; costo_referencia_cop: number } | null }
export interface Dia { numero_dia: number; actividades: ActividadProg[] }

export interface PlanResumen {
  id: string; nombre: string; estado: EstadoPlan; destino_id: string | null; duracion_dias: number | null;
  numero_viajeros: number | null; costo_total_cop: number; costo_por_persona_cop: number | null;
  actualizado_en: string; origen_ia: boolean; destinos?: { nombre: string; pais: string } | null;
}
export interface PlanCompleto extends PlanResumen {
  descripcion: string | null; noches: number | null; tipo_viajero: TipoViajero | null;
  presupuesto_por_persona_cop: number | null; incluye: string | null; no_incluye: string | null;
  recomendaciones: string | null; dias: Dia[]; conceptos: Concepto[];
}

export interface Propuesta {
  destino_id: string; destino_nombre: string; duracion_dias: number; numero_viajeros: number; tipo_viajero: TipoViajero;
  presupuesto_por_persona_cop: number;
  dias: { numero_dia: number; actividades: { recurso_id: string; nombre: string; franja: FranjaHoraria }[] }[];
  alojamiento: { recurso_id: string; nombre: string } | null;
  transporte: { recurso_id: string; nombre: string } | null;
  recomendaciones: string; incluye: string; no_incluye: string;
  conceptos: Concepto[]; costo_total_cop: number; costo_por_persona_cop: number | null; supera_presupuesto: boolean;
}
