import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorApp } from '../utils/errores';

export function noEncontrada(_req: Request, res: Response) {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}

export function manejarErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalle: err.issues.map((i) => `${i.path.join('.') || 'cuerpo'}: ${i.message}`),
    });
  }
  if (err instanceof ErrorApp) {
    if (err.estado >= 500) console.error('[error]', err.message, err.detalle);
    return res.status(err.estado).json({ error: err.message, detalle: err.estado < 500 ? err.detalle : undefined });
  }
  console.error('[error no controlado]', err);
  res.status(500).json({ error: 'Ocurrió un error inesperado.' });
}
