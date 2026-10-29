import { Request, Response } from 'express';
import { iaServicio } from '../servicios/iaServicio';

export const iaControlador = {
  propuesta: async (req: Request, res: Response) => res.json(await iaServicio.generarPropuesta(req.body)),
  usar: async (req: Request, res: Response) => res.status(201).json(await iaServicio.usarPropuesta(req.body, req.administrador!.sub)),
};
