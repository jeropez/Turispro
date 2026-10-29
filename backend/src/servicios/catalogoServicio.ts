import { UNIDAD_POR_TIPO, TipoRecurso } from '../dominio/tipos';
import { destinoRepo } from '../repositorios/destinoRepo';
import { recursoRepo } from '../repositorios/recursoRepo';
import { ErrorApp } from '../utils/errores';

/** HU07 y HU08: destinos y recursos del catálogo. No hay eliminación definitiva. */
export const catalogoServicio = {
  listarDestinos: (q?: string) => destinoRepo.listar(q),
  crearDestino: (d: { nombre: string; pais: string; descripcion?: string | null }) =>
    destinoRepo.crear({ nombre: d.nombre, pais: d.pais, descripcion: d.descripcion ?? null }),
  async actualizarDestino(id: string, d: { nombre: string; pais: string; descripcion?: string | null }) {
    const r = await destinoRepo.actualizar(id, { nombre: d.nombre, pais: d.pais, descripcion: d.descripcion ?? null });
    if (!r) throw new ErrorApp(404, 'El destino no existe.');
    return r;
  },
  listarRecursos: (f: { destino_id?: string; tipo?: string; q?: string }) => recursoRepo.listar(f),
  async crearRecurso(d: { destino_id: string; tipo: string; nombre: string; descripcion?: string | null; costo_referencia_cop: number }) {
    if (!(await destinoRepo.buscarPorId(d.destino_id))) throw new ErrorApp(400, 'El destino seleccionado no existe.');
    const tipo = d.tipo as TipoRecurso;
    return recursoRepo.crear({ destino_id: d.destino_id, tipo, nombre: d.nombre, descripcion: d.descripcion ?? null, costo_referencia_cop: d.costo_referencia_cop, unidad: UNIDAD_POR_TIPO[tipo] });
  },
  /** Actualizar la tarifa NO modifica los planes ya guardados: sus conceptos guardan una copia. */
  async actualizarRecurso(id: string, d: { destino_id: string; tipo: string; nombre: string; descripcion?: string | null; costo_referencia_cop: number }) {
    const tipo = d.tipo as TipoRecurso;
    const r = await recursoRepo.actualizar(id, { destino_id: d.destino_id, tipo, nombre: d.nombre, descripcion: d.descripcion ?? null, costo_referencia_cop: d.costo_referencia_cop, unidad: UNIDAD_POR_TIPO[tipo] });
    if (!r) throw new ErrorApp(404, 'El recurso no existe.');
    return r;
  },
};
