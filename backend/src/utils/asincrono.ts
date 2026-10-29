import { NextFunction, Request, RequestHandler, Response } from 'express';
export const asincrono =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };
