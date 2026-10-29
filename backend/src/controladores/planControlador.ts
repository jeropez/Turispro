import { Request, Response } from 'express';
import { planServicio } from '../servicios/planServicio';

export const planControlador = {
  listar: async (req: Request, res: Response) => res.json(await planServicio.listar((req as any).consulta ?? {})),
  crear: async (req: Request, res: Response) => res.status(201).json(await planServicio.crear(req.body, req.administrador!.sub)),
  obtener: async (req: Request, res: Response) => res.json(await planServicio.obtener(req.params.id)),
  actualizar: async (req: Request, res: Response) => res.json(await planServicio.actualizar(req.params.id, req.body)),
  validar: async (req: Request, res: Response) => res.json(await planServicio.validar(req.params.id)),
  publicar: async (req: Request, res: Response) => res.json(await planServicio.publicar(req.params.id)),
  archivar: async (req: Request, res: Response) => res.json(await planServicio.archivar(req.params.id)),
  volverAPublicar: async (req: Request, res: Response) => res.json(await planServicio.volverAPublicar(req.params.id)),
  ficha: async (req: Request, res: Response) => res.json(await planServicio.ficha(req.params.id)),
};
