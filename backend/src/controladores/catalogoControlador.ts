import { Request, Response } from 'express';
import { catalogoServicio } from '../servicios/catalogoServicio';

const q = (req: Request, k: string) => (typeof req.query[k] === 'string' && req.query[k] ? (req.query[k] as string) : undefined);

export const catalogoControlador = {
  listarDestinos: async (req: Request, res: Response) => res.json(await catalogoServicio.listarDestinos(q(req, 'q'))),
  crearDestino: async (req: Request, res: Response) => res.status(201).json(await catalogoServicio.crearDestino(req.body)),
  actualizarDestino: async (req: Request, res: Response) => res.json(await catalogoServicio.actualizarDestino(req.params.id, req.body)),
  listarRecursos: async (req: Request, res: Response) =>
    res.json(await catalogoServicio.listarRecursos({ destino_id: q(req, 'destino_id'), tipo: q(req, 'tipo'), q: q(req, 'q') })),
  crearRecurso: async (req: Request, res: Response) => res.status(201).json(await catalogoServicio.crearRecurso(req.body)),
  actualizarRecurso: async (req: Request, res: Response) => res.json(await catalogoServicio.actualizarRecurso(req.params.id, req.body)),
};
