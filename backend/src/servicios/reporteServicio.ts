import { ESTADOS } from '../dominio/tipos';
import { redondear } from '../dominio/costos';
import { planServicio } from './planServicio';

/** HU14: reportes sobre las estimaciones registradas (no son ventas ni ingresos). */
export const reporteServicio = {
  async planesPorEstado(f: { destino_id?: string }) {
    const planes = await planServicio.listar({ destino_id: f.destino_id });
    const resumen = ESTADOS.map((estado) => ({ estado, cantidad: planes.filter((p: any) => p.estado === estado).length }));
    const detalle = planes.map((p: any) => ({
      nombre: p.nombre, destino: p.destinos?.nombre ?? 'Sin destino', estado: p.estado,
      costo_total_cop: p.costo_total_cop, costo_por_persona_cop: p.costo_por_persona_cop, actualizado_en: p.actualizado_en,
    }));
    return { resumen, detalle };
  },

  async costosPorDestino(f: { estado?: string }) {
    const planes = await planServicio.listar({ estado: f.estado });
    const grupos = new Map<string, any[]>();
    planes.forEach((p: any) => {
      const k = p.destinos?.nombre ?? 'Sin destino';
      grupos.set(k, [...(grupos.get(k) ?? []), p]);
    });
    return [...grupos.entries()].map(([destino, ps]) => {
      const conPersona = ps.filter((p) => p.costo_por_persona_cop !== null);
      const prom = (xs: number[]) => (xs.length ? redondear(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
      return {
        destino, planes: ps.length,
        costo_total_promedio_cop: prom(ps.map((p) => p.costo_total_cop)),
        costo_por_persona_promedio_cop: prom(conPersona.map((p) => p.costo_por_persona_cop)),
      };
    }).sort((a, b) => a.destino.localeCompare(b.destino));
  },
};
