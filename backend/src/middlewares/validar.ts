import { NextFunction, Request, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

export const validar = (esquema: ZodTypeAny, origen: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const r = esquema.parse(req[origen]);
    if (origen === 'body') req.body = r;
    else (req as any).consulta = r;
    next();
  };

const idEsquema = z.string().uuid();
export const validarId = (req: Request, _res: Response, next: NextFunction) => {
  idEsquema.parse(req.params.id);
  next();
};
