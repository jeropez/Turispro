import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { entorno } from './config/entorno';
import { manejarErrores, noEncontrada } from './middlewares/errores';
import rutas from './rutas';

export const aplicacion = express();
aplicacion.set('trust proxy', 1);
aplicacion.use(helmet());
const origenesPermitidos = entorno.FRONTEND_URL.split(',')
     .map((u) => u.trim().replace(/\/$/, ''))
     .filter(Boolean)
     .map((u) => (u.includes('*') ? new RegExp('^' + u.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+') + '$') : u));
   aplicacion.use(cors({ origin: origenesPermitidos }));
aplicacion.use(express.json({ limit: '1mb' }));
aplicacion.use('/api', rutas);
aplicacion.use(noEncontrada);
aplicacion.use(manejarErrores);
