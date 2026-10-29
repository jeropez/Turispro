import { Request, Response } from 'express';
import { reporteServicio } from '../servicios/reporteServicio';
import { aCsv } from '../utils/csv';

const csv = (res: Response, nombre: string, contenido: string) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}.csv"`);
  res.send(contenido);
};

export const reporteControlador = {
  planesPorEstado: async (req: Request, res: Response) => {
    const f = (req as any).consulta ?? {};
    const datos = await reporteServicio.planesPorEstado(f);
    if (f.formato === 'csv')
      return csv(res, 'planes-por-estado', aCsv(['Nombre', 'Destino', 'Estado', 'Costo total (COP)', 'Costo por persona (COP)', 'Actualizado'], datos.detalle,
        ['nombre', 'destino', 'estado', 'costo_total_cop', 'costo_por_persona_cop', 'actualizado_en']));
    res.json(datos);
  },
  costosPorDestino: async (req: Request, res: Response) => {
    const f = (req as any).consulta ?? {};
    const datos = await reporteServicio.costosPorDestino(f);
    if (f.formato === 'csv')
      return csv(res, 'costos-por-destino', aCsv(['Destino', 'Planes', 'Costo total promedio (COP)', 'Costo por persona promedio (COP)'], datos,
        ['destino', 'planes', 'costo_total_promedio_cop', 'costo_por_persona_promedio_cop']));
    res.json(datos);
  },
};
