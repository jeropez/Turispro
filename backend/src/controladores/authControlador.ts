import { Request, Response } from 'express';
import { authServicio } from '../servicios/authServicio';

export const authControlador = {
  login: async (req: Request, res: Response) => res.json(await authServicio.iniciarSesion(req.body.correo, req.body.contrasena)),
  /** El JWT no se guarda en el servidor: cerrar sesión consiste en descartarlo en el cliente. */
  yo: async (req: Request, res: Response) => res.json({ administrador: req.administrador }),
};
