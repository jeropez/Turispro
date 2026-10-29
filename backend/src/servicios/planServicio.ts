import { calcularCostos } from '../dominio/costos';
import { PlanCompleto } from '../dominio/tipos';
import { pendientesDePublicacion } from '../dominio/validacion';
import { destinoRepo } from '../repositorios/destinoRepo';
import { planRepo } from '../repositorios/planRepo';
import { ErrorApp } from '../utils/errores';

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function mapear(fila: any): PlanCompleto {
  const { dias_itinerario, conceptos_costo, ...resto } = fila;
  const dias = (dias_itinerario ?? [])
    .map((d: any) => ({
      id: d.id,
      numero_dia: d.numero_dia,
      actividades: (d.actividades_programadas ?? []).sort((a: any, b: any) => a.orden - b.orden),
    }))
    .sort((a: any, b: any) => a.numero_dia - b.numero_dia);
  const conceptos = (conceptos_costo ?? []).map((c: any) => ({
    ...c, cantidad: Number(c.cantidad), costo_unitario_cop: Number(c.costo_unitario_cop),
  }));
  const { total, porPersona } = calcularCostos(conceptos, resto.numero_viajeros);
  return {
    ...resto,
    presupuesto_por_persona_cop: num(resto.presupuesto_por_persona_cop),
    dias, conceptos, costo_total_cop: total, costo_por_persona_cop: porPersona,
  };
}

export const planServicio = {
  async obtener(id: string): Promise<PlanCompleto> {
    const fila = await planRepo.buscarPorId(id);
    if (!fila) throw new ErrorApp(404, 'El plan no existe.');
    return mapear(fila);
  },

  /** HU02: listado con filtro por estado y búsqueda por nombre. */
  async listar(f: { estado?: string; q?: string; destino_id?: string }) {
    const filas = await planRepo.listar(f);
    return filas.map(({ conceptos_costo, ...p }: any) => {
      const { total, porPersona } = calcularCostos(
        (conceptos_costo ?? []).map((c: any) => ({ cantidad: Number(c.cantidad), costo_unitario_cop: Number(c.costo_unitario_cop) })),
        p.numero_viajeros,
      );
      return { ...p, costo_total_cop: total, costo_por_persona_cop: porPersona };
    });
  },

  /** HU03: crea un borrador. Solo el nombre es obligatorio. */
  async crear(datos: any, administradorId: string) {
    await this.verificarDestino(datos.destino_id);
    const { id } = await planRepo.crear({
      ...this.columnas(datos), estado: 'BORRADOR', administrador_id: administradorId,
    });
    return this.obtener(id);
  },

  /** HU04: guarda datos, itinerario y costos. Editar nunca cambia el estado. */
  async actualizar(id: string, datos: any) {
    await this.obtener(id);
    await this.verificarDestino(datos.destino_id);
    if (datos.dias) {
      const numeros = datos.dias.map((d: any) => d.numero_dia);
      if (new Set(numeros).size !== numeros.length) throw new ErrorApp(400, 'Hay días repetidos en el itinerario.');
    }
    await planRepo.actualizarDatos(id, this.columnas(datos));
    if (datos.dias) await planRepo.reemplazarItinerario(id, datos.dias);
    if (datos.conceptos) await planRepo.reemplazarConceptos(id, datos.conceptos.map((c: any) => ({ ...c, recurso_id: c.recurso_id ?? null })));
    return this.obtener(id);
  },

  /** HU12: devuelve lo que falta para publicar (paso «Revisión» del editor). */
  async validar(id: string) {
    const plan = await this.obtener(id);
    return { pendientes: pendientesDePublicacion(plan), estado: plan.estado };
  },

  /** HU12: Borrador → Publicado, solo si la validación es correcta. */
  async publicar(id: string) {
    const plan = await this.obtener(id);
    if (plan.estado !== 'BORRADOR') throw new ErrorApp(409, 'Solo un borrador se puede publicar. Si está archivado, usa «volver a publicar».');
    return this.cambiarAPublicado(plan);
  },

  /** HU13: Publicado → Archivado. */
  async archivar(id: string) {
    const plan = await this.obtener(id);
    if (plan.estado !== 'PUBLICADO') throw new ErrorApp(409, 'Solo un plan publicado se puede archivar.');
    await planRepo.cambiarEstado(id, 'ARCHIVADO');
    return this.obtener(id);
  },

  /** HU13: Archivado → Publicado, con las mismas validaciones de publicación. */
  async volverAPublicar(id: string) {
    const plan = await this.obtener(id);
    if (plan.estado !== 'ARCHIVADO') throw new ErrorApp(409, 'Solo un plan archivado se puede volver a publicar.');
    return this.cambiarAPublicado(plan);
  },

  /** HU11: la ficha se deriva del plan guardado; no se almacena. */
  ficha: (id: string) => planServicio.obtener(id),

  async cambiarAPublicado(plan: PlanCompleto) {
    const pendientes = pendientesDePublicacion(plan);
    if (pendientes.length) throw new ErrorApp(422, 'El plan no se puede publicar todavía.', { pendientes });
    await planRepo.cambiarEstado(plan.id, 'PUBLICADO');
    return this.obtener(plan.id);
  },

  async verificarDestino(destinoId?: string | null) {
    if (destinoId && !(await destinoRepo.buscarPorId(destinoId))) throw new ErrorApp(400, 'El destino seleccionado no existe.');
  },

  columnas(d: any) {
    const noches = d.noches ?? (d.duracion_dias ? Math.max(d.duracion_dias - 1, 0) : null);
    return {
      nombre: d.nombre, descripcion: d.descripcion ?? null, destino_id: d.destino_id ?? null,
      duracion_dias: d.duracion_dias ?? null, noches, numero_viajeros: d.numero_viajeros ?? null,
      tipo_viajero: d.tipo_viajero ?? null, presupuesto_por_persona_cop: d.presupuesto_por_persona_cop ?? null,
      incluye: d.incluye ?? null, no_incluye: d.no_incluye ?? null, recomendaciones: d.recomendaciones ?? null,
    };
  },
};
