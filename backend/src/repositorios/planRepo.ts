import { supabase } from '../config/supabase';
import { ActividadProgramada, Concepto, EstadoPlan } from '../dominio/tipos';
import { verificar } from '../utils/baseDatos';

const SELECCION_COMPLETA =
  '*, destinos(nombre,pais), dias_itinerario(id,numero_dia, actividades_programadas(id,recurso_id,franja,orden, recursos(nombre,tipo,costo_referencia_cop))), conceptos_costo(id,recurso_id,descripcion,cantidad,unidad,costo_unitario_cop)';

export const planRepo = {
  async listar(f: { estado?: string; q?: string; destino_id?: string }) {
    let c = supabase
      .from('planes')
      .select('*, destinos(nombre,pais), conceptos_costo(cantidad,costo_unitario_cop)')
      .order('actualizado_en', { ascending: false });
    if (f.estado) c = c.eq('estado', f.estado);
    if (f.destino_id) c = c.eq('destino_id', f.destino_id);
    if (f.q) c = c.ilike('nombre', `%${f.q}%`);
    return verificar(await c) as any[];
  },
  async buscarPorId(id: string) {
    return verificar(await supabase.from('planes').select(SELECCION_COMPLETA).eq('id', id).maybeSingle()) as any | null;
  },
  async crear(d: Record<string, unknown>) {
    return verificar(await supabase.from('planes').insert(d).select('id').single()) as { id: string };
  },
  async actualizarDatos(id: string, d: Record<string, unknown>) {
    verificar(await supabase.from('planes').update({ ...d, actualizado_en: new Date().toISOString() }).eq('id', id).select('id'));
  },
  async cambiarEstado(id: string, estado: EstadoPlan) {
    verificar(await supabase.from('planes').update({ estado, actualizado_en: new Date().toISOString() }).eq('id', id).select('id'));
  },
  /** Reemplaza el itinerario completo. Las actividades se borran en cascada con los días. */
  async reemplazarItinerario(planId: string, dias: { numero_dia: number; actividades: Omit<ActividadProgramada, 'id'>[] }[]) {
    verificar(await supabase.from('dias_itinerario').delete().eq('plan_id', planId).select('id'));
    if (dias.length === 0) return;
    const creados = verificar(
      await supabase.from('dias_itinerario').insert(dias.map((d) => ({ plan_id: planId, numero_dia: d.numero_dia }))).select('id,numero_dia'),
    ) as { id: string; numero_dia: number }[];
    const filas = creados.flatMap((c) =>
      (dias.find((d) => d.numero_dia === c.numero_dia)?.actividades ?? []).map((a) => ({
        dia_id: c.id, recurso_id: a.recurso_id, franja: a.franja, orden: a.orden,
      })),
    );
    if (filas.length) verificar(await supabase.from('actividades_programadas').insert(filas).select('id'));
  },
  async reemplazarConceptos(planId: string, conceptos: Omit<Concepto, 'id'>[]) {
    verificar(await supabase.from('conceptos_costo').delete().eq('plan_id', planId).select('id'));
    if (conceptos.length === 0) return;
    verificar(
      await supabase.from('conceptos_costo').insert(conceptos.map((c) => ({ ...c, plan_id: planId }))).select('id'),
    );
  },
};
