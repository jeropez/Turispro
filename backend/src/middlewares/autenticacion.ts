import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno';
import { ErrorApp } from '../utils/errores';

export interface Sesion { sub: string; nombre: string }
declare global { namespace Express { interface Request { administrador?: Sesion } } }

/** Exige un JWT válido en el encabezado Authorization: Bearer <token>. */
export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization;
  if (!cabecera?.startsWith('Bearer ')) throw new ErrorApp(401, 'Debes iniciar sesión.');
  try {
    const p = jwt.verify(cabecera.slice(7), entorno.JWT_SECRETO, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    req.administrador = { sub: String(p.sub), nombre: String(p.nombre ?? '') };
    next();
  } catch {
    throw new ErrorApp(401, 'Tu sesión es inválida o venció. Inicia sesión de nuevo.');
  }
}
